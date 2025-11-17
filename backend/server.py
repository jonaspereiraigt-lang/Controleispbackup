from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
import re
import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
import urllib.parse
import brazilnum.cnpj as cnpj_utils
import brazilnum.cpf as cpf_utils
# MERCADO PAGO INTEGRATION DISABLED - Will be replaced with Efi Bank
# import mercadopago

# EFI BANK INTEGRATION
from efi_service import get_efi_service

import qrcode
from io import BytesIO
import base64
import json
import hmac
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
import io
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
import cloudinary
import cloudinary.uploader
import cloudinary.api
import boto3
from botocore.exceptions import ClientError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure Cloudinary (Legacy - keeping for backward compatibility)
cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
api_key = os.environ.get('CLOUDINARY_API_KEY')
api_secret = os.environ.get('CLOUDINARY_API_SECRET')

print(f"[CLOUDINARY-CONFIG] Cloud Name: {cloud_name}")
print(f"[CLOUDINARY-CONFIG] API Key: {api_key}")
print(f"[CLOUDINARY-CONFIG] API Secret: {'*' * len(api_secret) if api_secret else 'None'}")

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True
)

# Configure Cloudflare R2
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME')
R2_ENDPOINT_URL = os.environ.get('R2_ENDPOINT_URL')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL')

print(f"[R2-CONFIG] Account ID: {R2_ACCOUNT_ID}")
print(f"[R2-CONFIG] Bucket Name: {R2_BUCKET_NAME}")
print(f"[R2-CONFIG] Endpoint: {R2_ENDPOINT_URL}")
print(f"[R2-CONFIG] Public URL: {R2_PUBLIC_URL}")
print(f"[R2-CONFIG] Access Key ID: {R2_ACCESS_KEY_ID[:10]}..." if R2_ACCESS_KEY_ID else "[R2-CONFIG] Access Key ID: None")

# Initialize R2 client
s3_client = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT_URL,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name='auto'
)

print(f"[R2-CONFIG] Cliente S3 inicializado com sucesso")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="ControleIsp", description="Sistema de Gestão de Clientes Negativos")

# Create uploads directory and mount static files
uploads_dir = Path("/app/uploads")
uploads_dir.mkdir(exist_ok=True)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email Configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.zoho.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
EMAIL_FROM = os.environ.get('EMAIL_FROM')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'ControleIsp')

# Mercado Pago Configuration
# MERCADO PAGO INTEGRATION DISABLED - Will be replaced with Efi Bank
# MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN')
# MERCADOPAGO_PUBLIC_KEY = os.environ.get('MERCADOPAGO_PUBLIC_KEY')
# MERCADOPAGO_WEBHOOK_SECRET = os.environ.get('MERCADOPAGO_WEBHOOK_SECRET')

# Initialize Mercado Pago SDK
# mp_sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

security = HTTPBearer()

# Initialize APScheduler for auto-sync
scheduler = AsyncIOScheduler()

# Function to run auto-sync task
async def run_scheduled_auto_sync():
    """Background task to check and run auto-sync for integrations"""
    try:
        from datetime import datetime, time as dt_time
        
        now = datetime.now()
        current_time_str = now.strftime("%H:%M")
        
        print(f"\n{'='*80}")
        print(f"🕐 SCHEDULER AUTO-SYNC VERIFICANDO às {current_time_str}")
        print(f"{'='*80}\n")
        
        # Find all integrations with auto_sync_enabled = True
        integrations = await db.provider_integrations.find({
            "auto_sync_enabled": True,
            "is_active": True
        }).to_list(length=None)
        
        print(f"📊 Encontradas {len(integrations)} integrações com auto-sync ativo")
        
        if not integrations:
            print("⏭️  Nenhuma integração com auto-sync ativo. Aguardando...")
            return
        
        for integration in integrations:
            # Check if it's time to sync (compare time only)
            auto_sync_time = integration.get("auto_sync_time", "05:00")
            
            # Allow a 1-minute window for sync (executado a cada 1 minuto)
            hour, minute = map(int, auto_sync_time.split(":"))
            sync_time = dt_time(hour, minute)
            current_time = dt_time(now.hour, now.minute)
            
            # Check if current time matches sync time
            if current_time == sync_time:
                integration_name = integration.get("display_name", "Sem nome")
                integration_type = integration["integration_type"]
                provider_id = integration["provider_id"]
                
                print(f"\n🚀 INICIANDO SINCRONIZAÇÃO:")
                print(f"   📋 Integração: {integration_name}")
                print(f"   🔧 Tipo: {integration_type.upper()}")
                print(f"   ⏰ Horário: {auto_sync_time}")
                
                try:
                    # Run sync based on integration type
                    if integration_type == "ixc":
                        sync_result = await sync_ixc_data(integration, provider_id)
                    elif integration_type == "mk-auth":
                        sync_result = await sync_mkauth_data(integration, provider_id)
                    elif integration_type == "sgp":
                        sync_result = await sync_sgp_data(integration, provider_id)
                    elif integration_type == "radiusnet":
                        sync_result = await sync_radiusnet_data(integration, provider_id)
                    else:
                        sync_result = {
                            "status": "error",
                            "message": f"Tipo de integração não suportado: {integration_type}"
                        }
                    
                    # Update last_sync
                    await db.provider_integrations.update_one(
                        {"id": integration["id"]},
                        {
                            "$set": {
                                "last_sync": datetime.now(timezone.utc).isoformat(),
                                "last_sync_status": sync_result.get("status", "error"),
                                "last_sync_message": sync_result.get("message", ""),
                                "sync_count": integration.get("sync_count", 0) + 1
                            }
                        }
                    )
                    
                    if sync_result.get("status") == "success":
                        print(f"   ✅ SUCESSO: {sync_result.get('message')}")
                        print(f"   📊 Clientes sincronizados: {sync_result.get('clients_synced', 0)}")
                    else:
                        print(f"   ❌ ERRO: {sync_result.get('message')}")
                    
                except Exception as e:
                    print(f"   ❌ ERRO CRÍTICO: {str(e)}")
                    await db.provider_integrations.update_one(
                        {"id": integration["id"]},
                        {
                            "$set": {
                                "last_sync": datetime.now(timezone.utc).isoformat(),
                                "last_sync_status": "error",
                                "last_sync_message": f"Erro: {str(e)}"
                            }
                        }
                    )
        
        print(f"\n{'='*80}")
        print(f"✅ SCHEDULER AUTO-SYNC FINALIZADO")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"\n❌ ERRO NO SCHEDULER AUTO-SYNC: {str(e)}\n")


# Utility Functions
def validate_cpf(cpf: str) -> bool:
    """Valida CPF brasileiro usando brazilnum"""
    cpf = re.sub(r'[^0-9]', '', cpf)
    return cpf_utils.validate_cpf(cpf)


async def lookup_cpf_data(cpf: str) -> dict:
    """Valida e formata CPF (consulta de dados pessoais protegida por LGPD)"""
    try:
        cpf_clean = re.sub(r'[^0-9]', '', cpf)
        
        if not validate_cpf(cpf_clean):
            raise HTTPException(status_code=400, detail="CPF inválido")
        
        # Por questões de privacidade (LGPD), não fazemos consulta de dados pessoais
        # Apenas validamos o formato e retornamos o CPF formatado
        return {
            "success": True,
            "cpf": cpf_utils.format_cpf(cpf_clean),
            "valid": True,
            "formatted": cpf_utils.format_cpf(cpf_clean),
            "message": "CPF válido - Dados pessoais protegidos pela LGPD"
        }
        
    except Exception as e:
        return {"error": f"Erro na validação: {str(e)}"}


async def lookup_cep_data(cep: str) -> dict:
    """Consulta dados de endereço pelo CEP usando ViaCEP"""
    try:
        cep_clean = re.sub(r'[^0-9]', '', cep)
        
        if len(cep_clean) != 8:
            raise HTTPException(status_code=400, detail="CEP deve conter 8 dígitos")
        
        # Formatar CEP
        cep_formatted = f"{cep_clean[:5]}-{cep_clean[5:]}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://viacep.com.br/ws/{cep_clean}/json/"
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verifica se CEP existe
                if data.get('erro'):
                    return {"error": "CEP não encontrado"}
                
                return {
                    "success": True,
                    "cep": cep_formatted,
                    "logradouro": data.get('logradouro', ''),
                    "complemento": data.get('complemento', ''),
                    "bairro": data.get('bairro', ''),
                    "localidade": data.get('localidade', ''),  # Cidade
                    "uf": data.get('uf', ''),
                    "ibge": data.get('ibge', ''),
                    "gia": data.get('gia', ''),
                    "ddd": data.get('ddd', ''),
                    "siafi": data.get('siafi', '')
                }
            else:
                return {"error": "Serviço de consulta CEP temporariamente indisponível"}
                
    except httpx.TimeoutException:
        return {"error": "Timeout na consulta do CEP"}
    except Exception as e:
        return {"error": f"Erro na consulta: {str(e)}"}


def validate_cnpj(cnpj: str) -> bool:
    """Valida CNPJ brasileiro usando brazilnum"""
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    return cnpj_utils.validate_cnpj(cnpj)


async def lookup_cnpj_data(cnpj: str) -> dict:
    """Consulta dados da empresa pelo CNPJ usando ReceitaWS"""
    try:
        cnpj_clean = re.sub(r'[^0-9]', '', cnpj)
        
        if not validate_cnpj(cnpj_clean):
            raise HTTPException(status_code=400, detail="CNPJ inválido")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://receitaws.com.br/v1/cnpj/{cnpj_clean}"
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ERROR':
                    return {"error": data.get('message', 'CNPJ não encontrado')}
                
                return {
                    "success": True,
                    "nome": data.get('nome', ''),
                    "fantasia": data.get('fantasia', ''),
                    "cnpj": cnpj_utils.format_cnpj(cnpj_clean),
                    "situacao": data.get('situacao', ''),
                    "abertura": data.get('abertura', ''),
                    "natureza_juridica": data.get('natureza_juridica', ''),
                    "endereco": {
                        "logradouro": data.get('logradouro', ''),
                        "numero": data.get('numero', ''),
                        "complemento": data.get('complemento', ''),
                        "bairro": data.get('bairro', ''),
                        "municipio": data.get('municipio', ''),
                        "uf": data.get('uf', ''),
                        "cep": data.get('cep', '')
                    },
                    "telefone": data.get('telefone', ''),
                    "email": data.get('email', ''),
                    "capital_social": data.get('capital_social', ''),
                    "porte": data.get('porte', ''),
                    "atividade_principal": data.get('atividade_principal', [])
                }
            else:
                return {"error": "Serviço de consulta temporariamente indisponível"}
                
    except httpx.TimeoutException:
        return {"error": "Timeout na consulta do CNPJ"}
    except Exception as e:
        return {"error": f"Erro na consulta: {str(e)}"}


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_file_url(filename: str, custom_domain: str = None) -> str:
    """Generate the correct file URL for both development and production"""
    
    # If custom domain is provided, use it (for user's production domain)
    if custom_domain:
        # Ensure the domain starts with https://
        if not custom_domain.startswith('http'):
            custom_domain = f"https://{custom_domain}"
        return f"{custom_domain}/uploads/{filename}"
    
    # Use environment variable
    frontend_url = os.environ.get('FRONTEND_URL', '')
    
    # In production (when FRONTEND_URL is set with https://)
    if frontend_url and frontend_url.startswith('https://'):
        # Use the same domain as frontend for serving files
        # This works with any production domain
        return f"{frontend_url}/uploads/{filename}"
    else:
        # Local development - relative URL  
        return f"/uploads/{filename}"


def generate_contract_pdf(contract_text: str, title: str, filename: str) -> Path:
    """Generate PDF contract document"""
    
    # Create contracts directory
    contracts_dir = Path("/app/uploads/contracts")
    contracts_dir.mkdir(parents=True, exist_ok=True)
    
    # Full file path
    pdf_path = contracts_dir / f"{filename}.pdf"
    
    # Create PDF document
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#DC2626')  # Red color matching the theme
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#DC2626')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        leading=14
    )
    
    signature_style = ParagraphStyle(
        'SignatureStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_RIGHT,
        textColor=colors.HexColor('#666666')
    )
    
    # Build document content
    story = []
    
    # Add title
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 20))
    
    # Split contract text into sections and paragraphs
    sections = contract_text.split('\n\n')
    
    for section in sections:
        if not section.strip():
            continue
            
        # Check if it's a heading (starts with numbers or uppercase)
        if (section.strip().startswith(tuple('123456789')) or 
            (len(section.split()) <= 8 and section.isupper())):
            story.append(Paragraph(section.strip(), heading_style))
        else:
            # Regular paragraph
            # Replace line breaks with proper spacing
            formatted_section = section.strip().replace('\n', '<br/>')
            story.append(Paragraph(formatted_section, body_style))
    
    # Add signature section
    story.append(Spacer(1, 30))
    story.append(Paragraph("Documento gerado digitalmente pelo Sistema ControleIsp", signature_style))
    story.append(Paragraph(f"Data de geração: {datetime.now(timezone.utc).strftime('%d/%m/%Y às %H:%M:%S UTC')}", signature_style))
    
    # Build PDF
    doc.build(story)
    
    return pdf_path


def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(64)


def send_email(to_email: str, subject: str, body_html: str, body_text: str = None):
    """Send email using Zoho Mail SMTP"""
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        msg["To"] = to_email
        
        # Add text and HTML parts
        if body_text:
            text_part = MIMEText(body_text, "plain")
            msg.attach(text_part)
            
        html_part = MIMEText(body_html, "html")
        msg.attach(html_part)
        
        # Connect to server and send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def create_password_reset_email(email: str, token: str) -> tuple:
    """Create password reset email content"""
    reset_url = f"{os.environ.get('FRONTEND_URL')}/reset-password?token={token}"
    
    subject = "ControleIsp - Recuperação de Senha"
    
    # HTML email template
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - ControleIsp</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin-bottom: 10px;">ControleIsp</h1>
                <p style="color: #666; margin: 0;">Sistema de Gestão de Clientes Negativos</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Recuperação de Senha</h2>
            
            <p style="color: #555; margin-bottom: 20px;">
                Olá,<br><br>
                Você solicitou a redefinição de senha para sua conta no ControleIsp.
                Para prosseguir com a alteração, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" 
                   style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Redefinir Senha
                </a>
            </div>
            
            <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
                <strong>Link direto:</strong><br>
                <a href="{reset_url}" style="color: #dc2626; word-break: break-all;">{reset_url}</a>
            </p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #dc2626; margin: 0; font-size: 14px;">
                    <strong>Importante:</strong> Este link é válido por apenas 1 hora por segurança.
                    Se você não solicitou esta alteração, ignore este email.
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
                <p style="margin: 5px 0;">Desenvolvido para Provedores de Internet em Todo o Brasil</p>
                <p style="margin: 5px 0;">CNPJ: 47.223.088/0001-74</p>
                <p style="margin: 5px 0;">© 2025 ControleIsp - Todos os Direitos Reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    ControleIsp - Recuperação de Senha
    
    Olá,
    
    Você solicitou a redefinição de senha para sua conta no ControleIsp.
    Para prosseguir com a alteração, acesse o link abaixo:
    
    {reset_url}
    
    IMPORTANTE: Este link é válido por apenas 1 hora por segurança.
    Se você não solicitou esta alteração, ignore este email.
    
    ---
    Desenvolvido para Provedores de Internet em Todo o Brasil
    CNPJ: 47.223.088/0001-74
    © 2025 ControleIsp - Todos os Direitos Reservados
    """
    
    return subject, html_body, text_body


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "user_type": user_type}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_provider(current_user=Depends(get_current_user)):
    """Get current provider and verify if not blocked"""
    if current_user["user_type"] != "provider":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if provider is blocked
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    if provider.get("is_blocked", False):
        blocked_reason = provider.get("blocked_reason", "Conta bloqueada pelo administrador")
        raise HTTPException(status_code=403, detail=f"Conta bloqueada: {blocked_reason}")
    
    if not provider.get("is_active", True):
        raise HTTPException(status_code=403, detail="Conta inativa")
    
    return current_user


async def get_current_admin(current_user=Depends(get_current_user)):
    """Get current admin user"""
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado - Apenas administradores")
    return current_user


# Models
class AdminCreate(BaseModel):
    username: str
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProviderCreate(BaseModel):
    name: str
    nome_fantasia: str  # Nome fantasia obrigatório
    email: EmailStr
    password: str
    cnpj: str
    phone: str
    address: str  # Endereço sem bairro
    bairro: str  # Bairro separado
    id_front_photo: str  # Obrigatório
    id_back_photo: str   # Obrigatório
    holding_id_photo: str  # Obrigatório
    contract_accepted: bool


class ProviderLogin(BaseModel):
    username: str
    password: str


class Provider(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    nome_fantasia: str  # Nome fantasia obrigatório
    email: str
    username: str
    password_hash: str
    cnpj: str
    phone: str
    address: str  # Endereço sem bairro
    bairro: str  # Bairro separado
    is_active: bool = True
    is_blocked: bool = False  # Status de bloqueio
    blocked_at: Optional[datetime] = None
    blocked_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    id_front_photo: Optional[str] = None
    id_back_photo: Optional[str] = None
    holding_id_photo: Optional[str] = None
    logo_url: Optional[str] = None  # Logo/foto do provedor
    contract_accepted: bool = False
    contract_acceptance_date: Optional[datetime] = None
    contract_ip: Optional[str] = None
    contract_version: str = "1.0"
    financial_generated: bool = False  # Se o admin já gerou o financeiro
    approved: bool = False  # Se foi aprovado pelo admin
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClientCreate(BaseModel):
    name: str
    cpf: str
    email: EmailStr
    phone: str
    address: str
    bairro: str
    debt_amount: float
    reason: str  # Motivo da inclusão
    inclusion_date: str  # Data da inclusão (formato YYYY-MM-DD)
    observations: str = ""  # Observações finais (opcional)
    risk_level: int = 1  # Nível de risco de 1 a 5


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider_id: str
    name: str
    cpf: str
    email: str
    phone: str
    address: str
    bairro: str
    debt_amount: float
    reason: str  # Campo renomeado de inclusion_reason para reason
    inclusion_date: str  # Aceita string ou converte datetime para string
    observations: str = ""  # Observações finais
    is_active: bool = True
    risk_level: int = 1  # Nível de risco de 1 a 5
    
    @classmethod
    def from_mongo(cls, data: dict):
        """Convert MongoDB document to Client model"""
        if isinstance(data.get('inclusion_date'), datetime):
            data['inclusion_date'] = data['inclusion_date'].date().isoformat()
        return cls(**data)


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class Subscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider_id: str
    payment_status: str = "pending"  # pending, active, expired, cancelled, promotional
    payment_id: Optional[str] = None
    pix_qr_code: Optional[str] = None
    pix_qr_base64: Optional[str] = None
    amount: float = 99.00
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))
    reminder_sent: bool = False
    is_promotional: bool = False  # Promoção ativa
    promotional_type: Optional[str] = None  # "first_month_free", "black_friday", etc
    promotional_months_remaining: int = 0  # Quantos meses promocionais restam (para Black Friday = 3)


class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider_id: str
    subscription_id: str
    payment_id: str  # ID do Mercado Pago
    payment_status: str = "pending"  # pending, approved, rejected, cancelled
    amount: float = 99.00
    payment_method: str = "pix"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None


class PaymentRequest(BaseModel):
    amount: Optional[float] = 199.00  # Default monthly amount


class PasswordResetToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    token_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False


class ProviderBlockRequest(BaseModel):
    reason: Optional[str] = "Bloqueado pelo administrador"


class ProviderActionResponse(BaseModel):
    success: bool
    message: str
    provider_id: str


class ProviderStats(BaseModel):
    id: str
    name: str
    nome_fantasia: str
    email: str
    cnpj: str
    phone: str
    address: str  # Endereço sem bairro
    bairro: str  # Bairro separado
    logo_url: Optional[str] = None  # URL do logo no R2
    is_active: bool = True
    is_blocked: bool = False
    blocked_at: Optional[datetime] = None
    blocked_reason: Optional[str] = None
    created_at: datetime
    # Statistics
    clients_count: int = 0
    total_debt: float = 0.0
    avg_debt: float = 0.0
    highest_debt: float = 0.0
    # Subscription info
    subscription_status: str = "none"  # none, promotional, active, expired
    subscription_type: Optional[str] = None  # first_month_free, etc
    subscription_expires_at: Optional[datetime] = None
    days_remaining: Optional[int] = None
    is_promotional: bool = False


class ClientSummary(BaseModel):
    id: str
    name: str
    cpf: str
    email: str
    phone: str
    address: str
    bairro: str
    debt_amount: float
    reason: str
    inclusion_date: datetime
    risk_level: int = 1


class ProviderClientsResponse(BaseModel):
    provider_id: str
    provider_name: str
    clients: List[ClientSummary]
    total_clients: int
    total_debt: float


class ClientPhoneUpdate(BaseModel):
    phone: str


class CrossProviderClient(BaseModel):
    id: str
    name: str
    cpf: str
    address: str
    bairro: str
    debt_amount: float
    reason: str
    inclusion_date: datetime
    risk_level: int = 1
    # Provider info (who registered the client)
    provider_name: str
    provider_cnpj: str
    provider_logo: Optional[str] = None
    provider_notes: Optional[str] = None
    days_negative: int


class ClientSearchRequest(BaseModel):
    search_term: str
    search_type: str  # "name", "cpf", "address"

class PaymentReminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    provider_id: str
    reminder_date: str  # ISO format date string
    amount: float
    notes: str = ""
    sent: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    sent_at: str = None

class PaymentReminderCreate(BaseModel):
    client_id: str
    reminder_date: str
    amount: float
    notes: str = ""

class PaymentReminderResponse(BaseModel):
    success: bool
    message: str
    reminder: PaymentReminder = None


# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    scheduled_for: Optional[datetime] = None
    is_active: bool = True

class NotificationCreate(BaseModel):
    message: str
    scheduled_for: Optional[str] = None  # Data/hora para exibir (formato ISO)

class NotificationRead(BaseModel):
    id: Optional[str] = None
    provider_id: str
    notification_id: str
    read_at: datetime

# Provider Profile Update Models
class ProviderProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class ProviderPasswordUpdate(BaseModel):
    old_password: str
    new_password: str


class Visitor(BaseModel):
    id: Optional[str] = None
    ip_address: str
    user_agent: str
    first_visit: datetime
    last_visit: datetime
    visit_count: int = 1
    country: Optional[str] = None
    city: Optional[str] = None


class VisitorStats(BaseModel):
    total_visitors: int
    total_visits: int
    today_visitors: int
    this_month_visitors: int


class SystemSettings(BaseModel):
    id: Optional[str] = None
    payment_required: bool = False  # Sistema gratuito por padrão
    payment_enabled_at: Optional[datetime] = None
    payment_disabled_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IntegrationType(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    logo_url: Optional[str] = None
    is_active: bool = True
    required_fields: List[str] = []
    optional_fields: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProviderIntegration(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    provider_id: str
    integration_type: str  # ixc, mk-auth, radius, etc
    display_name: str
    api_url: str
    credentials: Dict[str, str] = {}  # Encrypted storage
    settings: Dict[str, Any] = {}
    is_active: bool = True
    last_sync: Optional[datetime] = None
    last_sync_status: str = "never"  # never, success, error, in_progress
    last_sync_message: Optional[str] = None
    sync_count: int = 0
    error_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IntegrationSyncResult(BaseModel):
    integration_id: str
    provider_id: str
    status: str  # success, error, partial
    clients_synced: int = 0
    clients_failed: int = 0
    total_debt_amount: float = 0
    execution_time: float = 0
    error_message: Optional[str] = None
    sync_details: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Auth Routes
@api_router.post("/auth/admin/login", response_model=Token)
async def admin_login(admin_data: AdminLogin):
    admin = await db.admins.find_one({"username": admin_data.username})
    if not admin or not verify_password(admin_data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin["id"], "user_type": "admin"}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_type": "admin"
    }


@api_router.post("/auth/provider/login", response_model=Token)
async def provider_login(provider_data: ProviderLogin):
    # Aceita tanto email quanto username para login (para manter compatibilidade)
    provider = await db.providers.find_one({
        "$or": [
            {"email": provider_data.username, "is_active": True},
            {"username": provider_data.username, "is_active": True}
        ]
    })
    if not provider or not verify_password(provider_data.password, provider["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": provider["id"], 
            "user_type": "provider",
            "name": provider.get("name", ""),
            "cnpj": provider.get("cnpj", "")
        }, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_type": "provider"
    }


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email to provider"""
    try:
        # Check if provider exists (but don't reveal if email exists or not)
        provider = await db.providers.find_one({"email": request.email, "is_active": True})
        
        if provider:
            # Generate secure reset token
            reset_token = generate_reset_token()
            token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
            
            # Set expiration time (1 hour)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            
            # Store reset token in database
            reset_token_doc = PasswordResetToken(
                email=request.email,
                token_hash=token_hash,
                expires_at=expires_at
            )
            
            reset_token_dict = reset_token_doc.dict()
            reset_token_dict["created_at"] = reset_token_dict["created_at"].isoformat()
            reset_token_dict["expires_at"] = reset_token_dict["expires_at"].isoformat()
            
            # Remove any existing unused tokens for this email
            await db.password_reset_tokens.delete_many({
                "email": request.email,
                "used": False
            })
            
            # Insert new token
            await db.password_reset_tokens.insert_one(reset_token_dict)
            
            # Create and send email
            subject, html_body, text_body = create_password_reset_email(request.email, reset_token)
            
            if SMTP_USERNAME and SMTP_PASSWORD:
                email_sent = send_email(request.email, subject, html_body, text_body)
                if not email_sent:
                    raise HTTPException(status_code=500, detail="Erro ao enviar email - Verifique as configurações SMTP")
            else:
                # Modo demonstração - em produção configure o SMTP
                print(f"[DEMO] Email seria enviado para: {request.email}")
                print(f"[DEMO] Link de reset: {os.environ.get('FRONTEND_URL')}/reset-password?token={reset_token}")
                print("[DEMO] Configure SMTP do Zoho Mail no .env para envio real")
                # Não falha em modo demo
        
        # Always return success to prevent email enumeration
        return {"message": "Se o email estiver cadastrado, você receberá instruções de recuperação"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in forgot_password: {e}")
        return {"message": "Se o email estiver cadastrado, você receberá instruções de recuperação"}


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()
        
        # Find the reset token
        reset_token = await db.password_reset_tokens.find_one({
            "token_hash": token_hash,
            "used": False
        })
        
        if not reset_token:
            raise HTTPException(status_code=400, detail="Token inválido ou expirado")
        
        # Check if token is expired
        expires_at = datetime.fromisoformat(reset_token["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Token expirado")
        
        # Find the provider
        provider = await db.providers.find_one({
            "email": reset_token["email"],
            "is_active": True
        })
        
        if not provider:
            raise HTTPException(status_code=400, detail="Usuário não encontrado")
        
        # Update provider password
        new_password_hash = hash_password(request.new_password)
        await db.providers.update_one(
            {"email": reset_token["email"]},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        # Mark token as used
        await db.password_reset_tokens.update_one(
            {"_id": reset_token["_id"]},
            {"$set": {"used": True}}
        )
        
        # Remove all other unused tokens for this email
        await db.password_reset_tokens.delete_many({
            "email": reset_token["email"],
            "used": False
        })
        
        return {"message": "Senha alterada com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in reset_password: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


# =============================================================================
# EFI BANK PAYMENT FUNCTIONS
# =============================================================================

async def create_efi_boleto_payment(provider_id: str, amount: float = 199.00):
    """Create boleto payment with Efi Bank for provider subscription"""
    try:
        # Get provider info
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        # Prepare provider data
        provider_data = {
            "provider_id": provider_id,
            "name": provider["name"],
            "email": provider["email"],
            "cpf": provider.get("cpf", ""),
            "phone": provider.get("phone", "")
        }
        
        # Create boleto via Efi Bank
        result = get_efi_service().create_boleto_charge(provider_data, amount, due_days=3)
        
        if result.get("success"):
            return {
                "success": True,
                "payment_type": "boleto",
                "charge_id": result["charge_id"],
                "barcode": result["barcode"],
                "link": result["link"],
                "pdf": result["pdf"],
                "amount": amount,
                "expire_at": result["expire_at"],
                "status": "pending"
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Erro ao criar boleto"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating Efi boleto: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar boleto")


async def create_efi_pix_payment(provider_id: str, amount: float = 199.00):
    """Create PIX payment with Efi Bank for provider subscription"""
    try:
        # Get provider info
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        # Prepare provider data
        provider_data = {
            "provider_id": provider_id,
            "name": provider["name"],
            "email": provider["email"]
        }
        
        # Create PIX via Efi Bank
        result = get_efi_service().create_pix_charge(provider_data, amount, expiration_minutes=30)
        
        if result.get("success"):
            return {
                "success": True,
                "payment_type": "pix",
                "charge_id": result["charge_id"],
                "qr_code": result["qr_code"],
                "qr_code_base64": result["qr_code_base64"],
                "amount": amount,
                "expires_at": result["expires_at"],
                "status": "waiting"
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Erro ao criar PIX"))
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating Efi PIX: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar PIX")


async def verify_efi_webhook_signature(payload: str, signature: str) -> bool:
    """Verify Efi Bank webhook signature"""
    webhook_secret = os.getenv("EFI_WEBHOOK_SECRET", "")
    
    if not webhook_secret:
        print("[EFI WEBHOOK] No webhook secret configured")
        return True  # Allow in development
    
    try:
        expected_signature = hmac.new(
            webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        is_valid = hmac.compare_digest(signature, expected_signature)
        
        if not is_valid:
            print(f"[EFI WEBHOOK] Invalid signature")
        
        return is_valid
    except Exception as e:
        print(f"[EFI WEBHOOK] Error verifying signature: {e}")
        return False


async def is_payment_required():
    """Check if the system requires payment globally"""
    try:
        settings = await db.system_settings.find_one({}) 
        return settings.get("payment_required", False) if settings else False
    except Exception:
        return False  # Default to free system


async def check_subscription_status(provider_id: str):
    """Check if provider has active subscription (including promotional)"""
    # Se sistema está gratuito, todos têm acesso
    if not await is_payment_required():
        return True
        
    current_time = datetime.now(timezone.utc).isoformat()
    
    # Verificar assinaturas ativas ou promocionais válidas
    subscription = await db.subscriptions.find_one({
        "provider_id": provider_id,
        "$or": [
            {"payment_status": "active", "expires_at": {"$gt": current_time}},
            {"payment_status": "promotional", "expires_at": {"$gt": current_time}}
        ]
    })
    return subscription is not None


async def get_provider_subscription(provider_id: str):
    """Get current provider subscription"""
    subscription = await db.subscriptions.find_one(
        {"provider_id": provider_id},
        sort=[("created_at", -1)]
    )
    return subscription


async def send_payment_reminder(provider_id: str):
    """Send payment reminder email"""
    try:
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            return False

        subject = "🔔 ControleIsp - Renovação da Assinatura em 2 dias"
        
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">ControleIsp</h1>
                <p style="color: #fecaca; margin: 10px 0 0 0;">Sistema de Gestão de Clientes</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #dc2626;">Olá, {provider['name']}!</h2>
                
                <p style="font-size: 16px; line-height: 1.6;">
                    Sua assinatura do <strong>ControleIsp</strong> vence em <strong>2 dias</strong>.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                    Para manter o acesso ao sistema e continuar gerenciando seus clientes negativados, 
                    realize o pagamento da mensalidade de <strong>R$ 99,00</strong> via PIX.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.controleisp.com.br" 
                       style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                              color: white; padding: 15px 30px; text-decoration: none; 
                              border-radius: 8px; font-weight: bold; display: inline-block;">
                        🏦 Pagar com PIX
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                    Após o vencimento, o acesso ao sistema será bloqueado até o pagamento.
                </p>
            </div>
            
            <div style="background: #dc2626; padding: 20px; text-align: center;">
                <p style="color: white; margin: 0; font-size: 14px;">
                    ControleIsp - Sistema Profissional de Gestão
                </p>
            </div>
        </div>
        """
        
        text_body = f"""
        ControleIsp - Renovação da Assinatura

        Olá, {provider['name']}!

        Sua assinatura do ControleIsp vence em 2 dias.

        Para manter o acesso ao sistema, realize o pagamento da mensalidade de R$ 99,00 via PIX.

        Acesse: https://www.controleisp.com.br

        ControleIsp - Sistema Profissional de Gestão
        """
        
        if SMTP_USERNAME and SMTP_PASSWORD:
            return send_email(provider["email"], subject, html_body, text_body)
        else:
            print(f"[DEMO] Lembrete seria enviado para: {provider['email']}")
            return True
            
    except Exception as e:
        print(f"Error sending payment reminder: {e}")
        return False


# Admin Routes
@api_router.post("/admin/create")
async def create_admin(admin_data: AdminCreate, current_user=Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    existing_admin = await db.admins.find_one({"username": admin_data.username})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin já existe")
    
    admin = Admin(
        username=admin_data.username,
        password_hash=hash_password(admin_data.password)
    )
    await db.admins.insert_one(admin.dict())
    return {"message": "Admin criado com sucesso"}


@api_router.post("/admin/providers", response_model=Provider)
async def create_provider(provider_data: ProviderCreate, current_user=Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if not validate_cnpj(provider_data.cnpj):
        raise HTTPException(status_code=400, detail="CNPJ inválido")
    
    existing_provider = await db.providers.find_one({
        "$or": [
            {"email": provider_data.email},
            {"cnpj": provider_data.cnpj}
        ]
    })
    if existing_provider:
        raise HTTPException(status_code=400, detail="Provedor já existe")
    
    provider = Provider(
        name=provider_data.name,
        nome_fantasia=provider_data.nome_fantasia,
        email=provider_data.email,
        username=provider_data.email,  # Use email as username
        password_hash=hash_password(provider_data.password),
        cnpj=provider_data.cnpj,
        phone=provider_data.phone,
        address=provider_data.address,
        bairro=provider_data.bairro
    )
    
    provider_dict = provider.dict()
    provider_dict["created_at"] = provider_dict["created_at"].isoformat()
    await db.providers.insert_one(provider_dict)
    return provider


@api_router.get("/admin/providers", response_model=List[ProviderStats])
async def get_providers(current_user=Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    providers = await db.providers.find({"is_active": True}).to_list(1000)
    provider_stats = []
    
    for provider in providers:
        # Convert datetime fields
        if isinstance(provider.get('created_at'), str):
            provider['created_at'] = datetime.fromisoformat(provider['created_at'])
        
        # Add default values for new fields
        provider.setdefault('is_blocked', False)
        provider.setdefault('blocked_at', None)
        provider.setdefault('blocked_reason', None)
        provider.setdefault('nome_fantasia', provider.get('name', ''))  # Default para provedores existentes
        provider.setdefault('bairro', 'Centro')  # Default para provedores existentes
        
        # Calculate client statistics using aggregation to avoid N+1 query
        pipeline = [
            {"$match": {"provider_id": provider["id"], "is_active": True}},
            {"$group": {
                "_id": None,
                "clients_count": {"$sum": 1},
                "total_debt": {"$sum": "$debt_amount"},
                "highest_debt": {"$max": "$debt_amount"}
            }}
        ]
        
        client_stats = await db.clients.aggregate(pipeline).to_list(1)
        
        if client_stats:
            stats = client_stats[0]
            clients_count = stats["clients_count"]
            total_debt = stats["total_debt"]
            highest_debt = stats["highest_debt"]
            avg_debt = total_debt / clients_count if clients_count > 0 else 0
        else:
            clients_count = 0
            total_debt = 0
            avg_debt = 0
            highest_debt = 0
        
        # Get subscription information
        current_time = datetime.now(timezone.utc)
        subscription = await db.subscriptions.find_one(
            {"provider_id": provider["id"]},
            sort=[("created_at", -1)]
        )
        
        subscription_status = "none"
        subscription_type = None
        subscription_expires_at = None
        days_remaining = None
        is_promotional = False
        
        if subscription:
            # Parse expires_at if it's a string
            expires_at = subscription.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            
            subscription_expires_at = expires_at
            
            if expires_at and expires_at > current_time:
                # Subscription is valid
                if subscription.get("is_promotional"):
                    subscription_status = "promotional"
                    is_promotional = True
                    subscription_type = subscription.get("promotional_type", "first_month_free")
                else:
                    subscription_status = subscription.get("payment_status", "active")
                
                # Calculate days remaining
                days_remaining = (expires_at - current_time).days
            else:
                subscription_status = "expired"
        
        # Create provider stats
        provider_stat = ProviderStats(
            id=provider["id"],
            name=provider["name"],
            nome_fantasia=provider.get("nome_fantasia", provider.get('name', '')),
            email=provider["email"],
            cnpj=provider["cnpj"],
            phone=provider["phone"],
            address=provider["address"],
            bairro=provider.get("bairro", "Centro"),
            logo_url=provider.get("logo_url"),
            is_active=provider.get("is_active", True),
            is_blocked=provider.get("is_blocked", False),
            blocked_at=provider.get("blocked_at"),
            blocked_reason=provider.get("blocked_reason"),
            created_at=provider["created_at"],
            clients_count=clients_count,
            total_debt=total_debt,
            avg_debt=avg_debt,
            highest_debt=highest_debt,
            subscription_status=subscription_status,
            subscription_type=subscription_type,
            subscription_expires_at=subscription_expires_at,
            days_remaining=days_remaining,
            is_promotional=is_promotional
        )
        provider_stats.append(provider_stat)
    
    return provider_stats


# =============================================================================
# ADMIN PROVIDER CRUD ROUTES
# =============================================================================

@api_router.post("/admin/providers")
async def create_provider_by_admin(provider_data: dict, current_user=Depends(get_current_admin)):
    """Create a new provider (admin only)"""
    try:
        # Check if email already exists
        existing = await db.providers.find_one({"email": provider_data.get("email")})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Create provider
        provider = Provider(
            id=str(uuid.uuid4()),
            name=provider_data.get("name"),
            email=provider_data.get("email"),
            password_hash=hash_password(provider_data.get("password", "123456")),
            cnpj=provider_data.get("cnpj", ""),
            cpf=provider_data.get("cpf", ""),
            phone=provider_data.get("phone", ""),
            address=provider_data.get("address", ""),
            number=provider_data.get("number", ""),
            complement=provider_data.get("complement", ""),
            neighborhood=provider_data.get("neighborhood", ""),
            city=provider_data.get("city", ""),
            state=provider_data.get("state", ""),
            cep=provider_data.get("cep", ""),
            username=provider_data.get("username", provider_data.get("email")),
            contract_number=provider_data.get("contract_number", ""),
            contract_date=provider_data.get("contract_date", ""),
            plan_type=provider_data.get("plan_type", "mensal"),
            plan_value=provider_data.get("plan_value", 199.00),
            payment_method=provider_data.get("payment_method", "boleto"),
            is_active=True,
            approved=True,
            financial_generated=False  # Precisa gerar financeiro
        )
        
        provider_dict = provider.dict()
        provider_dict["created_at"] = provider_dict["created_at"].isoformat()
        provider_dict["updated_at"] = provider_dict["updated_at"].isoformat()
        
        await db.providers.insert_one(provider_dict)
        
        return {"success": True, "message": "Provedor criado com sucesso", "provider_id": provider.id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating provider: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar provedor")


@api_router.put("/admin/providers/{provider_id}")
async def update_provider_by_admin(provider_id: str, provider_data: dict, current_user=Depends(get_current_admin)):
    """Update provider information (admin only)"""
    try:
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        # Prepare update data
        update_data = {
            "name": provider_data.get("name"),
            "email": provider_data.get("email"),
            "cnpj": provider_data.get("cnpj", ""),
            "cpf": provider_data.get("cpf", ""),
            "phone": provider_data.get("phone", ""),
            "address": provider_data.get("address", ""),
            "number": provider_data.get("number", ""),
            "complement": provider_data.get("complement", ""),
            "neighborhood": provider_data.get("neighborhood", ""),
            "city": provider_data.get("city", ""),
            "state": provider_data.get("state", ""),
            "cep": provider_data.get("cep", ""),
            "username": provider_data.get("username", provider_data.get("email")),
            "contract_number": provider_data.get("contract_number", ""),
            "contract_date": provider_data.get("contract_date", ""),
            "plan_type": provider_data.get("plan_type", "mensal"),
            "plan_value": provider_data.get("plan_value", 199.00),
            "payment_method": provider_data.get("payment_method", "boleto"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update password if provided
        if provider_data.get("password"):
            update_data["password_hash"] = hash_password(provider_data["password"])
        
        await db.providers.update_one(
            {"id": provider_id},
            {"$set": update_data}
        )
        
        return {"success": True, "message": "Provedor atualizado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating provider: {e}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar provedor")


@api_router.delete("/admin/providers/{provider_id}")
async def delete_provider_by_admin(provider_id: str, current_user=Depends(get_current_admin)):
    """Delete/deactivate provider (admin only)"""
    try:
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        # Soft delete - just deactivate
        await db.providers.update_one(
            {"id": provider_id},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "message": "Provedor desativado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting provider: {e}")
        raise HTTPException(status_code=500, detail="Erro ao deletar provedor")


@api_router.post("/admin/providers/{provider_id}/block", response_model=ProviderActionResponse)
async def block_provider(provider_id: str, block_data: ProviderBlockRequest, current_user=Depends(get_current_user)):
    """Block a provider account"""
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if provider exists
    provider = await db.providers.find_one({"id": provider_id, "is_active": True})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Update provider to blocked status
    update_data = {
        "is_blocked": True,
        "blocked_at": datetime.now(timezone.utc).isoformat(),
        "blocked_reason": block_data.reason
    }
    
    result = await db.providers.update_one(
        {"id": provider_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return ProviderActionResponse(
            success=True,
            message=f"Provedor '{provider['name']}' foi bloqueado com sucesso",
            provider_id=provider_id
        )
    else:
        raise HTTPException(status_code=500, detail="Erro ao bloquear provedor")


@api_router.post("/admin/providers/{provider_id}/unblock", response_model=ProviderActionResponse)
async def unblock_provider(provider_id: str, current_user=Depends(get_current_user)):
    """Unblock a provider account"""
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if provider exists
    provider = await db.providers.find_one({"id": provider_id, "is_active": True})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Update provider to unblocked status
    update_data = {
        "is_blocked": False,
        "blocked_at": None,
        "blocked_reason": None
    }
    
    result = await db.providers.update_one(
        {"id": provider_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return ProviderActionResponse(
            success=True,
            message=f"Provedor '{provider['name']}' foi desbloqueado com sucesso",
            provider_id=provider_id
        )
    else:
        raise HTTPException(status_code=500, detail="Erro ao desbloquear provedor")


@api_router.post("/admin/providers/{provider_id}/renew-subscription")
async def renew_provider_subscription(provider_id: str, current_user=Depends(get_current_admin)):
    """Renew a provider's subscription (admin action)"""
    try:
        # Verificar se o provedor existe
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        # Calcular nova data de expiração (30 dias a partir de agora)
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        # Verificar se já existe uma assinatura
        existing_subscription = await db.subscriptions.find_one(
            {"provider_id": provider_id},
            sort=[("created_at", -1)]
        )
        
        if existing_subscription:
            # Atualizar assinatura existente
            result = await db.subscriptions.update_one(
                {"provider_id": provider_id, "id": existing_subscription["id"]},
                {
                    "$set": {
                        "payment_status": "active",
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": new_expires_at.isoformat(),
                        "is_promotional": False,
                        "promotional_type": None
                    }
                }
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Assinatura não encontrada")
        else:
            # Criar nova assinatura ativa
            new_subscription = {
                "id": str(uuid.uuid4()),
                "provider_id": provider_id,
                "payment_status": "active",
                "payment_id": f"ADMIN_RENEWAL_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "amount": 99.00,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": new_expires_at.isoformat(),
                "reminder_sent": False,
                "is_promotional": False,
                "promotional_type": None
            }
            
            await db.subscriptions.insert_one(new_subscription)
        
        return {
            "success": True, 
            "message": "Assinatura renovada com sucesso por 30 dias",
            "expires_at": new_expires_at.isoformat(),
            "renewal_type": "admin_action"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao renovar assinatura: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao renovar assinatura: {str(e)}")


@api_router.delete("/admin/providers/{provider_id}")
async def delete_provider_admin(provider_id: str, current_user=Depends(get_current_admin)):
    """Admin soft-delete provider endpoint"""
    provider = await db.providers.find_one({"id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Soft delete provider
    await db.providers.update_one(
        {"id": provider_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Provedor excluído com sucesso", "provider_id": provider_id}


@api_router.get("/admin/providers/{provider_id}/payments")
async def get_provider_payments(provider_id: str, current_user=Depends(get_current_admin)):
    """Get all payments for a specific provider (admin only)"""
    try:
        # Get payments from database
        payments = await db.payments.find({"provider_id": provider_id}).sort("created_at", -1).to_list(100)
        
        # Get subscriptions to enrich data
        for payment in payments:
            if payment.get("subscription_id"):
                subscription = await db.subscriptions.find_one({"id": payment["subscription_id"]})
                if subscription:
                    payment["subscription_status"] = subscription.get("payment_status")
        
        return payments
        
    except Exception as e:
        print(f"Error getting provider payments: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar pagamentos")


@api_router.post("/admin/payments/{payment_id}/confirm")
async def confirm_payment_admin(payment_id: str, current_user=Depends(get_current_admin)):
    """Manually confirm a payment as received (admin only)"""
    try:
        # Find payment
        payment = await db.payments.find_one({"id": payment_id})
        if not payment:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        
        # Update payment status
        await db.payments.update_one(
            {"id": payment_id},
            {"$set": {
                "status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Activate subscription if exists
        if payment.get("subscription_id"):
            await db.subscriptions.update_one(
                {"id": payment["subscription_id"]},
                {"$set": {
                    "payment_status": "active",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"success": True, "message": "Pagamento confirmado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming payment: {e}")
        raise HTTPException(status_code=500, detail="Erro ao confirmar pagamento")


@api_router.post("/admin/payments/{payment_id}/cancel")
async def cancel_payment_admin(payment_id: str, current_user=Depends(get_current_admin)):
    """Cancel a payment (admin only)"""
    try:
        # Find payment
        payment = await db.payments.find_one({"id": payment_id})
        if not payment:
            raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        
        # Cancel in Efi Bank if has charge_id
        if payment.get("payment_id"):
            try:
                result = get_efi_service().cancel_charge(int(payment["payment_id"]))
                if not result.get("success"):
                    print(f"Warning: Failed to cancel charge in Efi Bank: {result.get('error')}")
            except Exception as e:
                print(f"Warning: Could not cancel charge in Efi Bank: {e}")
        
        # Update payment status
        await db.payments.update_one(
            {"id": payment_id},
            {"$set": {"status": "cancelled"}}
        )
        
        # Cancel subscription if exists
        if payment.get("subscription_id"):
            await db.subscriptions.update_one(
                {"id": payment["subscription_id"]},
                {"$set": {
                    "payment_status": "cancelled",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"success": True, "message": "Pagamento cancelado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling payment: {e}")
        raise HTTPException(status_code=500, detail="Erro ao cancelar pagamento")


@api_router.post("/admin/providers/{provider_id}/generate-financial")
async def generate_provider_financial(
    provider_id: str,
    payment_data: dict,
    current_user=Depends(get_current_admin)
):
    """Generate financial (boleto or PIX) for provider and mark as financial_generated (admin only)"""
    try:
        # Get provider
        provider = await db.providers.find_one({"id": provider_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provedor não encontrado")
        
        payment_type = payment_data.get("type", "boleto")  # boleto ou pix
        amount = payment_data.get("amount", 199.00)
        
        # Generate payment based on type
        if payment_type == "boleto":
            payment_result = await create_efi_boleto_payment(provider_id, amount)
        else:  # pix
            payment_result = await create_efi_pix_payment(provider_id, amount)
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=400, detail="Erro ao gerar pagamento")
        
        # Mark provider as financial_generated = True
        await db.providers.update_one(
            {"id": provider_id},
            {"$set": {
                "financial_generated": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Financeiro gerado com sucesso! Provedor liberado.",
            "payment": payment_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating financial: {e}")
        raise HTTPException(status_code=500, detail="Erro ao gerar financeiro")


# Duplicate function removed - using the new renew_provider_subscription function above

@api_router.post("/admin/renew-all-subscriptions")
async def renew_all_subscriptions_admin(current_user=Depends(get_current_admin)):
    """Admin endpoint to renew subscriptions for all active providers"""
    
    try:
        # Get all active providers
        providers = await db.providers.find({"is_active": True}).to_list(1000)
        
        if not providers:
            return {"message": "Nenhum provedor ativo encontrado", "renewed_count": 0}
        
        renewed_count = 0
        renewal_results = []
        current_time = datetime.now(timezone.utc)
        expires_at = current_time + timedelta(days=30)
        
        for provider in providers:
            provider_id = provider["id"]
            
            try:
                # Create subscription
                subscription_id = f"admin-bulk-renewal-{provider_id}-{int(current_time.timestamp())}"
                
                subscription_data = {
                    "id": subscription_id,
                    "provider_id": provider_id,
                    "payment_status": "active",
                    "payment_id": f"admin-bulk-payment-{provider_id}",
                    "amount": 99.00,
                    "created_at": current_time.isoformat(),
                    "paid_at": current_time.isoformat(),
                    "expires_at": expires_at.isoformat(),
                    "reminder_sent": False,
                    "renewed_by_admin": True,
                    "admin_user_id": current_user["user_id"]
                }
                
                # Insert subscription
                await db.subscriptions.insert_one(subscription_data)
                
                # Update provider
                await db.providers.update_one(
                    {"id": provider_id},
                    {"$set": {"subscription_status": "active", "subscription_expires_at": expires_at.isoformat()}}
                )
                
                renewed_count += 1
                renewal_results.append({
                    "provider_id": provider_id,
                    "provider_name": provider.get("name", ""),
                    "status": "success"
                })
                
            except Exception as e:
                renewal_results.append({
                    "provider_id": provider_id,
                    "provider_name": provider.get("name", ""),
                    "status": "error",
                    "error": str(e)
                })
        
        return {
            "message": f"Operação concluída. {renewed_count} assinaturas renovadas de {len(providers)} provedores",
            "renewed_count": renewed_count,
            "total_providers": len(providers),
            "expires_at": expires_at.isoformat(),
            "results": renewal_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao renovar assinaturas: {str(e)}")


# Database Management (Admin)
@api_router.post("/admin/database/clear-providers")
async def clear_all_providers(current_user=Depends(get_current_admin)):
    """Clear all providers from database (DANGER: Irreversible action)"""
    
    try:
        # Count existing providers
        provider_count = await db.providers.count_documents({})
        
        if provider_count == 0:
            return {
                "success": True,
                "message": "Nenhum provedor encontrado para remover",
                "deleted_count": 0
            }
        
        # Delete all providers
        result = await db.providers.delete_many({})
        
        return {
            "success": True,
            "message": f"{result.deleted_count} provedores removidos com sucesso",
            "deleted_count": result.deleted_count,
            "admin_user": current_user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar provedores: {str(e)}")

@api_router.post("/admin/database/clear-clients")
async def clear_all_clients(current_user=Depends(get_current_admin)):
    """Clear all clients from database (DANGER: Irreversible action)"""
    
    try:
        # Count existing clients
        client_count = await db.clients.count_documents({})
        
        if client_count == 0:
            return {
                "success": True,
                "message": "Nenhum cliente encontrado para remover",
                "deleted_count": 0
            }
        
        # Delete all clients
        result = await db.clients.delete_many({})
        
        return {
            "success": True,
            "message": f"{result.deleted_count} clientes removidos com sucesso",
            "deleted_count": result.deleted_count,
            "admin_user": current_user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar clientes: {str(e)}")

@api_router.post("/admin/database/clear-subscriptions")
async def clear_all_subscriptions(current_user=Depends(get_current_admin)):
    """Clear all subscriptions from database (DANGER: Irreversible action)"""
    
    try:
        # Count existing subscriptions
        subscription_count = await db.subscriptions.count_documents({})
        
        if subscription_count == 0:
            return {
                "success": True,
                "message": "Nenhuma assinatura encontrada para remover",
                "deleted_count": 0
            }
        
        # Delete all subscriptions
        result = await db.subscriptions.delete_many({})
        
        return {
            "success": True,
            "message": f"{result.deleted_count} assinaturas removidas com sucesso",
            "deleted_count": result.deleted_count,
            "admin_user": current_user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar assinaturas: {str(e)}")

@api_router.post("/admin/database/clear-notifications")
async def clear_all_notifications(current_user=Depends(get_current_admin)):
    """Clear all notifications from database"""
    
    try:
        # Count existing notifications
        notification_count = await db.notifications.count_documents({})
        read_count = await db.notification_reads.count_documents({})
        
        if notification_count == 0 and read_count == 0:
            return {
                "success": True,
                "message": "Nenhuma notificação encontrada para remover",
                "deleted_count": 0
            }
        
        # Delete all notifications and reads
        notifications_result = await db.notifications.delete_many({})
        reads_result = await db.notification_reads.delete_many({})
        
        total_deleted = notifications_result.deleted_count + reads_result.deleted_count
        
        return {
            "success": True,
            "message": f"{notifications_result.deleted_count} notificações e {reads_result.deleted_count} registros de leitura removidos",
            "deleted_count": total_deleted,
            "admin_user": current_user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar notificações: {str(e)}")

@api_router.post("/admin/database/clear-all")
async def clear_entire_database(current_user=Depends(get_current_admin)):
    """Clear entire database (EXTREME DANGER: Irreversible action)"""
    
    try:
        # Count all data
        providers = await db.providers.count_documents({})
        clients = await db.clients.count_documents({})
        subscriptions = await db.subscriptions.count_documents({})
        notifications = await db.notifications.count_documents({})
        reads = await db.notification_reads.count_documents({})
        reminders = await db.payment_reminders.count_documents({})
        
        total_count = providers + clients + subscriptions + notifications + reads + reminders
        
        if total_count == 0:
            return {
                "success": True,
                "message": "Banco de dados já está vazio",
                "deleted_count": 0
            }
        
        # Delete everything except admin users
        providers_result = await db.providers.delete_many({})
        clients_result = await db.clients.delete_many({})
        subscriptions_result = await db.subscriptions.delete_many({})
        notifications_result = await db.notifications.delete_many({})
        reads_result = await db.notification_reads.delete_many({})
        reminders_result = await db.payment_reminders.delete_many({})
        
        total_deleted = (
            providers_result.deleted_count + 
            clients_result.deleted_count + 
            subscriptions_result.deleted_count + 
            notifications_result.deleted_count + 
            reads_result.deleted_count +
            reminders_result.deleted_count
        )
        
        return {
            "success": True,
            "message": f"Banco de dados limpo completamente! {total_deleted} registros removidos",
            "deleted_count": total_deleted,
            "breakdown": {
                "providers": providers_result.deleted_count,
                "clients": clients_result.deleted_count,
                "subscriptions": subscriptions_result.deleted_count,
                "notifications": notifications_result.deleted_count,
                "reads": reads_result.deleted_count,
                "reminders": reminders_result.deleted_count
            },
            "admin_user": current_user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar banco de dados: {str(e)}")

@api_router.get("/admin/database/stats")
async def get_database_stats(current_user=Depends(get_current_admin)):
    """Get database statistics for admin"""
    
    try:
        stats = {
            "providers": await db.providers.count_documents({}),
            "active_providers": await db.providers.count_documents({"is_active": True}),
            "clients": await db.clients.count_documents({}),
            "subscriptions": await db.subscriptions.count_documents({}),
            "active_subscriptions": await db.subscriptions.count_documents({"paid": True}),
            "notifications": await db.notifications.count_documents({}),
            "notification_reads": await db.notification_reads.count_documents({}),
            "payment_reminders": await db.payment_reminders.count_documents({})
        }
        
        return {
            "success": True,
            "stats": stats,
            "total_records": sum(stats.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")

@api_router.delete("/admin/database/reset")
async def reset_database(current_user=Depends(get_current_admin)):
    """DANGEROUS: Reset entire database - USE WITH EXTREME CAUTION"""
    try:
        # Delete all collections
        collections_to_clear = ['providers', 'clients', 'notifications', 'notification_reads']
        
        results = {}
        for collection_name in collections_to_clear:
            collection = getattr(db, collection_name)
            delete_result = await collection.delete_many({})
            results[collection_name] = delete_result.deleted_count
        
        return {
            "success": True,
            "message": "Database reset successfully",
            "deleted_counts": results
        }
        
    except Exception as e:
        print(f"Erro ao resetar database: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao resetar database: {str(e)}")

@api_router.get("/admin/cleanup/orphaned-clients")
async def get_orphaned_clients(current_user=Depends(get_current_admin)):
    """Get clients whose providers no longer exist"""
    try:
        # Get all active provider IDs
        providers = await db.providers.find({"is_active": True}).to_list(1000)
        active_provider_ids = {p["user_id"] for p in providers if p.get("user_id")}
        
        # Find clients whose provider_id is not in active providers
        all_clients = await db.clients.find({}).to_list(length=None)
        orphaned_clients = []
        
        for client in all_clients:
            if "_id" in client:
                del client["_id"]
            
            provider_id = client.get("provider_id")
            if provider_id and provider_id not in active_provider_ids:
                orphaned_clients.append(client)
        
        return {
            "success": True,
            "orphaned_clients": orphaned_clients,
            "count": len(orphaned_clients)
        }
        
    except Exception as e:
        print(f"Erro ao buscar clientes órfãos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar clientes órfãos: {str(e)}")

@api_router.delete("/admin/cleanup/orphaned-clients")
async def delete_orphaned_clients(current_user=Depends(get_current_admin)):
    """Delete clients whose providers no longer exist"""
    try:
        # Get all active provider IDs
        providers = await db.providers.find({"is_active": True}).to_list(1000)
        active_provider_ids = {p["user_id"] for p in providers if p.get("user_id")}
        
        # Delete clients whose provider_id is not in active providers
        delete_result = await db.clients.delete_many({
            "provider_id": {"$nin": list(active_provider_ids)}
        })
        
        return {
            "success": True,
            "message": f"{delete_result.deleted_count} clientes órfãos removidos com sucesso",
            "deleted_count": delete_result.deleted_count
        }
        
    except Exception as e:
        print(f"Erro ao deletar clientes órfãos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar clientes órfãos: {str(e)}")

@api_router.get("/admin/cleanup/inactive-providers")
async def get_inactive_providers(current_user=Depends(get_current_admin)):
    """Get providers that are marked as inactive"""
    try:
        # Find inactive providers
        inactive_providers = await db.providers.find({"is_active": False}).to_list(length=None)
        
        # Clean the results
        cleaned_providers = []
        for provider in inactive_providers:
            if "_id" in provider:
                del provider["_id"]
            cleaned_providers.append(provider)
        
        return {
            "success": True,
            "inactive_providers": cleaned_providers,
            "count": len(cleaned_providers)
        }
        
    except Exception as e:
        print(f"Erro ao buscar provedores inativos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar provedores inativos: {str(e)}")

@api_router.delete("/admin/cleanup/inactive-providers")
async def delete_inactive_providers(current_user=Depends(get_current_admin)):
    """Delete providers marked as inactive and their related data"""
    try:
        # Get inactive providers first
        inactive_providers = await db.providers.find({"is_active": False}).to_list(length=None)
        inactive_provider_ids = [p["user_id"] for p in inactive_providers if p.get("user_id")]
        
        if not inactive_provider_ids:
            return {
                "success": True,
                "message": "Nenhum provedor inativo encontrado",
                "deleted_counts": {"providers": 0, "clients": 0}
            }
        
        # Delete related data first
        clients_deleted = await db.clients.delete_many({
            "provider_id": {"$in": inactive_provider_ids}
        })
        
        # Delete the providers
        providers_deleted = await db.providers.delete_many({"is_active": False})
        
        return {
            "success": True,
            "message": f"{providers_deleted.deleted_count} provedores inativos e {clients_deleted.deleted_count} clientes relacionados removidos",
            "deleted_counts": {
                "providers": providers_deleted.deleted_count,
                "clients": clients_deleted.deleted_count
            }
        }
        
    except Exception as e:
        print(f"Erro ao deletar provedores inativos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar provedores inativos: {str(e)}")

@api_router.get("/admin/database/backup")
async def generate_database_backup(current_user=Depends(get_current_admin)):
    """Generate a complete backup of the database in JSON format"""
    try:
        backup_data = {
            "backup_info": {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": current_user.get("email", "admin"),
                "version": "1.0"
            },
            "collections": {}
        }
        
        # Collections to backup
        collections_to_backup = ['providers', 'clients', 'notifications', 'notification_reads', 'payment_reminders']
        
        for collection_name in collections_to_backup:
            try:
                collection = getattr(db, collection_name)
                documents = await collection.find({}).to_list(length=None)
                
                # Clean documents for JSON serialization
                cleaned_documents = []
                for doc in documents:
                    # Remove MongoDB ObjectId
                    if "_id" in doc:
                        del doc["_id"]
                    
                    # Convert datetime objects to ISO strings
                    for key, value in doc.items():
                        if isinstance(value, datetime):
                            doc[key] = value.isoformat()
                    
                    cleaned_documents.append(doc)
                
                backup_data["collections"][collection_name] = {
                    "count": len(cleaned_documents),
                    "data": cleaned_documents
                }
                
            except Exception as e:
                print(f"Erro ao fazer backup da coleção {collection_name}: {e}")
                backup_data["collections"][collection_name] = {
                    "count": 0,
                    "data": [],
                    "error": str(e)
                }
        
        return backup_data
        
    except Exception as e:
        print(f"Erro ao gerar backup: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar backup: {str(e)}")


@api_router.post("/admin/database/restore")
async def restore_database_backup(file: UploadFile = File(...), current_user=Depends(get_current_admin)):
    """Restore database from backup JSON file"""
    try:
        # Validate file type
        if not file.filename.endswith('.json'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser um JSON válido")
        
        # Read and parse JSON content
        content = await file.read()
        try:
            backup_data = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"JSON inválido: {str(e)}")
        
        # Validate backup structure
        if "backup_info" not in backup_data or "collections" not in backup_data:
            raise HTTPException(status_code=400, detail="Estrutura de backup inválida")
        
        # Expected collections
        expected_collections = ['providers', 'clients', 'notifications', 'notification_reads', 'payment_reminders']
        
        restore_results = {
            "restored_at": datetime.now(timezone.utc).isoformat(),
            "restored_by": current_user.get("email", "admin"),
            "backup_info": backup_data.get("backup_info", {}),
            "results": {}
        }
        
        # Restore each collection
        for collection_name in expected_collections:
            try:
                if collection_name in backup_data["collections"]:
                    collection_data = backup_data["collections"][collection_name]
                    
                    # Get collection reference
                    collection = getattr(db, collection_name)
                    
                    # Clear existing data (DANGER!)
                    delete_result = await collection.delete_many({})
                    
                    # Insert backup data
                    documents = collection_data.get("data", [])
                    if documents:
                        # Add IDs and convert date strings back to datetime if needed
                        for doc in documents:
                            # Generate new UUID for id field if not present
                            if "id" not in doc:
                                doc["id"] = str(uuid.uuid4())
                            
                            # Convert ISO date strings back to datetime objects
                            for key, value in doc.items():
                                if isinstance(value, str):
                                    # Try to parse common datetime patterns
                                    for date_pattern in ["%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"]:
                                        try:
                                            if "T" in value and len(value) > 10:
                                                parsed_date = datetime.strptime(value.replace("Z", "").split("+")[0], date_pattern)
                                                doc[key] = parsed_date.replace(tzinfo=timezone.utc)
                                                break
                                        except ValueError:
                                            continue
                        
                        # Insert documents
                        insert_result = await collection.insert_many(documents)
                        
                        restore_results["results"][collection_name] = {
                            "deleted": delete_result.deleted_count,
                            "inserted": len(insert_result.inserted_ids),
                            "status": "success"
                        }
                    else:
                        restore_results["results"][collection_name] = {
                            "deleted": delete_result.deleted_count,
                            "inserted": 0,
                            "status": "success"
                        }
                else:
                    restore_results["results"][collection_name] = {
                        "deleted": 0,
                        "inserted": 0,
                        "status": "skipped - not in backup"
                    }
                    
            except Exception as e:
                print(f"Erro ao restaurar coleção {collection_name}: {e}")
                restore_results["results"][collection_name] = {
                    "deleted": 0,
                    "inserted": 0,
                    "status": f"error: {str(e)}"
                }
        
        return {
            "success": True,
            "message": "Backup restaurado com sucesso",
            "restore_details": restore_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao restaurar backup: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao restaurar backup: {str(e)}")


@api_router.get("/admin/revenue-stats")
async def get_admin_revenue_stats(current_user=Depends(get_current_admin)):
    """Admin endpoint to get revenue statistics from subscriptions"""
    
    try:
        # Get all paid subscriptions
        subscriptions = await db.subscriptions.find({
            "payment_status": {"$in": ["active", "paid", "approved"]}
        }).to_list(length=None)
        
        if not subscriptions:
            return {
                "total_revenue": 0.0,
                "monthly_revenue": 0.0,
                "active_subscriptions": 0,
                "total_subscriptions": 0,
                "average_per_subscription": 0.0
            }
        
        # Calculate totals
        total_revenue = sum(sub.get("amount", 99.0) for sub in subscriptions)
        active_subscriptions = len([sub for sub in subscriptions if sub.get("payment_status") == "active"])
        
        # Calculate monthly revenue (last 30 days)
        current_time = datetime.now(timezone.utc)
        thirty_days_ago = current_time - timedelta(days=30)
        
        monthly_subscriptions = []
        for sub in subscriptions:
            paid_at_str = sub.get("paid_at") or sub.get("created_at")
            if paid_at_str:
                try:
                    paid_at = datetime.fromisoformat(paid_at_str.replace("Z", "+00:00"))
                    if paid_at >= thirty_days_ago:
                        monthly_subscriptions.append(sub)
                except (ValueError, TypeError):
                    continue
        
        monthly_revenue = sum(sub.get("amount", 99.0) for sub in monthly_subscriptions)
        average_per_subscription = total_revenue / len(subscriptions) if subscriptions else 0.0
        
        return {
            "total_revenue": round(total_revenue, 2),
            "monthly_revenue": round(monthly_revenue, 2),
            "active_subscriptions": active_subscriptions,
            "total_subscriptions": len(subscriptions),
            "average_per_subscription": round(average_per_subscription, 2),
            "monthly_subscription_count": len(monthly_subscriptions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular estatísticas de receita: {str(e)}")


@api_router.get("/admin/providers/{provider_id}/clients", response_model=ProviderClientsResponse)
async def get_provider_clients_admin(provider_id: str, current_user=Depends(get_current_user)):
    """Get all clients of a specific provider for admin"""
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if provider exists
    provider = await db.providers.find_one({"id": provider_id, "is_active": True})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Get all clients for this provider
    clients = await db.clients.find({
        "provider_id": provider_id,
        "is_active": True
    }).to_list(1000)
    
    # Convert clients to summary format
    client_summaries = []
    total_debt = 0.0
    
    for client in clients:
        # Convert datetime if needed
        inclusion_date = client.get('inclusion_date')
        if isinstance(inclusion_date, str):
            inclusion_date = datetime.fromisoformat(inclusion_date)
        
        client_summary = ClientSummary(
            id=client["id"],
            name=client["name"],
            cpf=client["cpf"],
            email=client["email"],
            phone=client["phone"],
            address=client.get("address", ""),
            bairro=client.get("bairro", ""),
            debt_amount=client["debt_amount"],
            reason=client["reason"],
            inclusion_date=inclusion_date,
            risk_level=client.get("risk_level", 1)
        )
        client_summaries.append(client_summary)
        total_debt += client["debt_amount"]
    
    return ProviderClientsResponse(
        provider_id=provider_id,
        provider_name=provider["name"],
        clients=client_summaries,
        total_clients=len(client_summaries),
        total_debt=total_debt
    )


# Debug endpoint for production troubleshooting
@api_router.get("/debug/environment")
async def debug_environment():
    """Debug endpoint to check environment configuration"""
    return {
        "frontend_url": os.environ.get('FRONTEND_URL', 'NOT_SET'),
        "cors_origins": os.environ.get('CORS_ORIGINS', 'NOT_SET'),
        "uploads_directory": str(Path("/app/uploads").absolute()),
        "uploads_exists": Path("/app/uploads").exists(),
        "uploads_writable": os.access("/app/uploads", os.W_OK) if Path("/app/uploads").exists() else False,
        "cwd": os.getcwd(),
        "sample_file_url": get_file_url("test.png")
    }

@api_router.post("/provider/upload-logo-custom-domain")
async def upload_logo_custom_domain(data: dict):
    """Upload logo with custom production domain support"""
    
    try:
        # Extract data
        image_data = data.get('image_data')
        filename = data.get('filename', 'image.png')
        custom_domain = data.get('domain')  # User's production domain
        
        if not image_data:
            raise HTTPException(status_code=400, detail="image_data é obrigatório")
        
        print(f"[CUSTOM-DOMAIN-UPLOAD] Domínio customizado: {custom_domain}")
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        import base64
        try:
            file_content = base64.b64decode(image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Dados de imagem inválidos")
        
        # Validate file size (5MB)
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB")
        
        # Create uploads directory
        uploads_dir = Path("/app/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        file_extension = Path(filename).suffix.lower() if filename else '.png'
        if file_extension not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            file_extension = '.png'
        
        unique_filename = f"registration_{file_id}{file_extension}"
        file_path = uploads_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Verify file was saved
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="Falha ao salvar arquivo")
        
        file_size = file_path.stat().st_size
        print(f"[CUSTOM-DOMAIN-UPLOAD] Arquivo salvo: {file_path}, tamanho: {file_size}")
        
        # Generate URL with custom domain
        logo_url = get_file_url(unique_filename, custom_domain)
        print(f"[CUSTOM-DOMAIN-UPLOAD] URL gerada: {logo_url}")
        
        return {
            "success": True,
            "message": "Logo enviada com sucesso para domínio customizado!",
            "logo_url": logo_url,
            "filename": unique_filename,
            "file_size": file_size,
            "domain_used": custom_domain or "default"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CUSTOM-DOMAIN-UPLOAD] Erro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

@api_router.post("/debug/test-upload")
async def test_upload_endpoint(file: UploadFile = File(...)):
    """Test upload endpoint for debugging production issues"""
    
    try:
        # Basic file info
        file_info = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size
        }
        
        # Read file content
        content = await file.read()
        actual_size = len(content)
        
        # Create test directory
        test_dir = Path("/app/uploads/test")
        test_dir.mkdir(parents=True, exist_ok=True)
        
        # Save test file
        test_filename = f"debug_test_{uuid.uuid4().hex[:8]}.png"
        test_path = test_dir / test_filename
        
        with open(test_path, "wb") as f:
            f.write(content)
        
        # Verify file
        file_exists = test_path.exists()
        saved_size = test_path.stat().st_size if file_exists else 0
        
        # Generate test URL
        test_url = get_file_url(f"test/{test_filename}")
        
        return {
            "success": True,
            "file_info": file_info,
            "actual_size": actual_size,
            "file_saved": file_exists,
            "saved_size": saved_size,
            "test_url": test_url,
            "test_path": str(test_path),
            "environment": {
                "frontend_url": os.environ.get('FRONTEND_URL', 'NOT_SET'),
                "uploads_dir": str(Path("/app/uploads").absolute()),
                "uploads_writable": os.access("/app/uploads", os.W_OK)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

# Provider Logo Upload (Public endpoint for registration)
@api_router.post("/provider/upload-logo-registration")
async def upload_logo_registration(file: UploadFile = File(...)):
    """Upload logo during provider registration (public endpoint)"""
    
    print(f"[UPLOAD] Iniciando upload de logo: {file.filename}, tipo: {file.content_type}, tamanho: {file.size}")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        print(f"[UPLOAD] Erro: Tipo de arquivo inválido: {file.content_type}")
        raise HTTPException(status_code=400, detail="Apenas arquivos de imagem são permitidos")
    
    # Validate file size (5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        print(f"[UPLOAD] Erro: Arquivo muito grande: {file.size} bytes")
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB")
    
    try:
        # Create uploads directory if it doesn't exist
        uploads_dir = Path("/app/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        print(f"[UPLOAD] Diretório criado/verificado: {uploads_dir}")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        file_extension = Path(file.filename).suffix.lower() if file.filename else '.jpg'
        if file_extension not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            file_extension = '.jpg'
        
        filename = f"registration_{file_id}{file_extension}"
        file_path = uploads_dir / filename
        print(f"[UPLOAD] Salvando arquivo como: {file_path}")
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Verify file was saved
        if not file_path.exists():
            print("[UPLOAD] Erro: Arquivo não foi salvo corretamente")
            raise HTTPException(status_code=500, detail="Falha ao salvar arquivo")
        
        file_size = file_path.stat().st_size
        print(f"[UPLOAD] Arquivo salvo com sucesso, tamanho: {file_size} bytes")
        
        # Generate URL
        logo_url = get_file_url(filename)
        print(f"[UPLOAD] URL gerada: {logo_url}")
        
        return {
            "success": True,
            "message": "Logo enviada com sucesso!",
            "logo_url": logo_url,
            "filename": filename,
            "file_size": file_size
        }
        
    except Exception as e:
        print(f"[UPLOAD] Erro durante upload: {str(e)}")
        # Remove file if something went wrong
        try:
            if 'file_path' in locals() and file_path.exists():
                file_path.unlink()
                print("[UPLOAD] Arquivo temporário removido")
        except OSError:
            pass
        raise HTTPException(status_code=500, detail=f"Erro ao salvar logo: {str(e)}")

# Alternative upload endpoint using base64 (for production compatibility)
@api_router.post("/provider/upload-logo-base64")
async def upload_logo_base64(data: dict):
    """Upload logo using base64 encoding (alternative for production issues)"""
    
    try:
        # Extract data from request
        image_data = data.get('image_data')
        filename = data.get('filename', 'image.png')
        
        if not image_data:
            raise HTTPException(status_code=400, detail="image_data é obrigatório")
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        import base64
        try:
            file_content = base64.b64decode(image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Dados de imagem inválidos")
        
        # Validate file size (5MB)
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB")
        
        print(f"[BASE64-UPLOAD] Processando imagem base64, tamanho: {len(file_content)} bytes")
        
        # Create uploads directory
        uploads_dir = Path("/app/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        file_extension = Path(filename).suffix.lower() if filename else '.png'
        if file_extension not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            file_extension = '.png'
        
        unique_filename = f"registration_{file_id}{file_extension}"
        file_path = uploads_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Verify file was saved
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="Falha ao salvar arquivo")
        
        file_size = file_path.stat().st_size
        print(f"[BASE64-UPLOAD] Arquivo salvo com sucesso: {file_path}, tamanho: {file_size}")
        
        # Generate URL
        logo_url = get_file_url(unique_filename)
        
        return {
            "success": True,
            "message": "Logo enviada com sucesso via base64!",
            "logo_url": logo_url,
            "filename": unique_filename,
            "file_size": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BASE64-UPLOAD] Erro: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")

# Notification Management (Admin)
@api_router.post("/admin/notifications")
async def create_notification(notification_data: NotificationCreate, current_user=Depends(get_current_admin)):
    """Create a simple notification that will be shown to all providers"""
    
    try:
        # Parse scheduled date if provided
        scheduled_for = None
        if notification_data.scheduled_for:
            try:
                scheduled_for = datetime.fromisoformat(notification_data.scheduled_for.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de data inválido. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
        
        # Create notification
        notification = Notification(
            message=notification_data.message,
            scheduled_for=scheduled_for
        )
        
        # Save to database
        notification_dict = notification.model_dump()
        # Convert datetime objects to ISO strings for MongoDB
        if notification_dict.get('created_at'):
            notification_dict['created_at'] = notification_dict['created_at'].isoformat()
        if notification_dict.get('scheduled_for'):
            notification_dict['scheduled_for'] = notification_dict['scheduled_for'].isoformat()
            
        await db.notifications.insert_one(notification_dict)
        
        return {
            "success": True, 
            "notification_id": notification.id, 
            "message": "Notificação criada com sucesso!",
            "scheduled_for": scheduled_for.isoformat() if scheduled_for else None
        }
        
    except Exception as e:
        print(f"Erro ao criar notificação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar notificação: {str(e)}")

@api_router.get("/admin/notifications")
async def get_all_notifications(current_user=Depends(get_current_admin)):
    """Get all notifications with simple read statistics"""
    
    try:
        # Get all active notifications
        notifications = await db.notifications.find({
            "is_active": True
        }).sort("created_at", -1).to_list(length=None)
        
        # Clean and enrich notifications
        result_notifications = []
        for notification in notifications:
            # Remove MongoDB ObjectId
            if "_id" in notification:
                del notification["_id"]
            
            # Ensure required fields
            if not notification.get("id"):
                continue
                
            # Get read statistics
            read_count = await db.notification_reads.count_documents({
                "notification_id": notification["id"]
            })
            
            total_providers = await db.providers.count_documents({"is_active": True})
            
            notification["read_count"] = read_count
            notification["total_providers"] = total_providers
            notification["unread_count"] = total_providers - read_count
            
            result_notifications.append(notification)
        
        return {"notifications": result_notifications}
        
    except Exception as e:
        print(f"Erro no endpoint get_all_notifications: {e}")
        return {"notifications": []}

@api_router.put("/admin/notifications/{notification_id}")
async def update_notification(notification_id: str, notification_data: NotificationCreate, current_user=Depends(get_current_admin)):
    """Update an existing notification"""
    
    # Check if notification exists
    notification = await db.notifications.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    # Update notification
    update_data = {
        "title": notification_data.title,
        "message": notification_data.message,
        "type": notification_data.type,
        "priority": notification_data.priority,
        "expires_at": notification_data.expires_at.isoformat() if notification_data.expires_at else None
    }
    
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "Notificação atualizada com sucesso!"}

@api_router.delete("/admin/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user=Depends(get_current_admin)):
    """Deactivate a notification"""
    
    # Check if notification exists
    notification = await db.notifications.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    # Deactivate notification
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Notificação removida com sucesso!"}

# Notification Endpoints (Provider)
@api_router.get("/provider/notifications")
async def get_provider_notifications(current_user=Depends(get_current_provider)):
    """Get active notifications for provider - only show if scheduled time has arrived"""
    
    try:
        provider_id = current_user["user_id"]
        now = datetime.now(timezone.utc)
        
        # Get all active notifications that should be displayed now
        notifications = await db.notifications.find({
            "is_active": True,
            "$or": [
                {"scheduled_for": None},  # Show immediately
                {"scheduled_for": {"$lte": now.isoformat()}}  # Show if scheduled time has arrived
            ]
        }).sort("created_at", -1).to_list(length=None)
        
        # Get which notifications this provider has read
        read_notification_ids = set()
        try:
            reads = await db.notification_reads.find({
                "provider_id": provider_id
            }).to_list(length=None)
            
            for read in reads:
                if read.get("notification_id"):
                    read_notification_ids.add(read["notification_id"])
        except Exception as e:
            print(f"Erro ao carregar reads do provedor: {e}")
        
        # Process notifications
        result_notifications = []
        for notification in notifications:
            # Remove MongoDB ObjectId
            if "_id" in notification:
                del notification["_id"]
            
            # Skip if no ID
            if not notification.get("id"):
                continue
            
            # Mark as read/unread
            notification["is_read"] = notification["id"] in read_notification_ids
            
            result_notifications.append(notification)
        
        # Count unread
        unread_count = sum(1 for n in result_notifications if not n["is_read"])
        
        return {
            "notifications": result_notifications,
            "unread_count": unread_count
        }
        
    except Exception as e:
        print(f"Erro no endpoint provider notifications: {e}")
        return {"notifications": [], "unread_count": 0}

@api_router.post("/provider/notifications/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user=Depends(get_current_provider)):
    """Mark a notification as read by the provider"""
    
    provider_id = current_user["user_id"]
    
    # Check if notification exists
    notification = await db.notifications.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    # Check if already read
    existing_read = await db.notification_reads.find_one({
        "provider_id": provider_id,
        "notification_id": notification_id
    })
    
    if existing_read:
        return {"success": True, "message": "Notificação já estava marcada como lida"}
    
    # Mark as read
    read_record = NotificationRead(
        id=str(uuid.uuid4()),
        provider_id=provider_id,
        notification_id=notification_id,
        read_at=datetime.now(timezone.utc)
    )
    
    await db.notification_reads.insert_one(read_record.dict())
    
    return {"success": True, "message": "Notificação marcada como lida"}

@api_router.post("/provider/notifications/read-all")
async def mark_all_notifications_as_read(current_user=Depends(get_current_provider)):
    """Mark all notifications as read by the provider"""
    
    provider_id = current_user["user_id"]
    
    # Get all active notifications
    now = datetime.now(timezone.utc)
    notifications = await db.notifications.find({
        "is_active": True,
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gte": now.isoformat()}}
        ]
    }).to_list(length=None)
    
    # Get already read notifications
    read_notifications = await db.notification_reads.find({
        "provider_id": provider_id
    }).to_list(length=None)
    
    read_notification_ids = {read["notification_id"] for read in read_notifications}
    
    # Mark unread notifications as read
    new_reads = []
    for notification in notifications:
        if notification["id"] not in read_notification_ids:
            new_read = NotificationRead(
                id=str(uuid.uuid4()),
                provider_id=provider_id,
                notification_id=notification["id"],
                read_at=datetime.now(timezone.utc)
            )
            new_reads.append(new_read.dict())
    
    if new_reads:
        await db.notification_reads.insert_many(new_reads)
    
    return {
        "success": True,
        "message": f"{len(new_reads)} notificações marcadas como lidas"
    }

# Provider Registration (Public endpoint)
@api_router.post("/provider/register")
async def register_provider(provider_data: ProviderCreate, request: Request):
    if not validate_cnpj(provider_data.cnpj):
        raise HTTPException(status_code=400, detail="CNPJ inválido")
        
    if not provider_data.contract_accepted:
        raise HTTPException(status_code=400, detail="É necessário aceitar o contrato")
        
    if not all([provider_data.id_front_photo, provider_data.id_back_photo, provider_data.holding_id_photo]):
        raise HTTPException(status_code=400, detail="É necessário enviar as três fotos de identificação")
    
    # Logo removido - identificação por nome fantasia
    
    existing_provider = await db.providers.find_one({
        "$or": [
            {"email": provider_data.email},
            {"cnpj": provider_data.cnpj}
        ]
    })
    if existing_provider:
        raise HTTPException(status_code=400, detail="Provedor já existe com estes dados")
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Usar email como username para manter compatibilidade
    provider = Provider(
        name=provider_data.name,
        nome_fantasia=provider_data.nome_fantasia,
        email=provider_data.email,
        username=provider_data.email,  # Usar email como username
        password_hash=hash_password(provider_data.password),
        cnpj=provider_data.cnpj,
        phone=provider_data.phone,
        address=provider_data.address,
        bairro=provider_data.bairro,
        id_front_photo=provider_data.id_front_photo,
        id_back_photo=provider_data.id_back_photo,
        holding_id_photo=provider_data.holding_id_photo,
        contract_accepted=True,
        contract_acceptance_date=datetime.now(timezone.utc),
        contract_ip=client_ip
    )
    
    provider_dict = provider.dict()
    provider_dict["created_at"] = provider_dict["created_at"].isoformat()
    provider_dict["contract_acceptance_date"] = provider_dict["contract_acceptance_date"].isoformat()
    await db.providers.insert_one(provider_dict)
    return {"message": "Provedor cadastrado com sucesso"}


# Provider Routes
@api_router.post("/provider/clients", response_model=Client)
async def create_client(client_data: ClientCreate, request: Request, current_user=Depends(get_current_provider)):
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Realize o pagamento para continuar usando o sistema.")
    
    if not validate_cpf(client_data.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    # Validar nível de risco
    if not (1 <= client_data.risk_level <= 5):
        raise HTTPException(status_code=400, detail="Nível de risco deve estar entre 1 e 5")
    
    existing_client = await db.clients.find_one({
        "provider_id": current_user["user_id"],
        "cpf": client_data.cpf,
        "is_active": True
    })
    if existing_client:
        raise HTTPException(
            status_code=409, 
            detail=f"CPF já cadastrado! Cliente '{existing_client['name']}' já existe no seu sistema. Cadastrado em {existing_client.get('inclusion_date', 'data não disponível')[:10]}."
        )
    
    # Parse da data de inclusão
    try:
        inclusion_date = datetime.fromisoformat(client_data.inclusion_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM-DD")
    
    client = Client(
        provider_id=current_user["user_id"],
        name=client_data.name,
        cpf=client_data.cpf,
        email=client_data.email,
        phone=client_data.phone,
        address=client_data.address,
        bairro=client_data.bairro,
        debt_amount=client_data.debt_amount,
        reason=client_data.reason,
        inclusion_date=client_data.inclusion_date,  # Keep as string
        observations=client_data.observations,
        risk_level=client_data.risk_level
    )
    
    client_dict = client.dict()
    # inclusion_date is already a string, no need to convert
    await db.clients.insert_one(client_dict)
    return client


@api_router.get("/provider/contract/{client_id}")
async def get_client_contract(client_id: str, current_user=Depends(get_current_provider)):
    
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    # Novo template de contrato versão 3.0 com LGPD
    # Obter data de contratação do provedor (data de criação da conta)
    provider_creation_date = provider.get("creation_date")
    if provider_creation_date:
        try:
            # Converter de ISO string para datetime se necessário
            if isinstance(provider_creation_date, str):
                creation_dt = datetime.fromisoformat(provider_creation_date.replace('Z', '+00:00'))
            else:
                creation_dt = provider_creation_date
            contract_date = creation_dt.strftime("%d/%m/%Y")
            contract_datetime = creation_dt.strftime("%d/%m/%Y às %H:%M:%S UTC")
        except (ValueError, TypeError, AttributeError):
            # Fallback para data atual se houver erro
            contract_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
            contract_datetime = datetime.now(timezone.utc).strftime("%d/%m/%Y às %H:%M:%S UTC")
    else:
        # Fallback para data atual se não houver creation_date
        contract_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
        contract_datetime = datetime.now(timezone.utc).strftime("%d/%m/%Y às %H:%M:%S UTC")
    
    current_date = contract_date
    current_datetime = contract_datetime
    
    contract_text = f"""📜 CONTRATO DE ADESÃO - CONTROL-ISP (Versão 3.0 - Inclui LGPD)
================================================

DADOS DO PROVEDOR:
Empresa: {provider["name"]}
Email: {provider["email"]}
CNPJ: {provider["cnpj"]}
Assinante: {provider.get("nome_fantasia", provider["name"])}
Data de Adesão: {current_date}

DADOS DO CLIENTE:
Nome: {client["name"]}
CPF: {client["cpf"]}
Email: {client["email"]}
Telefone: {client["phone"]}
Endereço: {client["address"]}{', ' + client.get("bairro", "") if client.get("bairro") else ""}
Valor da Dívida: R$ {client['debt_amount']:.2f}
Motivo: {client["reason"]}

================================================

🎯 1. OBJETO DO CONTRATO
O presente contrato tem por objeto a prestação de serviços de sistema digital para 
controle interno de dívidas entre provedores de internet, denominado "ControleIsp", 
destinado exclusivamente ao controle e gestão de inadimplências.

🔒 2. COMPROMISSO DE SIGILO E CONFIDENCIALIDADE
2.1. SIGILO ABSOLUTO: O contratante compromete-se a manter absoluto sigilo sobre 
todas as informações acessadas no sistema, sob pena de rescisão imediata e aplicação de multa.

2.2. PROIBIÇÃO DE COMPARTILHAMENTO: É EXPRESSAMENTE PROIBIDO compartilhar 
o acesso ao sistema com terceiros, funcionários não autorizados, outras empresas ou qualquer 
pessoa física ou jurídica não cadastrada oficialmente como usuário.

2.3. PROIBIÇÃO DE DIVULGAÇÃO: É TERMINANTEMENTE PROIBIDO divulgar, 
informar ou comunicar aos clientes sobre a existência do sistema ou sobre informações 
nele contidas. A quebra desta cláusula resulta em multa de R$ 10.000,00.

⚖️ 3. ISENÇÃO DE RESPONSABILIDADE
3.1. ISENÇÃO TOTAL: O ControleIsp se isenta de toda e qualquer 
responsabilidade por problemas, conflitos, disputas ou questões que possam surgir 
entre o provedor contratante e seus clientes.

3.2. INTERMEDIAÇÃO: O sistema NÃO atua como intermediário em 
negociações, cobranças ou acordos entre provedor e cliente.

3.3. RESPONSABILIDADE EXCLUSIVA: Toda responsabilidade por 
cobranças, negociações e relacionamento com clientes é EXCLUSIVA do provedor contratante.

📋 4. NATUREZA DO SISTEMA
4.1. FINALIDADE EXCLUSIVA: O sistema é destinado EXCLUSIVAMENTE 
para controle interno de dívidas e inadimplências entre provedores de internet.

4.2. NÃO INCLUSÃO EM ÓRGÃOS RESTRITIVOS: O sistema NÃO inclui, 
NÃO registra e NÃO envia informações para órgãos de proteção ao crédito ou restrição financeira.

4.3. FERRAMENTA DE CONSULTA: Trata-se apenas de uma ferramenta de 
consulta privada entre provedores para evitar contratação de clientes inadimplentes.

💰 5. CONDIÇÕES FINANCEIRAS
5.1. VALOR: Assinatura mensal de R$ 99,00 (noventa e nove reais).
5.2. VENCIMENTO: Todo dia referente ao dia que foi feito o cadastro.
5.3. INADIMPLÊNCIA: O não pagamento resulta em bloqueio imediato do acesso.

📊 6. VERACIDADE DAS INFORMAÇÕES
6.1. OBRIGAÇÃO DE VERACIDADE: Todas as informações inseridas no sistema 
devem ser verdadeiras, precisas e atualizadas.

6.2. PENALIDADE POR DADOS FALSOS: A inserção de dados falsos, 
imprecisos ou maliciosos resulta em multa de R$ 5.000,00 e exclusão imediata do sistema.

⚠️ 7. PENALIDADES E RESCISÃO
7.1. QUEBRA DE CONTRATO: Qualquer quebra das cláusulas deste contrato 
resulta em exclusão imediata sem direito a reembolso.

📝 8. DISPOSIÇÕES FINAIS
8.1. FORO: Fica eleito o foro da comarca de IGUATU/CE para dirimir 
quaisquer questões decorrentes deste contrato.

8.2. VIGÊNCIA: Este contrato tem vigência de 12 (doze) meses, iniciando na data 
da assinatura digital ({current_date}) e expirando automaticamente em {(datetime.strptime(current_date, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")}.

8.2.1. RENOVAÇÃO: Ao término da vigência, o contrato poderá ser renovado mediante 
acordo entre as partes, permanecendo válido enquanto houver pagamento em dia.

8.2.2. REVISÃO DE VALOR: A ControleIsp reserva-se o direito de revisar o valor 
da mensalidade ao final de cada período de vigência, comunicando eventuais 
alterações com antecedência mínima de 30 (trinta) dias. O valor atual de 
R$ 99,00 (noventa e nove reais) mensais vigora durante todo o primeiro período.

8.2.3. CONTINUIDADE: Na ausência de manifestação contrária de qualquer das partes 
até 30 dias antes do vencimento, o contrato será automaticamente renovado por 
igual período, com os valores eventualmente reajustados conforme item 8.2.2.

8.3. ACEITAÇÃO: Ao marcar "Aceito os Termos", o contratante confirma 
ter lido, compreendido e concordado integralmente com todas as cláusulas.

🛡️ 9. CONFORMIDADE LEGAL E ÉTICA - LGPD
9.1. CONFORMIDADE COM A LGPD: Este sistema opera em total conformidade 
com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantindo o tratamento 
adequado e seguro de dados pessoais.

9.2. FINALIDADE DO TRATAMENTO: Os dados pessoais são coletados e 
tratados exclusivamente para a finalidade de controle interno de inadimplências 
entre provedores de internet, com base no legítimo interesse (Art. 7º, IX da LGPD).

9.3. TIPOS DE DADOS TRATADOS: Nome, CPF, endereço, telefone, 
valor da dívida e histórico de inadimplência. NÃO coletamos dados sensíveis.

9.4. DIREITOS DOS TITULARES: Os titulares dos dados têm direito a:
• Confirmação da existência de tratamento
• Acesso aos dados pessoais
• Correção de dados incompletos/inexatos
• Anonimização/bloqueio de dados desnecessários
• Eliminação de dados tratados com consentimento
• Informações sobre compartilhamento
• Revogação do consentimento quando aplicável

9.5. SEGURANÇA DOS DADOS: Implementamos medidas técnicas e 
administrativas adequadas para proteger os dados contra acessos não autorizados, 
vazamentos, alterações ou destruição.

9.6. RETENÇÃO DE DADOS: Os dados são mantidos apenas pelo tempo 
necessário para as finalidades informadas, sendo eliminados após cessação da 
utilidade ou mediante solicitação do titular.

9.7. COMPARTILHAMENTO: Os dados são compartilhados APENAS entre 
provedores cadastrados no sistema para consulta de inadimplência. NÃO compartilhamos 
com terceiros não autorizados.

9.8. RESPONSABILIDADE DO PROVEDOR: O provedor atua como 
controlador dos dados que inserir no sistema, sendo responsável 
por garantir que possui base legal para o tratamento e que os dados são precisos.

9.9. CANAL PARA EXERCÍCIO DE DIREITOS: Para exercer seus direitos 
LGPD, o titular pode entrar em contato através do sistema ou email de suporte.

9.10. INCIDENTES DE SEGURANÇA: Em caso de vazamento ou incidente 
de segurança, a ANPD e os titulares serão comunicados conforme determina a legislação.

📄 10. DISPOSIÇÕES FINAIS ATUALIZADAS
10.1. FORO: Fica eleito o foro da comarca de IGUATU/CE para dirimir 
quaisquer questões decorrentes deste contrato.

10.2. VIGÊNCIA: Este contrato tem vigência de 12 (doze) meses, iniciando na data 
da assinatura digital ({current_date}) e expirando automaticamente em {(datetime.strptime(current_date, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")}.

10.2.1. RENOVAÇÃO: Ao término da vigência, o contrato poderá ser renovado mediante 
acordo entre as partes, permanecendo válido enquanto houver pagamento em dia.

10.2.2. REVISÃO DE VALOR: A ControleIsp reserva-se o direito de revisar o valor 
da mensalidade ao final de cada período de vigência, comunicando eventuais 
alterações com antecedência mínima de 30 (trinta) dias. O valor atual de 
R$ 99,00 (noventa e nove reais) mensais vigora durante todo o primeiro período.

10.2.3. CONTINUIDADE: Na ausência de manifestação contrária de qualquer das partes 
até 30 dias antes do vencimento, o contrato será automaticamente renovado por 
igual período, com os valores eventualmente reajustados conforme item 10.2.2.

10.3. ACEITAÇÃO: Ao marcar "Aceito os Termos", o contratante confirma 
ter lido, compreendido e concordado integralmente com todas as cláusulas, incluindo 
as disposições sobre proteção de dados pessoais.

================================================

✅ CONFIRMAÇÃO DE ASSINATURA DIGITAL:
• Contrato aceito digitalmente em {current_date}
• Assinante responsável: {client["name"]}
• IP de assinatura: Registrado no sistema
• Versão do contrato: 3.0 (Inclui LGPD)
• Data de atualização: {current_date}

================================================

🖋️ ASSINATURA DIGITAL CERTIFICADA - CONTROL-ISP

Por este instrumento de contrato, ambas as partes estão legitimamente 
representadas e concordam com todos os termos estabelecidos.

CONTRATANTE:
{provider.get("nome_fantasia", provider["name"])}
CNPJ: {provider["cnpj"]}
Cliente vinculado: {client["name"]} - CPF: {client["cpf"]}
Assinatura Digital: ✓ Aceita em {current_date}

CONTRATADA:
CONTROL-ISP - Sistema de Gestão de Inadimplência
Representante Legal: CEO - Sistema Automatizado

[ASSINATURA DIGITAL CERTIFICADA - GOV.BR]
📄 Documento Assinado Digitalmente
🔐 Certificação ICP-Brasil
⚖️ Validade Jurídica Garantida

Assinatura Digital do Representante Legal:
https://customer-assets.emergentagent.com/job_ispdebt/artifacts/mlmj7xad_Assinatura%20digital.pdf

Data da Assinatura: {current_date}
Hora da Assinatura: {current_datetime}
Hash do Documento: SHA256-{current_date.replace('/', '')}-CONTROL-ISP
Certificado Digital: ICP-Brasil Válido

================================================

IMPORTANTE: Este documento possui valor legal e comprova a aceitação 
de todos os termos e condições do serviço ControleIsp. A assinatura
digital possui a mesma validade jurídica de uma assinatura manuscrita
conforme MP 2.200-2/2001 e Lei 14.063/2020.

=================================
Este documento foi gerado automaticamente pelo sistema ControleIsp
Contrato assinado digitalmente em: {current_datetime}
Certificação Digital: ICP-Brasil - GOV.BR
"""

    # Generate PDF
    title = "CONTRATO DE ADESÃO - CONTROL-ISP"
    filename = f"Contrato_Cliente_{client['name'].replace(' ', '_')}_{provider['name'].replace(' ', '_')}_v3.0"
    
    try:
        pdf_path = generate_contract_pdf(contract_text, title, filename)
        
        return FileResponse(
            path=str(pdf_path),
            filename=f"{filename}.pdf",
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@api_router.get("/provider/contract")
async def get_provider_contract(current_user=Depends(get_current_provider)):
    """Endpoint para o provedor baixar seu próprio contrato de adesão"""
    
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    # Obter data de contratação do provedor (data de criação da conta)
    provider_creation_date = provider.get("creation_date")
    if provider_creation_date:
        try:
            # Converter de ISO string para datetime se necessário
            if isinstance(provider_creation_date, str):
                creation_dt = datetime.fromisoformat(provider_creation_date.replace('Z', '+00:00'))
            else:
                creation_dt = provider_creation_date
            contract_date = creation_dt.strftime("%d/%m/%Y")
            contract_datetime = creation_dt.strftime("%d/%m/%Y às %H:%M:%S UTC")
        except (ValueError, TypeError, AttributeError):
            # Fallback para data atual se houver erro
            contract_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
            contract_datetime = datetime.now(timezone.utc).strftime("%d/%m/%Y às %H:%M:%S UTC")
    else:
        # Fallback para data atual se não houver creation_date
        contract_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
        contract_datetime = datetime.now(timezone.utc).strftime("%d/%m/%Y às %H:%M:%S UTC")
    
    current_date = contract_date
    current_datetime = contract_datetime
    
    contract_text = f"""📜 CONTRATO DE ADESÃO - CONTROL-ISP (Versão 3.0 - Inclui LGPD)
================================================

DADOS DO PROVEDOR:
Empresa: {provider["name"]}
Email: {provider["email"]}
CNPJ: {provider["cnpj"]}
Assinante: {provider.get("nome_fantasia", provider["name"])}
Data de Adesão: {current_date}

================================================

🎯 1. OBJETO DO CONTRATO
O presente contrato tem por objeto a prestação de serviços de sistema digital para 
controle interno de dívidas entre provedores de internet, denominado "ControleIsp", 
destinado exclusivamente ao controle e gestão de inadimplências.

🔒 2. COMPROMISSO DE SIGILO E CONFIDENCIALIDADE
2.1. SIGILO ABSOLUTO: O contratante compromete-se a manter absoluto sigilo sobre 
todas as informações acessadas no sistema, sob pena de rescisão imediata e aplicação de multa.

2.2. PROIBIÇÃO DE COMPARTILHAMENTO: É EXPRESSAMENTE PROIBIDO compartilhar 
o acesso ao sistema com terceiros, funcionários não autorizados, outras empresas ou qualquer 
pessoa física ou jurídica não cadastrada oficialmente como usuário.

2.3. PROIBIÇÃO DE DIVULGAÇÃO: É TERMINANTEMENTE PROIBIDO divulgar, 
informar ou comunicar aos clientes sobre a existência do sistema ou sobre informações 
nele contidas. A quebra desta cláusula resulta em multa de R$ 10.000,00.

⚖️ 3. ISENÇÃO DE RESPONSABILIDADE
3.1. ISENÇÃO TOTAL: O ControleIsp se isenta de toda e qualquer 
responsabilidade por problemas, conflitos, disputas ou questões que possam surgir 
entre o provedor contratante e seus clientes.

3.2. INTERMEDIAÇÃO: O sistema NÃO atua como intermediário em 
negociações, cobranças ou acordos entre provedor e cliente.

3.3. RESPONSABILIDADE EXCLUSIVA: Toda responsabilidade por 
cobranças, negociações e relacionamento com clientes é EXCLUSIVA do provedor contratante.

📋 4. NATUREZA DO SISTEMA
4.1. FINALIDADE EXCLUSIVA: O sistema é destinado EXCLUSIVAMENTE 
para controle interno de dívidas e inadimplências entre provedores de internet.

4.2. NÃO INCLUSÃO EM ÓRGÃOS RESTRITIVOS: O sistema NÃO inclui, 
NÃO registra e NÃO envia informações para órgãos de proteção ao crédito ou restrição financeira.

4.3. FERRAMENTA DE CONSULTA: Trata-se apenas de uma ferramenta de 
consulta privada entre provedores para evitar contratação de clientes inadimplentes.

💰 5. CONDIÇÕES FINANCEIRAS
5.1. VALOR: Assinatura mensal de R$ 99,00 (noventa e nove reais).
5.2. VENCIMENTO: Todo dia referente ao dia que foi feito o cadastro.
5.3. INADIMPLÊNCIA: O não pagamento resulta em bloqueio imediato do acesso.

📊 6. VERACIDADE DAS INFORMAÇÕES
6.1. OBRIGAÇÃO DE VERACIDADE: Todas as informações inseridas no sistema 
devem ser verdadeiras, precisas e atualizadas.

6.2. PENALIDADE POR DADOS FALSOS: A inserção de dados falsos, 
imprecisos ou maliciosos resulta em multa de R$ 5.000,00 e exclusão imediata do sistema.

⚠️ 7. PENALIDADES E RESCISÃO
7.1. QUEBRA DE CONTRATO: Qualquer quebra das cláusulas deste contrato 
resulta em exclusão imediata sem direito a reembolso.

📝 8. DISPOSIÇÕES FINAIS
8.1. FORO: Fica eleito o foro da comarca de IGUATU/CE para dirimir 
quaisquer questões decorrentes deste contrato.

8.2. VIGÊNCIA: Este contrato tem vigência de 12 (doze) meses, iniciando na data 
da assinatura digital ({current_date}) e expirando automaticamente em {(datetime.strptime(current_date, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")}.

8.2.1. RENOVAÇÃO: Ao término da vigência, o contrato poderá ser renovado mediante 
acordo entre as partes, permanecendo válido enquanto houver pagamento em dia.

8.2.2. REVISÃO DE VALOR: A ControleIsp reserva-se o direito de revisar o valor 
da mensalidade ao final de cada período de vigência, comunicando eventuais 
alterações com antecedência mínima de 30 (trinta) dias. O valor atual de 
R$ 99,00 (noventa e nove reais) mensais vigora durante todo o primeiro período.

8.2.3. CONTINUIDADE: Na ausência de manifestação contrária de qualquer das partes 
até 30 dias antes do vencimento, o contrato será automaticamente renovado por 
igual período, com os valores eventualmente reajustados conforme item 8.2.2.

8.3. ACEITAÇÃO: Ao marcar "Aceito os Termos", o contratante confirma 
ter lido, compreendido e concordado integralmente com todas as cláusulas.

🛡️ 9. CONFORMIDADE LEGAL E ÉTICA - LGPD
9.1. CONFORMIDADE COM A LGPD: Este sistema opera em total conformidade 
com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantindo o tratamento 
adequado e seguro de dados pessoais.

9.2. FINALIDADE DO TRATAMENTO: Os dados pessoais são coletados e 
tratados exclusivamente para a finalidade de controle interno de inadimplências 
entre provedores de internet, com base no legítimo interesse (Art. 7º, IX da LGPD).

9.3. TIPOS DE DADOS TRATADOS: Nome, CPF, endereço, telefone, 
valor da dívida e histórico de inadimplência. NÃO coletamos dados sensíveis.

9.4. DIREITOS DOS TITULARES: Os titulares dos dados têm direito a:
• Confirmação da existência de tratamento
• Acesso aos dados pessoais
• Correção de dados incompletos/inexatos
• Anonimização/bloqueio de dados desnecessários
• Eliminação de dados tratados com consentimento
• Informações sobre compartilhamento
• Revogação do consentimento quando aplicável

9.5. SEGURANÇA DOS DADOS: Implementamos medidas técnicas e 
administrativas adequadas para proteger os dados contra acessos não autorizados, 
vazamentos, alterações ou destruição.

9.6. RETENÇÃO DE DADOS: Os dados são mantidos apenas pelo tempo 
necessário para as finalidades informadas, sendo eliminados após cessação da 
utilidade ou mediante solicitação do titular.

9.7. COMPARTILHAMENTO: Os dados são compartilhados APENAS entre 
provedores cadastrados no sistema para consulta de inadimplência. NÃO compartilhamos 
com terceiros não autorizados.

9.8. RESPONSABILIDADE DO PROVEDOR: O provedor atua como 
controlador dos dados que inserir no sistema, sendo responsável 
por garantir que possui base legal para o tratamento e que os dados são precisos.

9.9. CANAL PARA EXERCÍCIO DE DIREITOS: Para exercer seus direitos 
LGPD, o titular pode entrar em contato através do sistema ou email de suporte.

9.10. INCIDENTES DE SEGURANÇA: Em caso de vazamento ou incidente 
de segurança, a ANPD e os titulares serão comunicados conforme determina a legislação.

📄 10. DISPOSIÇÕES FINAIS ATUALIZADAS
10.1. FORO: Fica eleito o foro da comarca de IGUATU/CE para dirimir 
quaisquer questões decorrentes deste contrato.

10.2. VIGÊNCIA: Este contrato tem vigência de 12 (doze) meses, iniciando na data 
da assinatura digital ({current_date}) e expirando automaticamente em {(datetime.strptime(current_date, "%d/%m/%Y") + timedelta(days=365)).strftime("%d/%m/%Y")}.

10.2.1. RENOVAÇÃO: Ao término da vigência, o contrato poderá ser renovado mediante 
acordo entre as partes, permanecendo válido enquanto houver pagamento em dia.

10.2.2. REVISÃO DE VALOR: A ControleIsp reserva-se o direito de revisar o valor 
da mensalidade ao final de cada período de vigência, comunicando eventuais 
alterações com antecedência mínima de 30 (trinta) dias. O valor atual de 
R$ 99,00 (noventa e nove reais) mensais vigora durante todo o primeiro período.

10.2.3. CONTINUIDADE: Na ausência de manifestação contrária de qualquer das partes 
até 30 dias antes do vencimento, o contrato será automaticamente renovado por 
igual período, com os valores eventualmente reajustados conforme item 10.2.2.

10.3. ACEITAÇÃO: Ao marcar "Aceito os Termos", o contratante confirma 
ter lido, compreendido e concordado integralmente com todas as cláusulas, incluindo 
as disposições sobre proteção de dados pessoais.

================================================

✅ CONFIRMAÇÃO DE ASSINATURA DIGITAL:
• Contrato aceito digitalmente em {current_date}
• Assinante responsável: {provider.get("nome_fantasia", provider["name"])}
• IP de assinatura: Registrado no sistema
• Versão do contrato: 3.0 (Inclui LGPD)
• Data de atualização: {current_date}

================================================

🖋️ ASSINATURA DIGITAL CERTIFICADA - CONTROL-ISP

Por este instrumento de contrato, ambas as partes estão legitimamente 
representadas e concordam com todos os termos estabelecidos.

CONTRATANTE:
{provider.get("nome_fantasia", provider["name"])}
CNPJ: {provider["cnpj"]}
Assinatura Digital: ✓ Aceita em {current_date}

CONTRATADA:
CONTROL-ISP - Sistema de Gestão de Inadimplência
Representante Legal: CEO - Sistema Automatizado

[ASSINATURA DIGITAL CERTIFICADA - GOV.BR]
📄 Documento Assinado Digitalmente
🔐 Certificação ICP-Brasil
⚖️ Validade Jurídica Garantida

Assinatura Digital do Representante Legal:
https://customer-assets.emergentagent.com/job_ispdebt/artifacts/mlmj7xad_Assinatura%20digital.pdf

Data da Assinatura: {current_date}
Hora da Assinatura: {current_datetime}
Hash do Documento: SHA256-{current_date.replace('/', '')}-CONTROL-ISP
Certificado Digital: ICP-Brasil Válido

================================================

IMPORTANTE: Este documento possui valor legal e comprova a aceitação 
de todos os termos e condições do serviço ControleIsp. A assinatura
digital possui a mesma validade jurídica de uma assinatura manuscrita
conforme MP 2.200-2/2001 e Lei 14.063/2020.

=================================
Este documento foi gerado automaticamente pelo sistema ControleIsp
Contrato assinado digitalmente em: {current_datetime}
Certificação Digital: ICP-Brasil - GOV.BR
"""

    # Generate PDF
    title = "CONTRATO DE ADESÃO - CONTROL-ISP"
    filename = f"Contrato_ControlIsp_{provider['name'].replace(' ', '_')}_v3.0"
    
    try:
        pdf_path = generate_contract_pdf(contract_text, title, filename)
        
        return FileResponse(
            path=str(pdf_path),
            filename=f"{filename}.pdf",
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@api_router.get("/provider/clients/{client_id}/whatsapp-charge")
async def generate_whatsapp_charge_message(client_id: str, current_user=Depends(get_current_provider)):
    
    # Buscar cliente
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Buscar dados do provedor
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Gerar mensagem personalizada de cobrança com BOLETOS (se houver)
    debt_value = f"R$ {client['debt_amount']:.2f}"
    pix_key = provider["cnpj"]
    
    # Verifica se o cliente tem boletos salvos
    boletos = client.get('boletos', [])
    
    # Monta mensagem inicial
    message = f"""🤖 Olá, *{client['name'].title()}*! Sou o assistente virtual da *{provider['name']}*.

📋 Identificamos pendências em sua conta:
"""
    
    # Adiciona informações dos boletos
    if boletos and len(boletos) > 0:
        message += f"\n💰 *BOLETOS EM ABERTO:*\n"
        for idx, boleto in enumerate(boletos, 1):
            vencimento = boleto.get('vencimento', 'N/A')
            valor = boleto.get('valor', 0)
            linha_digitavel = boleto.get('linha_digitavel', '')
            codigo_barras = boleto.get('codigo_barras', '')
            url_boleto = boleto.get('url_boleto', '')
            nosso_numero = boleto.get('nosso_numero', '')
            
            message += f"\n📄 *BOLETO {idx}*\n"
            message += f"💵 Valor: R$ {valor:.2f}\n"
            message += f"📅 Vencimento: {vencimento}\n"
            
            if nosso_numero:
                message += f"🔢 Nosso Número: {nosso_numero}\n"
            
            if url_boleto:
                message += f"🔗 Link do Boleto: {url_boleto}\n"
                message += f"📥 Clique para visualizar e pagar\n"
            
            if linha_digitavel:
                message += f"\n📲 *Linha Digitável:*\n`{linha_digitavel}`\n"
            elif codigo_barras:
                message += f"\n📲 *Código de Barras:*\n`{codigo_barras}`\n"
        
        message += f"\n💵 *TOTAL EM ABERTO:* {debt_value}\n"
    else:
        # Caso não tenha boletos (fallback para PIX)
        message += f"\n💰 *Valor Total:* {debt_value}\n"
    
    # Adiciona opção de pagamento via PIX (sempre disponível)
    message += f"""
💳 *PAGAMENTO VIA PIX:*
🔑 Chave: {pix_key}
🏢 Favorecido: {provider['name']}
💰 Valor: {debt_value}
"""
    
    # Instruções finais
    message += f"""
✅ *Já realizou o pagamento?*
Desconsidere esta mensagem.

❓ *Dúvidas ou Negociação?*
Entre em contato conosco:
📞 {provider.get('phone', 'Não informado')}

⚠️ Regularize sua situação para evitar transtornos.

_Este é um contato automático do sistema._
_{provider['name']}_"""

    # Limpar número de telefone (remover caracteres especiais)
    clean_phone = re.sub(r'[^0-9]', '', client['phone'])
    
    # Gerar link WhatsApp com encoding correto
    encoded_message = urllib.parse.quote(message)
    whatsapp_url = f"https://wa.me/55{clean_phone}?text={encoded_message}"
    
    return {
        "success": True,
        "client_name": client['name'],
        "client_phone": client['phone'],
        "debt_amount": debt_value,
        "message": message,
        "whatsapp_url": whatsapp_url,
        "boletos": boletos,
        "provider_logo": provider.get('logo_url'),
        "provider_name": provider['name']
    }


@api_router.get("/provider/clients/all", response_model=List[Client])
async def get_all_provider_clients(current_user=Depends(get_current_provider)):
    """Get all clients (active and inactive) for provider statistics"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Realize o pagamento para continuar usando o sistema.")
    
    # Get all clients (active and inactive)
    clients = await db.clients.find({
        "provider_id": current_user["user_id"]
    }).to_list(1000)
    
    for client in clients:
        if isinstance(client.get('inclusion_date'), str):
            client['inclusion_date'] = datetime.fromisoformat(client['inclusion_date'])
        # Add default bairro for existing clients without this field
        if 'bairro' not in client:
            client['bairro'] = 'Centro'  # Default value for backward compatibility
    return [Client.from_mongo(client) for client in clients]

@api_router.get("/provider/clients", response_model=List[Client])
async def get_provider_clients(current_user=Depends(get_current_provider)):
    """Get active clients only"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Realize o pagamento para continuar usando o sistema.")
    
    clients = await db.clients.find({
        "provider_id": current_user["user_id"],
        "is_active": True
    }).to_list(1000)
    
    for client in clients:
        if isinstance(client.get('inclusion_date'), str):
            client['inclusion_date'] = datetime.fromisoformat(client['inclusion_date'])
        # Add default bairro for existing clients without this field
        if 'bairro' not in client:
            client['bairro'] = 'Centro'  # Default value for backward compatibility
    return [Client.from_mongo(client) for client in clients]


@api_router.delete("/provider/clients/{client_id}")
async def delete_client(client_id: str, current_user=Depends(get_current_provider)):
    
    # Verificar se o cliente existe e pertence ao provedor
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Inativar cliente (soft delete)
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": f"Cliente {client['name']} removido com sucesso"}


@api_router.patch("/provider/clients/{client_id}/phone")
async def update_client_phone(client_id: str, phone_data: ClientPhoneUpdate, current_user=Depends(get_current_provider)):
    """Update client phone number"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Verify if client exists and belongs to provider
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Validate phone format (basic validation)
    phone = phone_data.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Telefone não pode estar vazio")
    
    # Remove any non-digit characters for validation
    phone_digits = ''.join(filter(str.isdigit, phone))
    if len(phone_digits) < 10 or len(phone_digits) > 11:
        raise HTTPException(status_code=400, detail="Telefone deve ter entre 10 e 11 dígitos")
    
    # Update client phone
    old_phone = client.get("phone", "")
    result = await db.clients.update_one(
        {"id": client_id},
        {"$set": {
            "phone": phone,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count > 0:
        return {
            "success": True,
            "message": f"Telefone do cliente {client['name']} atualizado com sucesso",
            "client_id": client_id,
            "old_phone": old_phone,
            "new_phone": phone
        }
    else:
        raise HTTPException(status_code=500, detail="Erro ao atualizar telefone do cliente")



class ClientDebtUpdate(BaseModel):
    debt_amount: float
    provider_notes: Optional[str] = None

@api_router.patch("/provider/clients/{client_id}/debt")
async def update_client_debt(client_id: str, debt_data: ClientDebtUpdate, current_user=Depends(get_current_provider)):
    """Update client debt amount"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Verify if client exists and belongs to provider
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Validate debt amount
    if debt_data.debt_amount < 0:
        raise HTTPException(status_code=400, detail="Valor da dívida não pode ser negativo")
    
    if debt_data.debt_amount > 999999:
        raise HTTPException(status_code=400, detail="Valor da dívida muito alto")
    
    # Update client debt
    old_debt = client.get("debt_amount", 0)
    update_data = {
        "debt_amount": debt_data.debt_amount,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add provider notes if provided
    if debt_data.provider_notes is not None:
        update_data["provider_notes"] = debt_data.provider_notes.strip()
    
    result = await db.clients.update_one(
        {"id": client_id},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return {
            "success": True,
            "message": f"Valor da dívida do cliente {client['name']} atualizado com sucesso",
            "client_id": client_id,
            "old_debt": old_debt,
            "new_debt": debt_data.debt_amount
        }
    else:
        raise HTTPException(status_code=500, detail="Erro ao atualizar valor da dívida")


@api_router.post("/provider/search/clients/name", response_model=List[CrossProviderClient])
async def search_clients_by_name(search_request: ClientSearchRequest, current_user=Depends(get_current_provider)):
    """Search clients by name from other providers"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    search_term = search_request.search_term.strip()
    if not search_term or len(search_term) < 3:
        raise HTTPException(status_code=400, detail="Nome deve ter pelo menos 3 caracteres")
    
    # Search clients from OTHER providers (not current provider)
    clients = await db.clients.find({
        "provider_id": {"$ne": current_user["user_id"]},  # Not from current provider
        "is_active": True,
        "name": {"$regex": search_term, "$options": "i"}  # Case insensitive search
    }).to_list(50)  # Limit results
    
    return await format_cross_provider_clients(clients)


@api_router.post("/provider/search/clients/cpf", response_model=List[CrossProviderClient])
async def search_clients_by_cpf(search_request: ClientSearchRequest, current_user=Depends(get_current_provider)):
    """Search clients by CPF from other providers"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    cpf = search_request.search_term.strip()
    if not cpf:
        raise HTTPException(status_code=400, detail="CPF é obrigatório")
    
    # Clean CPF (remove formatting)
    cpf_clean = ''.join(filter(str.isdigit, cpf))
    if len(cpf_clean) != 11:
        raise HTTPException(status_code=400, detail="CPF deve ter 11 dígitos")
    
    # Search by exact CPF match from OTHER providers
    clients = await db.clients.find({
        "provider_id": {"$ne": current_user["user_id"]},  # Not from current provider
        "is_active": True,
        "$or": [
            {"cpf": cpf},
            {"cpf": cpf_clean}
        ]
    }).to_list(50)
    
    return await format_cross_provider_clients(clients)


@api_router.post("/provider/search/clients/address", response_model=List[CrossProviderClient])
async def search_clients_by_address(search_request: ClientSearchRequest, current_user=Depends(get_current_provider)):
    """Search clients by address from other providers"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    search_term = search_request.search_term.strip()
    if not search_term or len(search_term) < 5:
        raise HTTPException(status_code=400, detail="Endereço deve ter pelo menos 5 caracteres")
    
    # Search clients by address from OTHER providers
    clients = await db.clients.find({
        "provider_id": {"$ne": current_user["user_id"]},  # Not from current provider
        "is_active": True,
        "address": {"$regex": search_term, "$options": "i"}  # Case insensitive search
    }).to_list(50)  # Limit results
    
    return await format_cross_provider_clients(clients)


async def format_cross_provider_clients(clients):
    """Format clients for cross-provider search results"""
    formatted_clients = []
    
    for client in clients:
        # Get provider information
        provider = await db.providers.find_one({"id": client["provider_id"]})
        if not provider:
            continue
        
        # Convert datetime if needed
        inclusion_date = client.get('inclusion_date')
        if isinstance(inclusion_date, str):
            inclusion_date = datetime.fromisoformat(inclusion_date)
        
        # Calculate days negative
        days_negative = (datetime.now(timezone.utc) - inclusion_date).days
        
        formatted_client = CrossProviderClient(
            id=client["id"],
            name=client["name"],
            cpf=client["cpf"],
            address=client["address"],
            bairro=client.get("bairro", ""),  # Added bairro field
            debt_amount=client["debt_amount"],
            reason=client["reason"],
            inclusion_date=inclusion_date,
            risk_level=client.get("risk_level", 1),
            provider_name=provider["name"],
            provider_cnpj=provider["cnpj"],
            provider_logo=provider.get("logo_url"),
            provider_notes=client.get("provider_notes"),
            days_negative=days_negative
        )
        formatted_clients.append(formatted_client)
    
    return formatted_clients


# Payment Reminders Endpoints
@api_router.post("/provider/clients/{client_id}/reminder", response_model=PaymentReminderResponse)
async def create_payment_reminder(client_id: str, reminder_data: PaymentReminderCreate, current_user=Depends(get_current_provider)):
    """Create a payment reminder for a client"""
    
    # Check if provider has active subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Verify if client exists and belongs to provider
    client = await db.clients.find_one({
        "id": client_id,
        "provider_id": current_user["user_id"],
        "is_active": True
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Create reminder
    reminder = PaymentReminder(
        client_id=client_id,
        provider_id=current_user["user_id"],
        reminder_date=reminder_data.reminder_date,
        amount=reminder_data.amount,
        notes=reminder_data.notes
    )
    
    # Save to database
    await db.payment_reminders.insert_one(reminder.dict())
    
    return PaymentReminderResponse(
        success=True,
        message="Lembrete de pagamento criado com sucesso!",
        reminder=reminder
    )

@api_router.get("/provider/clients/{client_id}/reminders")
async def get_client_reminders(client_id: str, current_user=Depends(get_current_provider)):
    """Get all reminders for a specific client"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get reminders
    reminders = await db.payment_reminders.find({
        "client_id": client_id,
        "provider_id": current_user["user_id"]
    }).sort("reminder_date", -1).to_list(100)
    
    return [PaymentReminder(**reminder) for reminder in reminders]

@api_router.get("/provider/reminders")
async def get_all_provider_reminders(current_user=Depends(get_current_provider)):
    """Get all reminders for the current provider"""
    
    try:
        # Check subscription
        has_active_subscription = await check_subscription_status(current_user["user_id"])
        if not has_active_subscription:
            raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
        
        # Get all reminders for this provider
        reminders = await db.payment_reminders.find({
            "provider_id": current_user["user_id"]
        }).sort("reminder_date", 1).to_list(1000)
        
        # Enrich with client data
        enriched_reminders = []
        for reminder in reminders:
            try:
                # Remove MongoDB ObjectId fields that cause serialization issues
                if "_id" in reminder:
                    del reminder["_id"]
                
                # Check if reminder has required fields
                if not reminder.get("client_id"):
                    print(f"Reminder sem client_id: {reminder}")
                    continue
                    
                client = await db.clients.find_one({"id": reminder["client_id"], "is_active": True})
                if client:
                    reminder["client_name"] = client.get("name", "Nome não encontrado")
                    reminder["client_phone"] = client.get("phone", "Telefone não encontrado")
                else:
                    # Client not found or inactive - add reminder without enrichment
                    reminder["client_name"] = "Cliente não encontrado"
                    reminder["client_phone"] = "N/A"
                
                # Ensure all required fields are present
                if not reminder.get("id"):
                    reminder["id"] = str(reminder.get("_id", "no-id"))
                if not reminder.get("status"):
                    reminder["status"] = "scheduled"
                if not reminder.get("amount"):
                    reminder["amount"] = 0.0
                    
                enriched_reminders.append(reminder)
                    
            except Exception as e:
                print(f"Erro ao processar reminder {reminder.get('id', 'sem-id')}: {e}")
                # Continue without adding problematic reminder
                continue
        
        return enriched_reminders
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 402)
        raise
    except Exception as e:
        print(f"Erro geral no endpoint get_all_provider_reminders: {e}")
        # Return empty list instead of crashing
        return []

@api_router.delete("/provider/reminders/{reminder_id}")
async def delete_payment_reminder(reminder_id: str, current_user=Depends(get_current_provider)):
    """Delete a payment reminder"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Verify reminder exists and belongs to provider
    reminder = await db.payment_reminders.find_one({
        "id": reminder_id,
        "provider_id": current_user["user_id"]
    })
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado")
    
    # Delete reminder
    await db.payment_reminders.delete_one({"id": reminder_id})
    
    return {"success": True, "message": "Lembrete removido com sucesso"}

@api_router.post("/provider/reminders/{reminder_id}/send")
async def send_reminder_whatsapp(reminder_id: str, current_user=Depends(get_current_provider)):
    """Generate WhatsApp message for payment reminder"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get reminder
    reminder = await db.payment_reminders.find_one({
        "id": reminder_id,
        "provider_id": current_user["user_id"]
    })
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado")
    
    # Get client data
    client = await db.clients.find_one({"id": reminder["client_id"], "is_active": True})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Get provider data
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    # Create PIX key (using provider CNPJ)
    pix_key = provider["cnpj"]
    
    # Format reminder date
    reminder_date = datetime.fromisoformat(reminder["reminder_date"]).strftime("%d/%m/%Y")
    
    # Create WhatsApp message with PIX payment
    message = f"""🗓️ *LEMBRETE DE PAGAMENTO* 🗓️

Olá {client['name'].upper()}!

📅 *Data agendada para pagamento:* {reminder_date}
💰 *Valor:* R$ {reminder['amount']:.2f}

💳 *DADOS PARA PAGAMENTO PIX:*
🔑 Chave PIX: {pix_key}
🏢 Favorecido: {provider['name']}
📄 CNPJ: {provider['cnpj']}

📝 *Observações:* {reminder.get('notes', 'Nenhuma observação adicional')}

⚠️ *IMPORTANTE:*
• Após o pagamento, envie o comprovante por WhatsApp
• Sua situação será regularizada em até 2 horas
• Mantenha seus dados atualizados conosco

🤝 Contamos com sua parceria!

_Mensagem automática - {provider['name']}_"""

    # Update reminder as sent
    await db.payment_reminders.update_one(
        {"id": reminder_id},
        {"$set": {"sent": True, "sent_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "success": True,
        "message": message,
        "client_phone": client["phone"],
        "whatsapp_url": f"https://wa.me/55{re.sub(r'[^0-9]', '', client['phone'])}?text={urllib.parse.quote(message)}",
        "provider_logo": provider.get('logo_url'),
        "provider_name": provider['name']
    }


# Provider Logo Endpoints
@api_router.post("/provider/logo/upload")
async def upload_provider_logo(file: UploadFile = File(...), current_user=Depends(get_current_provider)):
    """Upload logo for provider to Cloudflare R2"""
    
    print(f"[R2-UPLOAD] Iniciando upload de logo para provider: {current_user['user_id']}")
    print(f"[R2-UPLOAD] Arquivo: {file.filename}, tipo: {file.content_type}")
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        print(f"[R2-UPLOAD] Erro: Assinatura inativa para provider: {current_user['user_id']}")
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        print(f"[R2-UPLOAD] Erro: Tipo de arquivo inválido: {file.content_type}")
        raise HTTPException(status_code=400, detail="Apenas arquivos de imagem são permitidos")
    
    # Validate file size (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        print(f"[R2-UPLOAD] Erro: Arquivo muito grande: {len(content)} bytes")
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB permitido")
    
    print(f"[R2-UPLOAD] Arquivo válido, tamanho: {len(content)} bytes")
    
    try:
        # Generate unique filename for R2
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
        object_key = f"provider_logos/{current_user['user_id']}_{uuid.uuid4().hex[:8]}.{file_extension}"
        
        print(f"[R2-UPLOAD] Fazendo upload para R2 com key: {object_key}")
        
        # Upload to R2
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=object_key,
            Body=content,
            ContentType=file.content_type,
            CacheControl='public, max-age=31536000'  # Cache for 1 year
        )
        
        # Generate public URL
        logo_url = f"{R2_PUBLIC_URL}/{object_key}"
        print(f"[R2-UPLOAD] Upload concluído! URL: {logo_url}")
        
        # Update provider in database
        result = await db.providers.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "logo_url": logo_url,
                "logo_r2_key": object_key,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count == 0:
            print(f"[R2-UPLOAD] Aviso: Provider não foi atualizado no banco")
        else:
            print(f"[R2-UPLOAD] Provider atualizado com sucesso no banco")
        
        return {
            "success": True,
            "message": "Logo enviada com sucesso!",
            "logo_url": logo_url
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"[R2-UPLOAD] Erro no upload (ClientError): {error_code} - {error_message}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload no R2: {error_message}")
    except Exception as e:
        print(f"[R2-UPLOAD] Erro no upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")

@api_router.get("/provider/logo")
async def get_provider_logo(current_user=Depends(get_current_provider)):
    """Get current provider logo URL"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get provider data
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    return {
        "success": True,
        "logo_url": provider.get("logo_url"),
        "has_logo": bool(provider.get("logo_url"))
    }

@api_router.delete("/provider/logo")
async def delete_provider_logo(current_user=Depends(get_current_provider)):
    """Delete provider logo"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get current logo
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    
    if not provider or not provider.get("logo_url"):
        raise HTTPException(status_code=404, detail="Nenhuma logo encontrada")
    
    # Remove file from disk
    try:
        logo_path = Path(f"/app{provider['logo_url']}")
        if logo_path.exists():
            logo_path.unlink()
    except Exception as e:
        print(f"Erro ao remover arquivo de logo: {e}")
    
    # Update database
    result = await db.providers.update_one(
        {"id": current_user["user_id"]},
        {"$unset": {"logo_url": ""}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Erro ao remover logo do banco de dados")
    
    return {
        "success": True,
        "message": "Logo removida com sucesso!"
    }


# Provider Profile Update Endpoints
@api_router.patch("/provider/profile")
async def update_provider_profile(profile_data: ProviderProfileUpdate, current_user=Depends(get_current_provider)):
    """Update provider email and phone"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    update_fields = {}
    
    # Validate and update email if provided
    if profile_data.email is not None:
        email = profile_data.email.strip().lower()
        if email:
            # Check if email is already in use by another provider
            existing = await db.providers.find_one({
                "email": email,
                "id": {"$ne": current_user["user_id"]}
            })
            if existing:
                raise HTTPException(status_code=400, detail="Este email já está em uso")
            update_fields["email"] = email
    
    # Validate and update phone if provided
    if profile_data.phone is not None:
        phone = profile_data.phone.strip()
        if phone:
            update_fields["phone"] = phone
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update provider
    result = await db.providers.update_one(
        {"id": current_user["user_id"]},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Erro ao atualizar perfil")
    
    return {
        "success": True,
        "message": "Perfil atualizado com sucesso!",
        "updated_fields": list(update_fields.keys())
    }


@api_router.patch("/provider/password")
async def update_provider_password(password_data: ProviderPasswordUpdate, current_user=Depends(get_current_provider)):
    """Update provider password"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get current provider
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    # Verify old password
    if not verify_password(password_data.old_password, provider["password_hash"]):
        raise HTTPException(status_code=400, detail="Senha antiga incorreta")
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")
    
    # Hash new password
    new_password_hash = hash_password(password_data.new_password)
    
    # Update password
    result = await db.providers.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "password_hash": new_password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Erro ao atualizar senha")
    
    return {
        "success": True,
        "message": "Senha atualizada com sucesso!"
    }


@api_router.get("/provider/info")
async def get_provider_info(current_user=Depends(get_current_provider)):
    """Get full provider information including logo"""
    
    # Check subscription
    has_active_subscription = await check_subscription_status(current_user["user_id"])
    if not has_active_subscription:
        raise HTTPException(status_code=402, detail="Assinatura expirada. Renove para continuar usando o sistema.")
    
    # Get provider
    provider = await db.providers.find_one({"id": current_user["user_id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    return {
        "success": True,
        "provider": {
            "id": provider["id"],
            "name": provider.get("name", ""),
            "nome_fantasia": provider.get("nome_fantasia", ""),
            "cnpj": provider.get("cnpj", ""),
            "email": provider.get("email", ""),
            "phone": provider.get("phone", ""),
            "logo_url": provider.get("logo_url"),
            "created_at": provider.get("created_at")
        }
    }


@api_router.post("/validate/cnpj")
async def validate_cnpj_endpoint(data: dict):
    """Endpoint para validar e consultar dados de CNPJ"""
    cnpj = data.get("cnpj", "")
    if not cnpj:
        raise HTTPException(status_code=400, detail="CNPJ é obrigatório")
    
    return await lookup_cnpj_data(cnpj)


@api_router.post("/validate/cpf")
async def validate_cpf_endpoint(data: dict):
    """Endpoint para validar CPF"""
    cpf = data.get("cpf", "")
    if not cpf:
        raise HTTPException(status_code=400, detail="CPF é obrigatório")
    
    return await lookup_cpf_data(cpf)


@api_router.post("/validate/cep")
async def validate_cep_endpoint(data: dict):
    """Endpoint para validar e consultar dados de CEP"""
    cep = data.get("cep", "")
    if not cep:
        raise HTTPException(status_code=400, detail="CEP é obrigatório")
    
    return await lookup_cep_data(cep)


@api_router.get("/")
async def root():
    return {"message": "ControleIsp API"}


# Payment Routes
async def is_new_provider(provider_id: str) -> bool:
    """Verifica se é um provedor novo (nunca teve assinatura)"""
    subscription_count = await db.subscriptions.count_documents({"provider_id": provider_id})
    return subscription_count == 0


async def create_promotional_subscription(provider_id: str):
    """Cria assinatura promocional de 1 mês grátis para novos provedores"""
    subscription = Subscription(
        provider_id=provider_id,
        payment_status="promotional",  # Status especial para promoção
        payment_id="PROMOCIONAL_PRIMEIRO_MES",
        amount=0.00,  # Gratuito
        paid_at=datetime.now(timezone.utc),  # Considera como pago
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),  # 30 dias grátis
        is_promotional=True,
        promotional_type="first_month_free"
    )
    return subscription


# =============================================================================
# EFI BANK PAYMENT ROUTES
# =============================================================================

@api_router.post("/payment/efi/boleto")
async def create_efi_boleto(request: PaymentRequest, current_user=Depends(get_current_provider)):
    """Create boleto payment with Efi Bank for provider subscription"""
    
    provider_id = current_user["user_id"]
    
    try:
        # Check if provider already has active subscription
        has_active = await check_subscription_status(provider_id)
        if has_active:
            raise HTTPException(status_code=400, detail="Você já possui uma assinatura ativa")
        
        # Determine amount (check for promotions)
        amount = 199.00  # Default monthly price
        
        # Create boleto payment
        payment_result = await create_efi_boleto_payment(provider_id, amount)
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=400, detail="Erro ao criar boleto")
        
        # Create subscription record
        subscription = Subscription(
            id=str(uuid.uuid4()),
            provider_id=provider_id,
            payment_status="pending",
            amount=amount,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        
        subscription_dict = subscription.dict()
        subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
        subscription_dict["expires_at"] = subscription_dict["expires_at"].isoformat()
        
        await db.subscriptions.insert_one(subscription_dict)
        
        # Create payment record
        payment = Payment(
            provider_id=provider_id,
            subscription_id=subscription.id,
            payment_id=str(payment_result["charge_id"]),
            amount=amount,
            status="pending",
            payment_method="boleto"
        )
        
        payment_dict = payment.dict()
        payment_dict["created_at"] = payment_dict["created_at"].isoformat()
        
        await db.payments.insert_one(payment_dict)
        
        return {
            "success": True,
            "payment_type": "boleto",
            "charge_id": payment_result["charge_id"],
            "barcode": payment_result["barcode"],
            "link": payment_result["link"],
            "pdf": payment_result["pdf"],
            "amount": amount,
            "expire_at": payment_result["expire_at"],
            "subscription_id": subscription.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating boleto payment: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar boleto")


@api_router.post("/payment/efi/pix")
async def create_efi_pix(request: PaymentRequest, current_user=Depends(get_current_provider)):
    """Create PIX payment with Efi Bank for provider subscription"""
    
    provider_id = current_user["user_id"]
    
    try:
        # Check if provider already has active subscription
        has_active = await check_subscription_status(provider_id)
        if has_active:
            raise HTTPException(status_code=400, detail="Você já possui uma assinatura ativa")
        
        # Determine amount
        amount = 199.00  # Default monthly price
        
        # Create PIX payment
        payment_result = await create_efi_pix_payment(provider_id, amount)
        
        if not payment_result.get("success"):
            raise HTTPException(status_code=400, detail="Erro ao criar PIX")
        
        # Create subscription record
        subscription = Subscription(
            id=str(uuid.uuid4()),
            provider_id=provider_id,
            payment_status="pending",
            amount=amount,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        
        subscription_dict = subscription.dict()
        subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
        subscription_dict["expires_at"] = subscription_dict["expires_at"].isoformat()
        
        await db.subscriptions.insert_one(subscription_dict)
        
        # Create payment record
        payment = Payment(
            provider_id=provider_id,
            subscription_id=subscription.id,
            payment_id=str(payment_result["charge_id"]),
            amount=amount,
            status="waiting",
            payment_method="pix"
        )
        
        payment_dict = payment.dict()
        payment_dict["created_at"] = payment_dict["created_at"].isoformat()
        
        await db.payments.insert_one(payment_dict)
        
        return {
            "success": True,
            "payment_type": "pix",
            "charge_id": payment_result["charge_id"],
            "qr_code": payment_result["qr_code"],
            "qr_code_base64": payment_result["qr_code_base64"],
            "amount": amount,
            "expires_at": payment_result["expires_at"],
            "subscription_id": subscription.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating PIX payment: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar PIX")


# LEGACY MERCADO PAGO ROUTE - KEPT FOR COMPATIBILITY (DISABLED)
@api_router.post("/payment/create")
async def create_payment(request: PaymentRequest, promo_code: Optional[str] = None, current_user=Depends(get_current_provider)):
    """DEPRECATED - Use /payment/efi/boleto or /payment/efi/pix instead"""
    
    provider_id = current_user["user_id"]
    
    try:
        # Check if provider already has an active subscription
        has_active = await check_subscription_status(provider_id)
        if has_active:
            raise HTTPException(status_code=400, detail="Você já possui uma assinatura ativa")
        
        # Verificar se é um novo provedor (primeiro mês grátis)
        if await is_new_provider(provider_id):
            # Criar assinatura promocional gratuita
            subscription = await create_promotional_subscription(provider_id)
            
            subscription_dict = subscription.dict()
            subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
            subscription_dict["expires_at"] = subscription_dict["expires_at"].isoformat()
            subscription_dict["paid_at"] = subscription_dict["paid_at"].isoformat()
            
            await db.subscriptions.insert_one(subscription_dict)
            
            return {
                "success": True,
                "message": "🎉 Parabéns! Você ganhou 1 MÊS GRATUITO!",
                "subscription_type": "promotional",
                "promotional_details": {
                    "type": "first_month_free",
                    "days_remaining": 30,
                    "expires_at": subscription.expires_at.isoformat(),
                    "amount_saved": 99.00
                }
            }
        
        # Verificar se tem promoção Black Friday ativa
        is_black_friday_active = promo_code and promo_code.lower() == "blackfriday"
        amount = 99.00  # Preço promocional Black Friday
        
        if is_black_friday_active:
            print(f"[BLACK-FRIDAY] Criando pagamento promocional para provider: {provider_id}")
        
        # Provedor antigo - criar PIX payment (com ou sem promoção)
        payment_result = await create_pix_payment(provider_id, amount=amount)
        
        # Create subscription record
        subscription = Subscription(
            provider_id=provider_id,
            payment_id=str(payment_result["payment_id"]),
            pix_qr_code=payment_result["qr_code"],
            pix_qr_base64=payment_result["qr_code_base64"],
            amount=amount,
            is_promotional=is_black_friday_active,
            promotional_type="black_friday" if is_black_friday_active else None,
            promotional_months_remaining=3 if is_black_friday_active else 0
        )
        
        subscription_dict = subscription.dict()
        subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
        subscription_dict["expires_at"] = subscription_dict["expires_at"].isoformat()
        
        await db.subscriptions.insert_one(subscription_dict)
        
        # Create payment record
        payment = Payment(
            provider_id=provider_id,
            subscription_id=subscription.id,
            payment_id=str(payment_result["payment_id"]),
            amount=amount
        )
        
        payment_dict = payment.dict()
        payment_dict["created_at"] = payment_dict["created_at"].isoformat()
        
        await db.payments.insert_one(payment_dict)
        
        response = {
            "success": True,
            "payment_id": payment_result["payment_id"],
            "qr_code": payment_result["qr_code"],
            "qr_code_base64": payment_result["qr_code_base64"],
            "amount": amount,
            "subscription_id": subscription.id
        }
        
        if is_black_friday_active:
            response["promo_details"] = {
                "discount": "50%",
                "original_price": 199.00,
                "promotional_price": 99.00,
                "savings": 100.00,
                "promotional_months": 3,
                "message": "🔥 BLACK FRIDAY: R$ 99,00/mês por 3 meses! Economia de R$ 300,00!"
            }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating payment: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar pagamento")


@api_router.get("/payment/status")
async def get_payment_status(current_user=Depends(get_current_provider)):
    """Get current provider payment/subscription status"""
    
    provider_id = current_user["user_id"]
    
    try:
        # Check if payment is required globally
        payment_required = await is_payment_required()
        
        # If payment is not required (free system), return active status
        if not payment_required:
            return {
                "has_subscription": True,
                "status": "free",
                "expires_at": None,
                "is_active": True,
                "needs_payment": False,
                "show_pix": False,
                "days_until_expiry": 999,
                "qr_code": None,
                "qr_code_base64": None,
                "payment_required": False
            }
        
        # Get current subscription
        subscription = await get_provider_subscription(provider_id)
        
        if not subscription:
            return {
                "has_subscription": False,
                "status": "no_subscription",
                "needs_payment": True,
                "show_pix": True,
                "payment_required": True
            }
        
        now = datetime.now(timezone.utc)
        expires_at = datetime.fromisoformat(subscription["expires_at"])
        
        # Check if subscription is active
        is_active = subscription["payment_status"] == "active" and expires_at > now
        
        # Check if needs reminder (2 days before expiration)
        reminder_date = expires_at - timedelta(days=2)
        needs_reminder = now >= reminder_date and not subscription.get("reminder_sent", False)
        
        # Send reminder if needed
        if needs_reminder and is_active:
            await send_payment_reminder(provider_id)
            await db.subscriptions.update_one(
                {"id": subscription["id"]},
                {"$set": {"reminder_sent": True}}
            )
        
        return {
            "has_subscription": True,
            "status": subscription["payment_status"],
            "expires_at": subscription["expires_at"],
            "is_active": is_active,
            "needs_payment": not is_active,
            "show_pix": not is_active,
            "days_until_expiry": (expires_at - now).days if expires_at > now else 0,
            "qr_code": subscription.get("pix_qr_code") if not is_active else None,
            "qr_code_base64": subscription.get("pix_qr_base64") if not is_active else None,
            "payment_required": True
        }
        
    except Exception as e:
        print(f"Error getting payment status: {e}")
        raise HTTPException(status_code=500, detail="Erro ao consultar status do pagamento")


@api_router.post("/payment/efi/webhook")
async def efi_payment_webhook(request: Request):
    """Handle Efi Bank webhook notifications for payment confirmations"""
    try:
        # Get raw body for signature validation
        body = await request.body()
        payload = body.decode()
        
        # Log webhook
        print("[EFI WEBHOOK] Received notification")
        print(f"[EFI WEBHOOK] Payload: {payload}")
        
        # Parse JSON
        webhook_data = json.loads(payload)
        
        # Extract signature if present
        signature = request.headers.get("X-Efi-Signature", "")
        
        # Verify signature (skip in development if not configured)
        if signature:
            is_valid = await verify_efi_webhook_signature(payload, signature)
            if not is_valid:
                print("[EFI WEBHOOK] Invalid signature")
                # In production, reject invalid signatures
                # For now, continue for debugging
        
        # Extract charge information
        notification_type = webhook_data.get("notification_type", webhook_data.get("tipo", ""))
        
        print(f"[EFI WEBHOOK] Notification type: {notification_type}")
        
        # Handle different notification types
        if notification_type in ["charge", "cobranca", "pix"]:
            # Extract charge data
            data = webhook_data.get("data", webhook_data.get("dados", {}))
            
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            
            charge_id = data.get("charge_id", data.get("identificador", ""))
            status = data.get("status", "")
            
            print(f"[EFI WEBHOOK] Charge ID: {charge_id}, Status: {status}")
            
            if charge_id:
                # Find payment record
                payment_record = await db.payments.find_one({"payment_id": str(charge_id)})
                
                if payment_record:
                    print(f"[EFI WEBHOOK] Found payment record for charge {charge_id}")
                    
                    # Map Efi status to our status
                    new_status = "paid" if status in ["paid", "pago", "confirmed"] else status
                    
                    # Update payment status
                    await db.payments.update_one(
                        {"payment_id": str(charge_id)},
                        {"$set": {"status": new_status}}
                    )
                    
                    print(f"[EFI WEBHOOK] Payment status updated to: {new_status}")
                    
                    # If payment is confirmed, activate subscription
                    if new_status == "paid":
                        subscription_id = payment_record.get("subscription_id")
                        
                        if subscription_id:
                            print(f"[EFI WEBHOOK] Activating subscription: {subscription_id}")
                            
                            await db.subscriptions.update_one(
                                {"id": subscription_id},
                                {"$set": {
                                    "payment_status": "active",
                                    "updated_at": datetime.now(timezone.utc).isoformat()
                                }}
                            )
                            
                            print(f"[EFI WEBHOOK] Subscription activated successfully")
                else:
                    print(f"[EFI WEBHOOK] Payment record not found for charge {charge_id}")
        
        return {"status": "received", "code": 200}
        
    except Exception as e:
        print(f"[EFI WEBHOOK] Error processing webhook: {str(e)}")
        return {"status": "error", "code": 500, "message": str(e)}


# LEGACY MERCADO PAGO WEBHOOK - KEPT FOR COMPATIBILITY (DISABLED)
@api_router.post("/payment/webhook")
async def payment_webhook(request: Request):
    """DEPRECATED - Mercado Pago webhook (disabled) - Use /payment/efi/webhook"""
    try:
        # Log incoming webhook
        body = await request.body()
        payload = body.decode()
        headers = dict(request.headers)
        
        print("[WEBHOOK] Received webhook:")
        print(f"[WEBHOOK] Headers: {headers}")
        print(f"[WEBHOOK] Payload: {payload}")
        
        # Parse webhook data
        webhook_data = json.loads(payload)
        print(f"[WEBHOOK] Parsed data: {webhook_data}")
        
        # Check webhook type
        webhook_type = webhook_data.get("type")
        print(f"[WEBHOOK] Type: {webhook_type}")
        
        if webhook_type == "payment":
            payment_id = webhook_data.get("data", {}).get("id")
            print(f"[WEBHOOK] Payment ID: {payment_id}")
            
            if payment_id:
                # Get payment details from Mercado Pago
                print("[WEBHOOK] Fetching payment details from Mercado Pago...")
                payment_response = mp_sdk.payment().get(payment_id)
                print(f"[WEBHOOK] MP Response status: {payment_response['status']}")
                
                if payment_response["status"] == 200:
                    payment_data = payment_response["response"]
                    print(f"[WEBHOOK] Payment data: {payment_data}")
                    
                    # Find our payment record
                    payment_record = await db.payments.find_one({"payment_id": str(payment_id)})
                    print(f"[WEBHOOK] Found payment record: {payment_record is not None}")
                    
                    if payment_record:
                        # Update payment status
                        new_status = payment_data["status"]
                        print(f"[WEBHOOK] New payment status: {new_status}")
                        
                        await db.payments.update_one(
                            {"payment_id": str(payment_id)},
                            {
                                "$set": {
                                    "payment_status": new_status,
                                    "approved_at": datetime.now(timezone.utc).isoformat() if new_status == "approved" else None
                                }
                            }
                        )
                        
                        # If payment approved, activate subscription
                        if new_status == "approved":
                            print(f"[WEBHOOK] Activating subscription: {payment_record['subscription_id']}")
                            result = await db.subscriptions.update_one(
                                {"id": payment_record["subscription_id"]},
                                {
                                    "$set": {
                                        "payment_status": "active",
                                        "paid_at": datetime.now(timezone.utc).isoformat(),
                                        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                                        "reminder_sent": False
                                    }
                                }
                            )
                            print(f"[WEBHOOK] Subscription activation result: {result.modified_count} documents updated")
                    else:
                        print(f"[WEBHOOK] Payment record not found for ID: {payment_id}")
                else:
                    print(f"[WEBHOOK] Failed to get payment from MP: {payment_response}")
            else:
                print("[WEBHOOK] No payment ID in webhook data")
        else:
            print(f"[WEBHOOK] Ignoring webhook type: {webhook_type}")
        
        return {"status": "ok", "processed": True}
        
    except Exception as e:
        print(f"[WEBHOOK ERROR] {str(e)}")
        import traceback
        print(f"[WEBHOOK ERROR] Traceback: {traceback.format_exc()}")
        return {"status": "error", "message": str(e)}


@api_router.post("/payment/check-manual")
async def check_payment_manual(current_user=Depends(get_current_provider)):
    """Manually check payment status for current provider - SECURITY CRITICAL"""
    
    provider_id = current_user["user_id"]
    
    try:
        print(f"[SECURITY] Manual payment check initiated for provider: {provider_id}")
        
        # Rate limiting - only allow one check per minute per provider
        last_check_key = f"last_manual_check_{provider_id}"
        one_minute_ago = datetime.now(timezone.utc) - timedelta(minutes=1)
        
        # Check if provider made a request in the last minute
        recent_check = await db.temp_data.find_one({
            "key": last_check_key,
            "timestamp": {"$gte": one_minute_ago.isoformat()}
        })
        
        if recent_check:
            print(f"[SECURITY] Rate limit exceeded for provider: {provider_id}")
            return {"success": False, "message": "Aguarde 1 minuto antes de verificar novamente"}
        
        # Record this check
        await db.temp_data.update_one(
            {"key": last_check_key},
            {
                "$set": {
                    "key": last_check_key,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "provider_id": provider_id
                }
            },
            upsert=True
        )
        
        # Get the most recent payment for this provider (only within last 30 minutes)
        thirty_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
        
        payment = await db.payments.find_one(
            {
                "provider_id": provider_id, 
                "status": "pending",
                "created_at": {"$gte": thirty_minutes_ago.isoformat()}
            },
            sort=[("created_at", -1)]
        )
        
        if not payment:
            print(f"[SECURITY] No recent pending payment found for provider: {provider_id}")
            return {"success": False, "message": "Nenhum pagamento pendente recente encontrado. Gere um novo PIX se necessário."}
        
        print(f"[SECURITY] Checking payment ID: {payment['payment_id']}")
        
        # Check payment status in Mercado Pago
        payment_response = mp_sdk.payment().get(payment["payment_id"])
        
        print(f"[SECURITY] Mercado Pago API response status: {payment_response['status']}")
        
        if payment_response["status"] == 200:
            payment_data = payment_response["response"]
            mp_status = payment_data["status"]
            
            print(f"[SECURITY] Payment {payment['payment_id']} status from Mercado Pago: {mp_status}")
            print(f"[SECURITY] Full payment data: {payment_data}")
            
            # CRITICAL SECURITY CHECK - Only proceed if status is exactly "approved"
            if mp_status != "approved":
                print(f"[SECURITY] Payment NOT approved. Status: {mp_status}. Access DENIED.")
                return {
                    "success": False, 
                    "message": f"Pagamento ainda não foi aprovado. Status atual: {mp_status}", 
                    "status": mp_status
                }
            
            # Double check - verify transaction amount and other security fields
            expected_amount = 99.00
            actual_amount = payment_data.get("transaction_amount", 0)
            
            print(f"[SECURITY] Expected amount: {expected_amount}, Actual amount: {actual_amount}")
            
            if abs(actual_amount - expected_amount) > 0.01:  # Allow for minor float differences
                print(f"[SECURITY] Amount mismatch! Expected: {expected_amount}, Got: {actual_amount}. Access DENIED.")
                return {
                    "success": False, 
                    "message": f"Valor do pagamento incorreto. Esperado: R$ {expected_amount:.2f}, Recebido: R$ {actual_amount:.2f}",
                    "status": "invalid_amount"
                }
            
            # Update payment status in our database
            await db.payments.update_one(
                {"payment_id": payment["payment_id"]},
                {
                    "$set": {
                        "payment_status": mp_status,
                        "approved_at": datetime.now(timezone.utc).isoformat(),
                        "verified_manually": True,
                        "verification_timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Activate subscription ONLY if all security checks passed
            print(f"[SECURITY] All security checks passed. Activating subscription: {payment['subscription_id']}")
            
            result = await db.subscriptions.update_one(
                {"id": payment["subscription_id"]},
                {
                    "$set": {
                        "payment_status": "active",
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        "reminder_sent": False,
                        "activated_manually": True,
                        "activation_timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            print(f"[SECURITY] Subscription activation result: {result.modified_count} documents updated")
            
            if result.modified_count > 0:
                print(f"[SECURITY] SUCCESS: Provider {provider_id} access granted after payment verification")
                return {"success": True, "message": "Pagamento verificado e aprovado! Acesso liberado.", "status": "approved"}
            else:
                print(f"[SECURITY] FAILED: Could not activate subscription for provider {provider_id}")
                return {"success": False, "message": "Erro ao ativar assinatura"}
            
        else:
            print(f"[SECURITY] Failed to get payment from Mercado Pago. Status: {payment_response['status']}")
            return {"success": False, "message": "Erro ao consultar status no Mercado Pago"}
            
    except Exception as e:
        print(f"[SECURITY ERROR] Manual check failed for provider {provider_id}: {str(e)}")
        import traceback
        print(f"[SECURITY ERROR] Traceback: {traceback.format_exc()}")
        return {"success": False, "message": "Erro ao verificar pagamento"}


@api_router.get("/payment/debug-info")
async def get_debug_info(current_user=Depends(get_current_provider)):
    """Get debug info for payment troubleshooting"""
    
    provider_id = current_user["user_id"]
    
    try:
        # Get recent payments and subscriptions
        payments = await db.payments.find({"provider_id": provider_id}).to_list(length=10)
        subscriptions = await db.subscriptions.find({"provider_id": provider_id}).to_list(length=10)
        
        return {
            "provider_id": provider_id,
            "payments_count": len(payments),
            "subscriptions_count": len(subscriptions),
            "recent_payments": payments[-3:] if payments else [],
            "recent_subscriptions": subscriptions[-3:] if subscriptions else [],
            "webhook_url": "https://www.controleisp.com.br/api/payment/webhook"
        }
        
    except Exception as e:
        return {"error": str(e)}


# Create master admin if not exists
@app.on_event("startup")
async def create_master_admin():
    existing_admin = await db.admins.find_one({"username": "master"})
    if not existing_admin:
        master_admin = Admin(
            username="master",
            password_hash=hash_password("master123")
        )
        admin_dict = master_admin.dict()
        admin_dict["created_at"] = admin_dict["created_at"].isoformat()
        await db.admins.insert_one(admin_dict)
        print("Master admin created: username=master, password=master123")
    
    # Start the scheduler for auto-sync
    print("\n" + "="*80)
    print("🚀 INICIANDO SCHEDULER DE SINCRONIZAÇÃO AUTOMÁTICA")
    print("="*80)
    print("⏰ O scheduler verificará a cada 1 minuto se há sincronizações agendadas")
    print("📋 Integrações com auto-sync ativo serão sincronizadas no horário configurado")
    print("="*80 + "\n")
    
    # Add job to run every minute
    scheduler.add_job(
        run_scheduled_auto_sync,
        CronTrigger(minute='*'),  # Run every minute
        id='auto_sync_job',
        name='Auto Sync Integrations',
        replace_existing=True
    )
    
    scheduler.start()
    print("✅ Scheduler iniciado com sucesso!\n")


# Visitor tracking endpoints (public)
@api_router.post("/public/visit")
async def register_visit(request: Request):
    """Register a new visit to the website"""
    try:
        # Get client IP and user agent
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Create unique identifier for visitor (IP + User Agent hash)
        visitor_hash = hashlib.sha256(f"{client_ip}:{user_agent}".encode()).hexdigest()[:16]
        
        current_time = datetime.now(timezone.utc)
        
        # Check if visitor already exists
        existing_visitor = await db.visitors.find_one({"id": visitor_hash})
        
        if existing_visitor:
            # Update existing visitor
            await db.visitors.update_one(
                {"id": visitor_hash},
                {
                    "$set": {
                        "last_visit": current_time
                    },
                    "$inc": {
                        "visit_count": 1
                    }
                }
            )
        else:
            # Create new visitor
            new_visitor = {
                "id": visitor_hash,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "first_visit": current_time,
                "last_visit": current_time,
                "visit_count": 1
            }
            await db.visitors.insert_one(new_visitor)
        
        return {"success": True, "visitor_id": visitor_hash}
        
    except Exception as e:
        print(f"Erro ao registrar visita: {e}")
        # Don't fail the request if visitor tracking fails
        return {"success": False, "error": str(e)}


@api_router.get("/public/visitor-count", response_model=VisitorStats)
async def get_visitor_stats():
    """Get visitor statistics for the website"""
    try:
        # Total unique visitors
        total_visitors = await db.visitors.count_documents({})
        
        # Total visits (sum of visit_count for all visitors)
        pipeline_total_visits = [
            {"$group": {"_id": None, "total": {"$sum": "$visit_count"}}}
        ]
        total_visits_result = await db.visitors.aggregate(pipeline_total_visits).to_list(length=1)
        total_visits = total_visits_result[0]["total"] if total_visits_result else 0
        
        # Today's visitors (based on last_visit)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_visitors = await db.visitors.count_documents({
            "last_visit": {"$gte": today_start}
        })
        
        # This month's visitors
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_visitors = await db.visitors.count_documents({
            "last_visit": {"$gte": month_start}
        })
        
        return VisitorStats(
            total_visitors=total_visitors,
            total_visits=total_visits,
            today_visitors=today_visitors,
            this_month_visitors=month_visitors
        )
        
    except Exception as e:
        print(f"Erro ao obter estatísticas de visitantes: {e}")
        # Return default stats if there's an error
        return VisitorStats(
            total_visitors=0,
            total_visits=0,
            today_visitors=0,
            this_month_visitors=0
        )


# System Settings Endpoints (Admin Only)
@api_router.get("/admin/system/settings")
async def get_system_settings(current_user=Depends(get_current_admin)):
    """Get current system settings"""
    try:
        settings = await db.system_settings.find_one({})
        
        if not settings:
            # Create default settings - sistema gratuito
            default_settings = {
                "id": str(uuid.uuid4()),
                "payment_required": False,
                "payment_disabled_at": datetime.now(timezone.utc),
                "updated_by": current_user.get("email", "admin"),
                "created_at": datetime.now(timezone.utc)
            }
            await db.system_settings.insert_one(default_settings)
            settings = default_settings
        
        # Convert datetime objects to strings for JSON response
        if settings.get("payment_enabled_at"):
            settings["payment_enabled_at"] = settings["payment_enabled_at"].isoformat() if isinstance(settings["payment_enabled_at"], datetime) else settings["payment_enabled_at"]
        if settings.get("payment_disabled_at"):  
            settings["payment_disabled_at"] = settings["payment_disabled_at"].isoformat() if isinstance(settings["payment_disabled_at"], datetime) else settings["payment_disabled_at"]
        if settings.get("created_at"):
            settings["created_at"] = settings["created_at"].isoformat() if isinstance(settings["created_at"], datetime) else settings["created_at"]
            
        return settings
        
    except Exception as e:
        print(f"Erro ao obter configurações do sistema: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter configurações: {str(e)}")


@api_router.post("/admin/system/toggle-payment")
async def toggle_payment_system(current_user=Depends(get_current_admin)):
    """Toggle payment system on/off"""
    try:
        settings = await db.system_settings.find_one({})
        current_payment_required = settings.get("payment_required", False) if settings else False
        
        new_payment_required = not current_payment_required
        current_time = datetime.now(timezone.utc)
        
        update_data = {
            "payment_required": new_payment_required,
            "updated_by": current_user.get("email", "admin")
        }
        
        if new_payment_required:
            update_data["payment_enabled_at"] = current_time
        else:
            update_data["payment_disabled_at"] = current_time
            
        if settings:
            # Update existing settings
            await db.system_settings.update_one(
                {"id": settings["id"]},
                {"$set": update_data}
            )
        else:
            # Create new settings
            update_data.update({
                "id": str(uuid.uuid4()),
                "created_at": current_time
            })
            await db.system_settings.insert_one(update_data)
        
        status_text = "ATIVADO" if new_payment_required else "DESATIVADO"
        
        return {
            "success": True,
            "message": f"Sistema de pagamentos {status_text} com sucesso",
            "payment_required": new_payment_required,
            "changed_at": current_time.isoformat(),
            "changed_by": current_user.get("email", "admin")
        }
        
    except Exception as e:
        print(f"Erro ao alterar sistema de pagamento: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao alterar sistema de pagamento: {str(e)}")


# Integration Management Endpoints

@api_router.get("/provider/integrations/types")
async def get_available_integration_types(current_user=Depends(get_current_provider)):
    """Get list of available integration types"""
    try:
        # Retorna os 4 sistemas ERP suportados
        integration_types = [
            {
                "id": "ixc",
                "name": "IXC Provedor",
                "display_name": "IXC Provedor",
                "description": "Integração com sistema IXC Provedor para importação automática de clientes inadimplentes",
                "logo_url": None,
                "is_active": True,
                "required_fields": ["api_url", "token"],
                "optional_fields": ["username", "password", "debt_days_threshold", "debt_amount_min"],
                "help_text": "URL da API geralmente é: https://seudominio.com/webservice/v1 - Token é gerado no painel IXC (formato: ID:HASH). Username/senha são opcionais caso precise."
            },
            {
                "id": "mk-auth",
                "name": "MK-Auth",
                "display_name": "MK-Auth",
                "description": "Integração com sistema MK-Auth para gestão de clientes em débito",
                "logo_url": None,
                "is_active": True,
                "required_fields": ["api_url", "api_token"],
                "optional_fields": ["debt_days_threshold", "debt_amount_min"],
                "help_text": "Insira a URL da API do seu MK-Auth e o token de autenticação"
            },
            {
                "id": "sgp",
                "name": "SGP",
                "display_name": "SGP",
                "description": "Integração com sistema SGP para importação de clientes inadimplentes",
                "logo_url": None,
                "is_active": True,
                "required_fields": ["api_url", "api_key", "api_secret"],
                "optional_fields": ["debt_days_threshold", "debt_amount_min"],
                "help_text": "Configure a URL da API e as credenciais de acesso do SGP"
            },
            {
                "id": "radiusnet",
                "name": "RadiusNet",
                "display_name": "RadiusNet",
                "description": "Integração com sistema RadiusNet para sincronização de clientes em débito",
                "logo_url": None,
                "is_active": True,
                "required_fields": ["api_url", "username", "password"],
                "optional_fields": ["debt_days_threshold", "debt_amount_min"],
                "help_text": "Insira a URL da API RadiusNet e suas credenciais de administrador"
            }
        ]
        
        return {"integration_types": integration_types}
        
    except Exception as e:
        print(f"Erro ao obter tipos de integração: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter tipos de integração: {str(e)}")


@api_router.get("/provider/integrations")
async def get_provider_integrations(current_user=Depends(get_current_provider)):
    """Get all integrations for current provider"""
    try:
        provider_id = current_user["user_id"]
        
        integrations = await db.provider_integrations.find({
            "provider_id": provider_id
        }).to_list(length=None)
        
        # Process integrations for safe serialization
        processed_integrations = []
        for integration in integrations:
            # Remove MongoDB ObjectId
            if "_id" in integration:
                del integration["_id"]
            
            # Convert datetime objects to ISO strings
            if "created_at" in integration and hasattr(integration["created_at"], "isoformat"):
                integration["created_at"] = integration["created_at"].isoformat()
            if "updated_at" in integration and hasattr(integration["updated_at"], "isoformat"):
                integration["updated_at"] = integration["updated_at"].isoformat()
            if "last_sync" in integration and integration["last_sync"] and hasattr(integration["last_sync"], "isoformat"):
                integration["last_sync"] = integration["last_sync"].isoformat()
            
            # Remove sensitive credential data from response
            if "credentials" in integration:
                # Only show field names, not values
                integration["credentials"] = list(integration["credentials"].keys())
            
            processed_integrations.append(integration)
        
        return {"integrations": processed_integrations}
        
    except Exception as e:
        print(f"Erro ao obter integrações do provedor: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter integrações: {str(e)}")


@api_router.post("/provider/integrations")
async def create_provider_integration(
    integration_data: dict,
    current_user=Depends(get_current_provider)
):
    """Create new integration for provider"""
    try:
        provider_id = current_user["user_id"]
        
        # Validate required fields
        required_fields = ["integration_type", "display_name", "api_url", "credentials"]
        for field in required_fields:
            if field not in integration_data:
                raise HTTPException(status_code=400, detail=f"Campo obrigatório: {field}")
        
        # Check if provider already has this integration type
        existing = await db.provider_integrations.find_one({
            "provider_id": provider_id,
            "integration_type": integration_data["integration_type"]
        })
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Já existe uma integração {integration_data['integration_type']} configurada"
            )
        
        # Create integration record
        current_time = datetime.now(timezone.utc)
        new_integration = {
            "id": str(uuid.uuid4()),
            "provider_id": provider_id,
            "integration_type": integration_data["integration_type"],
            "display_name": integration_data["display_name"],
            "api_url": integration_data["api_url"],
            "credentials": integration_data["credentials"],  # TODO: Encrypt this
            "settings": integration_data.get("settings", {}),
            "is_active": True,
            "min_days_overdue": integration_data.get("min_days_overdue", 60),  # Dias de atraso mínimo (padrão: 60)
            "auto_sync_enabled": integration_data.get("auto_sync_enabled", False),
            "auto_sync_time": integration_data.get("auto_sync_time", "05:00"),  # Padrão 5h da manhã
            "last_sync": None,
            "last_sync_status": "never",
            "last_sync_message": None,
            "sync_count": 0,
            "error_count": 0,
            "created_at": current_time.isoformat(),
            "updated_at": current_time.isoformat()
        }
        
        await db.provider_integrations.insert_one(new_integration)
        
        return {
            "success": True,
            "message": f"Integração {integration_data['integration_type']} configurada com sucesso",
            "integration_id": new_integration["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao criar integração: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar integração: {str(e)}")


@api_router.post("/provider/integrations/{integration_id}/test")
async def test_integration_connection(
    integration_id: str,
    current_user=Depends(get_current_provider)
):
    """Test connection to integration API"""
    try:
        provider_id = current_user["user_id"]
        
        integration = await db.provider_integrations.find_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        if not integration:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        # Test based on integration type
        if integration["integration_type"] == "ixc":
            success, message = await test_ixc_connection(integration)
        elif integration["integration_type"] == "mk-auth":
            success, message = await test_mkauth_connection(integration)
        elif integration["integration_type"] == "sgp":
            success, message = await test_sgp_connection(integration)
        elif integration["integration_type"] == "radiusnet":
            success, message = await test_radiusnet_connection(integration)
        else:
            success, message = False, "Tipo de integração não suportado"
        
        # Update integration status
        current_time = datetime.now(timezone.utc)
        await db.provider_integrations.update_one(
            {"id": integration_id},
            {
                "$set": {
                    "last_sync": current_time.isoformat(),
                    "last_sync_status": "success" if success else "error",
                    "last_sync_message": message,
                    "updated_at": current_time.isoformat()
                }
            }
        )
        
        return {
            "success": success,
            "message": message,
            "tested_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao testar integração: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao testar integração: {str(e)}")


@api_router.post("/provider/integrations/{integration_id}/sync")
async def sync_integration_data(
    integration_id: str,
    current_user=Depends(get_current_provider)
):
    """Manually trigger data synchronization"""
    try:
        provider_id = current_user["user_id"]
        
        integration = await db.provider_integrations.find_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        if not integration:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        if not integration.get("is_active"):
            raise HTTPException(status_code=400, detail="Integração está desativada")
        
        # Mark sync as in progress
        await db.provider_integrations.update_one(
            {"id": integration_id},
            {
                "$set": {
                    "last_sync_status": "in_progress",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Sync based on integration type
        if integration["integration_type"] == "ixc":
            result = await sync_ixc_data(integration, provider_id)
        elif integration["integration_type"] == "mk-auth":
            result = await sync_mkauth_data(integration, provider_id)
        elif integration["integration_type"] == "sgp":
            result = await sync_sgp_data(integration, provider_id)
        elif integration["integration_type"] == "radiusnet":
            result = await sync_radiusnet_data(integration, provider_id)
        else:
            result = {
                "status": "error",
                "message": "Tipo de integração não suportado",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        # Update integration status
        current_time = datetime.now(timezone.utc)
        await db.provider_integrations.update_one(
            {"id": integration_id},
            {
                "$set": {
                    "last_sync": current_time.isoformat(),
                    "last_sync_status": result["status"],
                    "last_sync_message": result.get("message", ""),
                    "sync_count": integration.get("sync_count", 0) + 1,
                    "updated_at": current_time.isoformat()
                }
            }
        )
        
        return {
            "success": result["status"] == "success",
            "message": result.get("message", ""),
            "clients_synced": result.get("clients_synced", 0),
            "clients_failed": result.get("clients_failed", 0),
            "synced_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao sincronizar dados: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao sincronizar dados: {str(e)}")


# Cleanup endpoint removido - reconciliação agora é automática na sincronização

# @api_router.post("/provider/integrations/{integration_id}/cleanup")
async def cleanup_clients_without_debts(
    integration_id: str,
    current_user=Depends(get_current_provider)
):
    """Remove clientes que NÃO têm mais débitos no ERP"""
    try:
        provider_id = current_user["user_id"]
        
        # Find integration
        integration = await db.provider_integrations.find_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        if not integration:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        if not integration.get("is_active"):
            raise HTTPException(status_code=400, detail="Integração está desativada")
        
        integration_type = integration["integration_type"]
        
        print(f"=== CLEANUP INICIADO: Removendo clientes sem débitos do {integration_type.upper()}")
        
        # Step 1: Get list of CPFs with active debts from ERP
        cpfs_com_debito = set()
        
        if integration_type == "ixc":
            # Buscar clientes com débitos no IXC
            import requests
            import base64
            from datetime import date, timedelta
            
            api_url = integration["api_url"]
            token = integration["credentials"]["token"]
            
            # Encode token em Base64 para Basic Auth
            token_base64 = base64.b64encode(token.encode()).decode()
            
            # CLEANUP: Buscar TODOS os títulos vencidos (não apenas >60 dias)
            # Diferente da sincronização, o cleanup precisa ver TODOS os débitos
            # para não remover clientes que têm débitos entre 1-60 dias
            financeiro_url = f"{api_url}/fn_areceber"
            data_hoje = date.today().isoformat()
            
            financeiro_payload = {
                "qtype": "fn_areceber.data_vencimento",
                "query": data_hoje,
                "oper": "<",  # Menor que hoje = qualquer débito vencido
                "page": "1",
                "rp": "5000",
                "sortname": "fn_areceber.data_vencimento",
                "sortorder": "asc"
            }
            
            print(f"=== CLEANUP: Buscando TODOS os títulos vencidos (não apenas >60 dias) para evitar remoção incorreta")
            
            headers = {
                "ixcsoft": "listar",  # Header recomendado pelo IXC
                "Content-Type": "application/json",
                "Authorization": f"Basic {token_base64}"
            }
            
            try:
                financeiro_response = requests.post(
                    financeiro_url,
                    headers=headers,
                    json=financeiro_payload,
                    timeout=30,
                    verify=False
                )
                
                if financeiro_response.status_code == 200:
                    financeiro_json = financeiro_response.json()
                    titulos = financeiro_json.get('registros', [])
                    
                    print(f"=== CLEANUP: {len(titulos)} títulos vencidos encontrados no IXC (TODOS os vencimentos)")
                    
                    # Agrupar por cliente e filtrar por status "A"
                    clientes_com_debito_ixc = {}
                    for titulo in titulos:
                        status = titulo.get('status', 'A')
                        if status not in ['A', 'a']:
                            continue
                        
                        cliente_id = titulo.get('cliente_id') or titulo.get('id_cliente')
                        valor_aberto = float(titulo.get('valor_aberto', 0) or titulo.get('valor', 0))
                        
                        if cliente_id and valor_aberto > 0:
                            if cliente_id not in clientes_com_debito_ixc:
                                clientes_com_debito_ixc[cliente_id] = True
                    
                    print(f"=== CLEANUP: {len(clientes_com_debito_ixc)} clientes únicos com débitos no IXC")
                    
                    # Buscar dados completos dos clientes com débito
                    cliente_url = f"{api_url}/cliente"
                    for cliente_id in clientes_com_debito_ixc.keys():
                        try:
                            cliente_payload = {
                                "qtype": "cliente.id",
                                "query": str(cliente_id),
                                "oper": "=",
                                "page": "1",
                                "rp": "1"
                            }
                            
                            cliente_response = requests.post(
                                cliente_url,
                                headers=headers,
                                json=cliente_payload,
                                timeout=10,
                                verify=False
                            )
                            
                            if cliente_response.status_code == 200:
                                cliente_json = cliente_response.json()
                                clientes = cliente_json.get('registros', [])
                                
                                if clientes:
                                    cliente = clientes[0]
                                    cpf = cliente.get('cnpj_cpf', '')
                                    if cpf:
                                        # Limpa CPF
                                        cpf_limpo = ''.join(filter(str.isdigit, cpf))
                                        if cpf_limpo:
                                            cpfs_com_debito.add(cpf_limpo)
                        except:
                            continue
                    
                    print(f"=== CLEANUP: {len(cpfs_com_debito)} CPFs com débitos confirmados")
                    
                    # VALIDAÇÃO DE SEGURANÇA: Se não encontrou nenhum CPF com débito, pode ser um problema
                    # Retorna aviso ao invés de remover todos os clientes
                    if len(titulos) == 0 and len(cpfs_com_debito) == 0:
                        return {
                            "success": True,
                            "message": "⚠️ Nenhum título vencido encontrado no IXC. Nenhum cliente foi removido por segurança.",
                            "clients_removed": 0,
                            "removed_clients": []
                        }
                    
                else:
                    raise HTTPException(status_code=500, detail=f"Erro ao consultar IXC: {financeiro_response.status_code}")
                    
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao consultar IXC: {str(e)}")
        
        elif integration_type in ["mk-auth", "sgp", "radiusnet"]:
            raise HTTPException(status_code=501, detail=f"Cleanup não implementado para {integration_type}")
        
        # Step 2: Find all clients imported from this ERP
        clientes_importados = await db.clients.find({
            "provider_id": provider_id,
            "is_active": True,
            "$or": [
                {"reason": {"$regex": f"Importado do {integration_type.upper()}", "$options": "i"}},
                {"inclusion_reason": {"$regex": f"Importado do {integration_type.upper()}", "$options": "i"}},
                {"observations": {"$regex": f"Importado do {integration_type.upper()}", "$options": "i"}}
            ]
        }).to_list(length=None)
        
        print(f"=== CLEANUP: {len(clientes_importados)} clientes importados encontrados no banco")
        
        # Step 3: Remove clients that don't have debts in ERP
        clientes_removidos = 0
        clientes_removidos_lista = []
        
        print(f"=== CLEANUP DEBUG: CPFs com débito no IXC: {cpfs_com_debito}")
        
        for cliente in clientes_importados:
            cpf_db = cliente.get('cpf', '')
            cpf_db_limpo = ''.join(filter(str.isdigit, cpf_db))
            
            print(f"=== CLEANUP DEBUG: Verificando cliente {cliente.get('name')} (CPF: {cpf_db_limpo}) - Está na lista? {cpf_db_limpo in cpfs_com_debito}")
            
            # Se o CPF NÃO está na lista de CPFs com débito, remove
            if cpf_db_limpo and cpf_db_limpo not in cpfs_com_debito:
                print(f"=== CLEANUP: Removendo {cliente.get('name')} (CPF: {cpf_db}) - sem débitos no {integration_type.upper()}")
                
                await db.clients.update_one(
                    {"id": cliente["id"]},
                    {
                        "$set": {
                            "is_active": False,
                            "deleted_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                clientes_removidos += 1
                clientes_removidos_lista.append({
                    "name": cliente.get('name'),
                    "cpf": cpf_db
                })
        
        print(f"=== CLEANUP CONCLUÍDO: {clientes_removidos} clientes removidos")
        
        return {
            "success": True,
            "message": f"Limpeza concluída: {clientes_removidos} cliente(s) removido(s) por não terem mais débitos",
            "clients_removed": clientes_removidos,
            "removed_clients": clientes_removidos_lista[:10]  # Retorna até 10 nomes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao executar cleanup: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao executar limpeza: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao sincronizar dados: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao sincronizar dados: {str(e)}")


@api_router.delete("/provider/integrations/{integration_id}")
async def delete_integration(
    integration_id: str,
    current_user=Depends(get_current_provider)
):
    """Delete an integration"""
    try:
        provider_id = current_user["user_id"]
        
        # Find integration
        integration = await db.provider_integrations.find_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        if not integration:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        # Delete integration
        await db.provider_integrations.delete_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        return {
            "success": True,
            "message": f"Integração {integration['integration_type'].upper()} removida com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao deletar integração: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao deletar integração: {str(e)}")


@api_router.patch("/provider/integrations/{integration_id}/auto-sync")
async def update_auto_sync_settings(
    integration_id: str,
    settings: dict,
    current_user=Depends(get_current_provider)
):
    """Update auto-sync settings for an integration"""
    try:
        provider_id = current_user["user_id"]
        
        # Find integration
        integration = await db.provider_integrations.find_one({
            "id": integration_id,
            "provider_id": provider_id
        })
        
        if not integration:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        # Update settings
        update_data = {
            "auto_sync_enabled": settings.get("auto_sync_enabled", False),
            "auto_sync_time": settings.get("auto_sync_time", "05:00"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update min_days_overdue if provided
        if "min_days_overdue" in settings:
            min_days = int(settings.get("min_days_overdue", 60))
            if min_days < 0:
                raise HTTPException(status_code=400, detail="Dias de atraso mínimo não pode ser negativo")
            update_data["min_days_overdue"] = min_days
        
        await db.provider_integrations.update_one(
            {"id": integration_id, "provider_id": provider_id},
            {"$set": update_data}
        )
        
        result = {
            "success": True,
            "message": "Configurações atualizadas com sucesso",
            "auto_sync_enabled": update_data["auto_sync_enabled"],
            "auto_sync_time": update_data["auto_sync_time"]
        }
        
        if "min_days_overdue" in update_data:
            result["min_days_overdue"] = update_data["min_days_overdue"]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar configurações de auto-sync: {e}")

@api_router.post("/admin/integrations/run-auto-sync")
async def run_auto_sync_all(current_user=Depends(get_current_admin)):
    """Run auto-sync for all enabled integrations (called by cron job)"""
    try:
        from datetime import datetime, time as dt_time
        
        # Get current time (hour:minute)
        now = datetime.now()
        current_time_str = now.strftime("%H:%M")
        
        print(f"=== CRON JOB AUTO-SYNC EXECUTANDO às {current_time_str} ===")
        
        # Find all integrations with auto_sync_enabled = True
        integrations = await db.provider_integrations.find({
            "auto_sync_enabled": True,
            "is_active": True
        }).to_list(length=None)
        
        print(f"=== Encontradas {len(integrations)} integrações com auto-sync ativo ===")
        
        results = []
        
        for integration in integrations:
            # Check if it's time to sync (compare time only)
            auto_sync_time = integration.get("auto_sync_time", "05:00")
            
            # Allow a 5-minute window for sync
            hour, minute = map(int, auto_sync_time.split(":"))
            sync_time = dt_time(hour, minute)
            current_time = dt_time(now.hour, now.minute)
            
            # Calculate difference in minutes
            sync_minutes = sync_time.hour * 60 + sync_time.minute
            current_minutes = current_time.hour * 60 + current_time.minute
            diff_minutes = abs(sync_minutes - current_minutes)
            
            if diff_minutes <= 5:  # Within 5-minute window
                print(f"=== Sincronizando integração {integration['integration_type']} do provider {integration['provider_id']} ===")
                
                try:
                    # Run sync based on integration type
                    integration_type = integration["integration_type"]
                    provider_id = integration["provider_id"]
                    
                    if integration_type == "ixc":
                        sync_result = await sync_ixc_data(integration, provider_id)
                    elif integration_type == "mk-auth":
                        sync_result = await sync_mkauth_data(integration, provider_id)
                    elif integration_type == "sgp":
                        sync_result = await sync_sgp_data(integration, provider_id)
                    elif integration_type == "radiusnet":
                        sync_result = await sync_radiusnet_data(integration, provider_id)
                    else:
                        sync_result = {"status": "error", "message": f"Tipo de integração não suportado: {integration_type}"}
                    
                    # Update last_sync
                    await db.provider_integrations.update_one(
                        {"id": integration["id"]},
                        {
                            "$set": {
                                "last_sync": datetime.now(timezone.utc).isoformat(),
                                "last_sync_status": sync_result.get("status", "error"),
                                "last_sync_message": sync_result.get("message", ""),
                                "sync_count": integration.get("sync_count", 0) + 1
                            }
                        }
                    )
                    
                    results.append({
                        "integration_id": integration["id"],
                        "integration_type": integration_type,
                        "provider_id": provider_id,
                        "status": sync_result.get("status"),
                        "message": sync_result.get("message"),
                        "clients_synced": sync_result.get("clients_synced", 0)
                    })
                    
                    print(f"=== Sync concluído: {sync_result.get('message')} ===")
                    
                except Exception as e:
                    print(f"=== ERRO ao sincronizar integração {integration['id']}: {e} ===")
                    results.append({
                        "integration_id": integration["id"],
                        "integration_type": integration.get("integration_type"),
                        "provider_id": integration.get("provider_id"),
                        "status": "error",
                        "message": str(e),
                        "clients_synced": 0
                    })
        
        return {
            "success": True,
            "message": f"Auto-sync executado para {len(results)} integrações",
            "total_integrations": len(integrations),
            "synced_count": len(results),
            "results": results
        }
        
    except Exception as e:
        print(f"Erro ao executar auto-sync: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao executar auto-sync: {str(e)}")


        raise HTTPException(status_code=500, detail=f"Erro ao atualizar configurações: {str(e)}")



async def test_ixc_connection(integration: dict) -> tuple[bool, str]:
    """Test connection to IXC API"""
    try:
        import requests
        import base64
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        token = credentials.get("token")
        
        # Token formato: ID:HASH (ex: 16:8d3e2a7db89f...)
        if ':' not in token:
            return False, "❌ Token inválido. Formato esperado: ID:HASH (ex: 16:8d3e2a7db...)"
        
        # Codifica token em Base64 para Basic Auth
        token_base64 = base64.b64encode(token.encode()).decode()
        
        # IXC API usa GET com data + Basic Auth + header ixcsoft
        test_url = f"{api_url}/cliente"
        
        headers = {
            "ixcsoft": "listar",
            "Content-Type": "application/json",
            "Authorization": f"Basic {token_base64}"
        }
        
        # Payload mínimo para teste
        payload = {
            "qtype": "cliente.id",
            "query": "1",
            "oper": ">=",
            "page": "1",
            "rp": "1",
            "sortname": "cliente.id",
            "sortorder": "desc"
        }
        
        # GET com data (formato usado pelo IXC)
        response = requests.get(
            test_url,
            headers=headers,
            json=payload,
            timeout=10,
            verify=False
        )
        
        if response.status_code == 200:
            try:
                result = response.json()
                if isinstance(result, dict):
                    if result.get("type") == "error":
                        return False, f"❌ Erro IXC: {result.get('mensagem', 'Token inválido')}"
                    if result.get("total") is not None or result.get("registros") is not None:
                        return True, "✅ Conexão com IXC estabelecida com sucesso"
                return True, "✅ Conexão com IXC estabelecida"
            except Exception:
                return True, "✅ Conexão com IXC estabelecida"
        elif response.status_code == 401:
            # Verifica se o token está correto
            return False, "❌ Erro 401: Token inválido. Verifique se o token está correto e ativo no painel IXC. Contate o suporte do IXC se necessário."
        elif response.status_code == 403:
            return False, "❌ Acesso negado. Verifique permissões"
        else:
            return False, f"❌ Erro HTTP {response.status_code}"
            
    except ValueError:
        return False, "❌ Token mal formatado. Formato esperado: ID:HASH"
    except requests.exceptions.SSLError:
        return False, "❌ Erro de SSL"
    except requests.exceptions.Timeout:
        return False, "❌ Timeout (10s)"
    except requests.exceptions.ConnectionError:
        return False, "❌ Erro de conexão"
    except Exception as e:
        return False, f"❌ Erro: {str(e)}"


async def test_mkauth_connection(integration: dict) -> tuple[bool, str]:
    """Test connection to MK-Auth API"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        api_token = credentials.get("api_token")
        
        # Try to connect to MK-Auth API
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Test endpoint - adjust based on MK-Auth documentation
        test_url = f"{api_url}/api/v1/health"
        response = requests.get(test_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return True, "✅ Conexão com MK-Auth estabelecida com sucesso"
        elif response.status_code == 401:
            return False, "❌ Token de autenticação inválido"
        else:
            return False, f"❌ Erro HTTP {response.status_code}"
            
    except requests.exceptions.Timeout:
        return False, "❌ Timeout na conexão com MK-Auth. Verifique a URL"
    except requests.exceptions.ConnectionError:
        return False, "❌ Erro de conexão. Verifique a URL da API"
    except Exception as e:
        return False, f"❌ Erro inesperado: {str(e)}"


async def test_sgp_connection(integration: dict) -> tuple[bool, str]:
    """Test connection to SGP API"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        api_key = credentials.get("api_key")
        api_secret = credentials.get("api_secret")
        
        # Try to authenticate with SGP
        headers = {
            "X-API-Key": api_key,
            "X-API-Secret": api_secret,
            "Content-Type": "application/json"
        }
        
        # Test endpoint - adjust based on SGP documentation
        test_url = f"{api_url}/api/auth/validate"
        response = requests.get(test_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return True, "✅ Conexão com SGP estabelecida com sucesso"
        elif response.status_code == 401 or response.status_code == 403:
            return False, "❌ Credenciais inválidas (API Key ou Secret incorretos)"
        else:
            return False, f"❌ Erro HTTP {response.status_code}"
            
    except requests.exceptions.Timeout:
        return False, "❌ Timeout na conexão com SGP. Verifique a URL"
    except requests.exceptions.ConnectionError:
        return False, "❌ Erro de conexão. Verifique a URL da API"
    except Exception as e:
        return False, f"❌ Erro inesperado: {str(e)}"


async def test_radiusnet_connection(integration: dict) -> tuple[bool, str]:
    """Test connection to RadiusNet API"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        username = credentials.get("username")
        password = credentials.get("password")
        
        # Try to authenticate with RadiusNet
        auth_url = f"{api_url}/api/login"
        auth_data = {
            "username": username,
            "password": password
        }
        
        response = requests.post(auth_url, json=auth_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success') or result.get('token'):
                return True, "✅ Conexão com RadiusNet estabelecida com sucesso"
            else:
                return False, "❌ Falha na autenticação"
        elif response.status_code == 401:
            return False, "❌ Credenciais inválidas"
        else:
            return False, f"❌ Erro HTTP {response.status_code}"
            
    except requests.exceptions.Timeout:
        return False, "❌ Timeout na conexão com RadiusNet. Verifique a URL"
    except requests.exceptions.ConnectionError:
        return False, "❌ Erro de conexão. Verifique a URL da API"
    except Exception as e:
        return False, f"❌ Erro inesperado: {str(e)}"


async def sync_ixc_data(integration: dict, provider_id: str) -> dict:
    """Sync client data from IXC"""
    try:
        import requests
        import base64
        import json
        
        # LOG COMPLETO
        print("=" * 80)
        print("DEBUG sync_ixc_data - INÍCIO")
        print(f"Integration completo: {json.dumps(integration, default=str, indent=2)}")
        print(f"Provider ID: {provider_id}")
        
        credentials = integration.get("credentials", {})
        print(f"Credentials: {credentials}")
        print(f"Tipo credentials: {type(credentials)}")
        
        api_url = integration.get("api_url", "").rstrip('/')
        print(f"API URL: {api_url}")
        
        token = credentials.get("token", "")
        print(f"Token bruto: '{token}'")
        print(f"Tipo token: {type(token)}")
        print(f"Comprimento token: {len(str(token))}")
        
        # Converte token para string se necessário
        if token:
            token = str(token).strip()
            print(f"Token após conversão: '{token}'")
            print(f"Tem ':' ? {':' in token}")
        
        # Verifica formato do token
        if not token or ':' not in token:
            print("ERRO: Token mal formatado!")
            print("=" * 80)
            return {
                "status": "error",
                "message": f"Token mal formatado. Token recebido: '{token}' (tipo: {type(token)})",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        # Codifica token em Base64
        token_base64 = base64.b64encode(token.encode()).decode()
        
        headers = {
            "ixcsoft": "listar",
            "Content-Type": "application/json",
            "Authorization": f"Basic {token_base64}"
        }
        
        # PASSO 1: Busca títulos VENCIDOS HÁ MAIS DE 60 DIAS (data_vencimento < hoje - 60 dias)
        from datetime import date, timedelta
        
        financeiro_url = f"{api_url}/fn_areceber"
        
        # Data limite: hoje - 60 dias
        # Busca apenas títulos com MAIS DE 60 DIAS de atraso
        data_limite = (date.today() - timedelta(days=60)).isoformat()
        
        # Buscar apenas títulos com status "A" (Aberto/Em vermelho)
        # e que estejam vencidos há MAIS DE 60 DIAS
        # IMPORTANTE: grid_param filtra títulos ATIVOS (status='A') E LIBERADOS (liberado='S')
        # Isso evita importar títulos pagos, cancelados ou não liberados pelo IXC
        financeiro_payload = {
            "qtype": "fn_areceber.data_vencimento",
            "query": data_limite,
            "oper": "<",  # Menor que (hoje - 60 dias) = mais de 60 dias de atraso
            "page": "1",
            "rp": "5000",  # Aumentado para pegar mais títulos
            "sortname": "fn_areceber.data_vencimento",
            "sortorder": "asc",  # Mais antigos primeiro
            "grid_param": '[{"TB":"fn_areceber.status", "OP" : "=", "P" : "A"},{"TB":"fn_areceber.liberado", "OP" : "=", "P" : "S"}]'  # Apenas títulos ativos E liberados
        }
        
        print(f"=== Buscando títulos ATIVOS (status='A'), LIBERADOS (liberado='S') E VENCIDOS HÁ MAIS DE 60 DIAS (data_vencimento < {data_limite})")
        
        financeiro_response = requests.post(
            financeiro_url,
            headers=headers,
            json=financeiro_payload,
            timeout=30,
            verify=False
        )
        
        if financeiro_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Erro ao buscar financeiro: HTTP {financeiro_response.status_code}",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        financeiro_json = financeiro_response.json()
        titulos = financeiro_json.get('registros', [])
        
        print(f"=== Total de títulos vencidos retornados pela API: {len(titulos)}")
        
        if not titulos:
            return {
                "status": "success",
                "message": "Nenhum título vencido encontrado no IXC",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        # PASSO 2: Agrupa títulos por cliente e pega APENAS OS 2 MAIS ANTIGOS
        # A API já retorna apenas títulos com status='A' (Ativo) e liberado='S'
        cliente_debitos = {}
        for titulo in titulos:
            cliente_id = titulo.get('cliente_id') or titulo.get('id_cliente')
            valor_aberto = float(titulo.get('valor_aberto', 0) or titulo.get('valor', 0))
            data_vencimento = titulo.get('data_vencimento', '')
            
            # Apenas títulos com valor > 0
            if cliente_id and valor_aberto > 0:
                if cliente_id not in cliente_debitos:
                    cliente_debitos[cliente_id] = {
                        'valor_total': 0,
                        'titulos': []
                    }
                cliente_debitos[cliente_id]['titulos'].append({
                    'valor': valor_aberto,
                    'data_vencimento': data_vencimento,
                    'titulo': titulo
                })
        
        print(f"=== Títulos válidos (status='A', liberado='S' e valor > 0): {sum(len(c['titulos']) for c in cliente_debitos.values())}")
        
        # PASSO 2.5: Para cada cliente, pega APENAS os 2 títulos mais antigos
        print("=== Processando clientes com títulos vencidos e em aberto...")
        for cliente_id in cliente_debitos.keys():
            # Ordena por data de vencimento (mais antigo primeiro)
            titulos_ordenados = sorted(
                cliente_debitos[cliente_id]['titulos'],
                key=lambda x: x['data_vencimento']
            )
            
            # Pega APENAS os 2 primeiros (mais antigos)
            dois_mais_antigos = titulos_ordenados[:2]
            
            # Soma apenas esses 2
            cliente_debitos[cliente_id]['valor_total'] = sum(t['valor'] for t in dois_mais_antigos)
            cliente_debitos[cliente_id]['titulos'] = [t['titulo'] for t in dois_mais_antigos]
            cliente_debitos[cliente_id]['quantidade'] = len(dois_mais_antigos)
            
            print(f"Cliente {cliente_id}: {len(dois_mais_antigos)} título(s) vencido(s) - R$ {cliente_debitos[cliente_id]['valor_total']:.2f}")
        
        if not cliente_debitos:
            print("=== Nenhum cliente com débito encontrado. Executando reconciliação para remover todos os importados...")
            # RECONCILIAÇÃO: Remover TODOS os clientes importados do IXC, pois não há mais ninguém com débito
            clientes_importados = await db.clients.find({
                "provider_id": provider_id,
                "is_active": True,
                "$or": [
                    {"reason": {"$regex": "Importado do IXC", "$options": "i"}},
                    {"inclusion_reason": {"$regex": "Importado do IXC", "$options": "i"}},
                    {"observations": {"$regex": "Importado do IXC", "$options": "i"}}
                ]
            }).to_list(length=None)
            
            clients_removed = 0
            for cliente in clientes_importados:
                print(f"=== RECONCILIAÇÃO: Inativando {cliente.get('name')} (CPF: {cliente.get('cpf')}) - sem débitos no IXC")
                await db.clients.update_one(
                    {"id": cliente["id"]},
                    {
                        "$set": {
                            "is_active": False,
                            "deleted_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                clients_removed += 1
            
            return {
                "status": "success",
                "message": f"Nenhum cliente com débito encontrado no IXC. {clients_removed} cliente(s) removido(s) automaticamente.",
                "clients_synced": 0,
                "clients_failed": 0,
                "clients_removed": clients_removed
            }
        
        # PASSO 3: Busca dados dos clientes com débito
        clientes_com_debito = []
        
        for cliente_id, debito_info in cliente_debitos.items():
            cliente_url = f"{api_url}/cliente"
            cliente_payload = {
                "qtype": "cliente.id",
                "query": str(cliente_id),
                "oper": "=",
                "page": "1",
                "rp": "1"
            }
            
            try:
                cliente_response = requests.get(
                    cliente_url,
                    headers=headers,
                    json=cliente_payload,
                    timeout=10,
                    verify=False
                )
                
                if cliente_response.status_code == 200:
                    cliente_json = cliente_response.json()
                    clientes = cliente_json.get('registros', [])
                    
                    if clientes:
                        cliente = clientes[0]
                        # Adiciona valor de débito real ao cliente (apenas 2 títulos mais antigos)
                        cliente['valor_debito'] = debito_info['valor_total']
                        cliente['numero_titulos'] = debito_info['quantidade']
                        cliente['total_titulos_vencidos'] = debito_info['quantidade']
                        
                        # Adiciona informações dos boletos (até 2 títulos mais antigos)
                        cliente['boletos'] = []
                        for titulo in debito_info['titulos']:
                            # Gera URL do boleto se não houver gateway_link
                            url_boleto = titulo.get('gateway_link', '')
                            if not url_boleto and titulo.get('id'):
                                # Gera URL do boleto usando o ID do título
                                # Formato padrão IXC: https://seuixc.com.br/central_assinante_web/boleto/{id_titulo}
                                url_boleto = f"{api_url.replace('/webservice/v1', '')}/central_assinante_web/boleto/{titulo.get('id')}"
                            
                            boleto_info = {
                                'valor': float(titulo.get('valor_aberto', 0) or titulo.get('valor', 0)),
                                'vencimento': titulo.get('data_vencimento', ''),
                                'linha_digitavel': titulo.get('linha_digitavel', ''),
                                'url_boleto': url_boleto,
                                'nosso_numero': titulo.get('nn_boleto', ''),
                                'id_titulo': titulo.get('id', ''),
                                'codigo_barras': titulo.get('codigo_barras', '')
                            }
                            # Só adiciona se tiver informações válidas
                            if boleto_info['valor'] > 0:
                                cliente['boletos'].append(boleto_info)
                                print(f"DEBUG - Boleto adicionado: ID={boleto_info['id_titulo']}, Valor={boleto_info['valor']}, URL={boleto_info['url_boleto']}, Linha={boleto_info['linha_digitavel'][:20]}...")
                        
                        clientes_com_debito.append(cliente)
            except Exception as e:
                print(f"Erro ao buscar cliente {cliente_id}: {e}")
                continue
        
        if not clientes_com_debito:
            return {
                "status": "error",
                "message": "Erro ao buscar dados dos clientes",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        # Importa clientes com débito real
        result = await import_clients_to_system(clientes_com_debito, provider_id, "ixc")
        
        # PASSO 3: RECONCILIAÇÃO - Inativa clientes que não estão mais no IXC
        # Pega lista de CPFs dos clientes que vieram do IXC nesta sincronização
        cpfs_atuais_ixc = set()
        for cliente in clientes_com_debito:
            cpf = cliente.get('cnpj_cpf', '')
            if cpf:
                # Limpa CPF (remove pontos, traços)
                cpf_limpo = ''.join(filter(str.isdigit, cpf))
                if cpf_limpo:
                    cpfs_atuais_ixc.add(cpf_limpo)
        
        print(f"=== RECONCILIAÇÃO: {len(cpfs_atuais_ixc)} CPFs ativos no IXC")
        
        # Busca todos os clientes IMPORTADOS DO IXC deste provider que estão ATIVOS
        clientes_importados_ixc = await db.clients.find({
            "provider_id": provider_id,
            "is_active": True,
            "$or": [
                {"reason": {"$regex": "Importado do IXC", "$options": "i"}},
                {"inclusion_reason": {"$regex": "Importado do IXC", "$options": "i"}},
                {"observations": {"$regex": "Importado do IXC", "$options": "i"}}
            ]
        }).to_list(length=None)
        
        print(f"=== RECONCILIAÇÃO: {len(clientes_importados_ixc)} clientes importados do IXC no sistema")
        
        # Inativa clientes que não estão mais no IXC
        clients_removed = 0
        for cliente_db in clientes_importados_ixc:
            cpf_db = cliente_db.get('cpf', '')
            # Limpa CPF do banco
            cpf_db_limpo = ''.join(filter(str.isdigit, cpf_db))
            
            # Se o CPF NÃO está na lista atual do IXC, inativa o cliente
            if cpf_db_limpo and cpf_db_limpo not in cpfs_atuais_ixc:
                print(f"=== RECONCILIAÇÃO: Inativando cliente {cliente_db.get('name')} (CPF: {cpf_db}) - não tem mais débitos no IXC")
                
                await db.clients.update_one(
                    {"id": cliente_db["id"]},
                    {
                        "$set": {
                            "is_active": False,
                            "deleted_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                clients_removed += 1
        
        print(f"=== RECONCILIAÇÃO: {clients_removed} clientes inativados (sem débitos no IXC)")
        
        # Atualiza mensagem de resultado
        original_message = result.get("message", "")
        if clients_removed > 0:
            result["message"] = f"{original_message} | {clients_removed} cliente(s) removido(s) (sem débitos no IXC)"
            result["clients_removed"] = clients_removed
        
        return result
        
    except ValueError:
        return {
            "status": "error",
            "message": "Token mal formatado",
            "clients_synced": 0,
            "clients_failed": 0
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro: {str(e)}",
            "clients_synced": 0,
            "clients_failed": 0
        }


async def sync_mkauth_data(integration: dict, provider_id: str) -> dict:
    """Sync client data from MK-Auth"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        api_token = credentials.get("api_token")
        
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Get delinquent clients from MK-Auth
        debt_threshold = integration.get("settings", {}).get("debt_days_threshold", 5)
        clients_url = f"{api_url}/api/v1/clientes/inadimplentes?dias={debt_threshold}"
        
        response = requests.get(clients_url, headers=headers, timeout=30)
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Erro ao buscar clientes: HTTP {response.status_code}",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        mkauth_clients = response.json().get('data', [])
        
        # Import clients into our system
        result = await import_clients_to_system(mkauth_clients, provider_id, "mk-auth")
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro na sincronização: {str(e)}",
            "clients_synced": 0,
            "clients_failed": 0
        }


async def sync_sgp_data(integration: dict, provider_id: str) -> dict:
    """Sync client data from SGP"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        api_key = credentials.get("api_key")
        api_secret = credentials.get("api_secret")
        
        headers = {
            "X-API-Key": api_key,
            "X-API-Secret": api_secret,
            "Content-Type": "application/json"
        }
        
        # Get delinquent clients from SGP
        debt_threshold = integration.get("settings", {}).get("debt_days_threshold", 5)
        clients_url = f"{api_url}/api/clientes/inadimplentes?dias_atraso={debt_threshold}"
        
        response = requests.get(clients_url, headers=headers, timeout=30)
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Erro ao buscar clientes: HTTP {response.status_code}",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        sgp_clients = response.json().get('clientes', [])
        
        # Import clients into our system
        result = await import_clients_to_system(sgp_clients, provider_id, "sgp")
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro na sincronização: {str(e)}",
            "clients_synced": 0,
            "clients_failed": 0
        }


async def sync_radiusnet_data(integration: dict, provider_id: str) -> dict:
    """Sync client data from RadiusNet"""
    try:
        import requests
        
        credentials = integration["credentials"]
        api_url = integration["api_url"].rstrip('/')
        username = credentials.get("username")
        password = credentials.get("password")
        
        # Authenticate with RadiusNet
        auth_url = f"{api_url}/api/login"
        auth_data = {
            "username": username,
            "password": password
        }
        
        auth_response = requests.post(auth_url, json=auth_data, timeout=10)
        if auth_response.status_code != 200:
            return {
                "status": "error",
                "message": "Falha na autenticação com RadiusNet",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        auth_result = auth_response.json()
        token = auth_result.get('token')
        
        if not token:
            return {
                "status": "error",
                "message": "Token não recebido do RadiusNet",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        # Get delinquent clients from RadiusNet
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        debt_threshold = integration.get("settings", {}).get("debt_days_threshold", 5)
        clients_url = f"{api_url}/api/clientes/inadimplentes?dias={debt_threshold}"
        
        response = requests.get(clients_url, headers=headers, timeout=30)
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"Erro ao buscar clientes: HTTP {response.status_code}",
                "clients_synced": 0,
                "clients_failed": 0
            }
        
        radiusnet_clients = response.json().get('clientes', [])
        
        # Import clients into our system
        result = await import_clients_to_system(radiusnet_clients, provider_id, "radiusnet")
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro na sincronização: {str(e)}",
            "clients_synced": 0,
            "clients_failed": 0
        }


async def import_clients_to_system(external_clients: list, provider_id: str, source_system: str) -> dict:
    """
    Import clients from external ERP system into ControleIsp database
    Handles data normalization and duplicate prevention
    """
    try:
        print(f"=== IMPORT CLIENTS - Total recebido: {len(external_clients)}")
        print(f"=== Provider ID: {provider_id}, Source: {source_system}")
        
        clients_synced = 0
        clients_failed = 0
        clients_updated = 0
        
        for idx, ext_client in enumerate(external_clients):
            try:
                # Normalize data based on source system
                normalized_client = normalize_client_data(ext_client, source_system)
                
                if not normalized_client:
                    print(f"Cliente {idx+1} FALHOU na normalização")
                    print(f"Dados originais: {ext_client}")
                    clients_failed += 1
                    continue
                
                print(f"Cliente {idx+1} normalizado: {normalized_client.get('name', 'SEM NOME')} - CPF: {normalized_client.get('cpf', 'SEM CPF')} - Débito: R$ {normalized_client.get('debt_amount', 0)}")
                
                # Check if client already exists (by CPF)
                print(f"Verificando duplicata para CPF: {normalized_client['cpf']}")
                try:
                    existing_client = await db.clients.find_one({
                        "provider_id": provider_id,
                        "cpf": normalized_client["cpf"],
                        "is_active": True
                    })
                    print(f"Resultado busca duplicata: {existing_client}")
                except Exception as e:
                    print(f"ERRO ao buscar duplicata: {e}")
                    existing_client = None
                
                if existing_client:
                    # Update existing client
                    update_data = {
                        "debt_amount": normalized_client["debt_amount"],
                        "reason": normalized_client.get("reason", existing_client.get("reason")),
                        "risk_level": normalized_client.get("risk_level", existing_client.get("risk_level")),
                        "phone": normalized_client.get("phone", existing_client.get("phone")),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    
                    # Adiciona boletos se existirem
                    if "boletos" in normalized_client and normalized_client["boletos"]:
                        update_data["boletos"] = normalized_client["boletos"]
                    
                    await db.clients.update_one(
                        {"id": existing_client["id"]},
                        {"$set": update_data}
                    )
                    clients_updated += 1
                else:
                    # Create new client
                    new_client = {
                        "id": str(uuid.uuid4()),
                        "provider_id": provider_id,
                        "name": normalized_client["name"],
                        "cpf": normalized_client["cpf"],
                        "email": normalized_client.get("email", ""),
                        "phone": normalized_client.get("phone", ""),
                        "address": normalized_client.get("address", ""),
                        "bairro": normalized_client.get("bairro", ""),
                        "debt_amount": normalized_client["debt_amount"],
                        "reason": normalized_client.get("reason", "Inadimplência"),
                        "risk_level": normalized_client.get("risk_level", 3),
                        "inclusion_date": normalized_client.get("inclusion_date", datetime.now(timezone.utc).date().isoformat()),
                        "observations": f"Importado do {source_system.upper()} em {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}",
                        "boletos": normalized_client.get("boletos", []),  # Adiciona boletos
                        "is_active": True,
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    
                    print(f"Salvando cliente: {new_client['name']} - CPF: {new_client['cpf']}")
                    result = await db.clients.insert_one(new_client)
                    print(f"Cliente salvo com ID MongoDB: {result.inserted_id}")
                    clients_synced += 1
                    
            except Exception as e:
                print(f"Erro ao processar cliente: {e}")
                clients_failed += 1
                continue
        
        status = "success" if clients_synced > 0 or clients_updated > 0 else "error"
        message = f"Sincronização concluída: {clients_synced} novos, {clients_updated} atualizados, {clients_failed} falhas"
        
        return {
            "status": status,
            "message": message,
            "clients_synced": clients_synced,
            "clients_updated": clients_updated,
            "clients_failed": clients_failed
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro ao importar clientes: {str(e)}",
            "clients_synced": 0,
            "clients_failed": len(external_clients)
        }


def normalize_client_data(client_data: dict, source_system: str) -> dict:
    """
    Normalize client data from different ERP systems into ControleIsp format
    """
    try:
        normalized = {}
        
        if source_system == "ixc":
            # IXC format normalization
            normalized["name"] = client_data.get("razao", client_data.get("fantasia", "")).strip().upper()
            normalized["cpf"] = clean_cpf(client_data.get("cnpj_cpf", ""))
            normalized["email"] = client_data.get("email", "").strip().lower()
            normalized["phone"] = clean_phone(client_data.get("telefone_celular", client_data.get("fone", "")))
            normalized["address"] = client_data.get("endereco", "").strip()
            normalized["bairro"] = client_data.get("bairro", "").strip()
            # Usa valor de débito real (soma dos 2 títulos mais antigos)
            normalized["debt_amount"] = float(client_data.get("valor_debito", 0))
            num_titulos = client_data.get("numero_titulos", 0)
            normalized["reason"] = f"Importado do IXC - {num_titulos} título(s) vencido(s)" if num_titulos else "Importado do IXC"
            # Preserva boletos
            normalized["boletos"] = client_data.get("boletos", [])
            
        elif source_system == "mk-auth":
            # MK-Auth format normalization
            normalized["name"] = client_data.get("name", client_data.get("full_name", "")).strip().upper()
            normalized["cpf"] = clean_cpf(client_data.get("cpf", client_data.get("document", "")))
            normalized["email"] = client_data.get("email", "").strip().lower()
            normalized["phone"] = clean_phone(client_data.get("phone", client_data.get("mobile", "")))
            normalized["address"] = client_data.get("street", "").strip()
            normalized["bairro"] = client_data.get("neighborhood", client_data.get("district", "")).strip()
            normalized["debt_amount"] = float(client_data.get("debt", client_data.get("debt_amount", 0)))
            normalized["reason"] = "Inadimplência"
            
        elif source_system == "sgp":
            # SGP format normalization
            normalized["name"] = client_data.get("nome_cliente", client_data.get("nome", "")).strip().upper()
            normalized["cpf"] = clean_cpf(client_data.get("cpf", ""))
            normalized["email"] = client_data.get("email_principal", client_data.get("email", "")).strip().lower()
            normalized["phone"] = clean_phone(client_data.get("telefone_principal", client_data.get("telefone", "")))
            normalized["address"] = client_data.get("logradouro", client_data.get("endereco", "")).strip()
            normalized["bairro"] = client_data.get("bairro", "").strip()
            normalized["debt_amount"] = float(client_data.get("valor_em_aberto", client_data.get("debito", 0)))
            normalized["reason"] = "Inadimplência"
            
        elif source_system == "radiusnet":
            # RadiusNet format normalization
            normalized["name"] = client_data.get("nome", client_data.get("cliente_nome", "")).strip().upper()
            normalized["cpf"] = clean_cpf(client_data.get("cpf", client_data.get("documento", "")))
            normalized["email"] = client_data.get("email", "").strip().lower()
            normalized["phone"] = clean_phone(client_data.get("telefone", client_data.get("contato", "")))
            normalized["address"] = client_data.get("endereco", "").strip()
            normalized["bairro"] = client_data.get("bairro", "").strip()
            normalized["debt_amount"] = float(client_data.get("debito_total", client_data.get("valor_devido", 0)))
            normalized["reason"] = "Inadimplência"
        
        # Validate required fields
        if not normalized.get("name") or not normalized.get("cpf"):
            return None
        
        if not normalized.get("debt_amount") or normalized["debt_amount"] <= 0:
            return None
        
        # Calculate risk level based on debt amount
        debt = normalized["debt_amount"]
        if debt < 100:
            normalized["risk_level"] = 1
        elif debt < 300:
            normalized["risk_level"] = 2
        elif debt < 500:
            normalized["risk_level"] = 3
        elif debt < 1000:
            normalized["risk_level"] = 4
        else:
            normalized["risk_level"] = 5
        
        return normalized
        
    except Exception as e:
        print(f"Erro ao normalizar dados do cliente: {e}")
        return None


def clean_cpf(cpf: str) -> str:
    """Remove formatting from CPF"""
    if not cpf:
        return ""
    return re.sub(r'[^\d]', '', cpf)


def clean_phone(phone: str) -> str:
    """Remove formatting from phone number"""
    if not phone:
        return ""
    return re.sub(r'[^\d]', '', phone)


# Admin endpoints for monitoring integrations
@api_router.get("/admin/integrations/overview")
async def get_integrations_overview(current_user=Depends(get_current_admin)):
    """Get overview of all provider integrations"""
    try:
        # Count integrations by type
        integration_stats = {}
        integrations = await db.provider_integrations.find({}).to_list(500)
        
        for integration in integrations:
            int_type = integration["integration_type"]
            if int_type not in integration_stats:
                integration_stats[int_type] = {
                    "total": 0,
                    "active": 0,
                    "connected": 0,
                    "errors": 0
                }
            
            integration_stats[int_type]["total"] += 1
            
            if integration.get("is_active"):
                integration_stats[int_type]["active"] += 1
            
            if integration.get("last_sync_status") == "success":
                integration_stats[int_type]["connected"] += 1
            elif integration.get("last_sync_status") == "error":
                integration_stats[int_type]["errors"] += 1
        
        return {
            "integration_stats": integration_stats,
            "total_integrations": len(integrations),
            "providers_with_integrations": len(set(i["provider_id"] for i in integrations))
        }
        
    except Exception as e:
        print(f"Erro ao obter visão geral das integrações: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao obter dados: {str(e)}")


# Include the router in the main app
app.include_router(api_router)

# Mount static files for logos (after API router)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    # Shutdown scheduler
    print("\n🛑 Parando scheduler de sincronização automática...")
    scheduler.shutdown()
    print("✅ Scheduler parado com sucesso!\n")
    
    # Close MongoDB connection
    client.close()
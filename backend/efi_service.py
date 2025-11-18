"""
Efi Bank / Gerencianet Integration Service
Handles boleto and PIX generation for provider subscriptions
"""

from gerencianet import Gerencianet
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import qrcode
from io import BytesIO
import base64

logger = logging.getLogger(__name__)

class EfiPaymentService:
    """Service for Efi Bank payment operations"""
    
    def __init__(self):
        """Initialize Efi Bank client with credentials from environment"""
        self.client_id = os.getenv("EFI_CLIENT_ID", "")
        self.client_secret = os.getenv("EFI_CLIENT_SECRET", "")
        self.sandbox = os.getenv("EFI_SANDBOX", "true").lower() == "true"
        
        if not self.client_id or not self.client_secret:
            logger.error("Efi Bank credentials not configured!")
            raise ValueError("EFI_CLIENT_ID and EFI_CLIENT_SECRET must be set in environment")
        
        # Initialize Gerencianet SDK
        self.credentials = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'sandbox': self.sandbox
        }
        
        try:
            self.gn = Gerencianet(self.credentials)
            logger.info(f"Efi Bank client initialized - Sandbox: {self.sandbox}")
        except Exception as e:
            logger.error(f"Failed to initialize Efi Bank client: {str(e)}")
            raise
    
    def create_boleto_charge(
        self,
        provider_data: Dict[str, Any],
        amount: float,
        due_days: int = 3
    ) -> Dict[str, Any]:
        """
        Create a boleto charge for provider subscription
        
        Args:
            provider_data: Provider information (name, email, cnpj, etc)
            amount: Amount in BRL (e.g., 199.00)
            due_days: Days until due date (default: 3)
            
        Returns:
            Dictionary with boleto details including barcode and link
        """
        try:
            # Calculate due date
            due_date = (datetime.now() + timedelta(days=due_days)).strftime("%Y-%m-%d")
            
            # Step 1: Create the charge first (without payment method)
            charge_body = {
                "items": [{
                    "name": "ControleIsp - Mensalidade do Sistema",
                    "value": int(amount * 100),  # Convert to cents
                    "amount": 1
                }],
                "metadata": {
                    "custom_id": provider_data.get("provider_id", ""),
                    "notification_url": os.getenv("WEBHOOK_URL", "https://telecom-control-1.preview.emergentagent.com/api/webhook/efi")
                }
            }
            
            # Create charge via Efi API
            logger.info(f"Creating boleto charge for provider: {provider_data.get('name')}")
            logger.info(f"Step 1 - Charge body: {charge_body}")
            
            response = self.gn.create_charge(body=charge_body)
            
            if not (isinstance(response, dict) and response.get("code") == 200):
                logger.error(f"Failed to create charge: {response}")
                return {
                    "success": False,
                    "error": "Erro ao criar cobrança"
                }
            
            charge_id = response.get("data", {}).get("charge_id")
            if not charge_id:
                logger.error(f"No charge_id in response: {response}")
                return {
                    "success": False,
                    "error": "Erro ao obter ID da cobrança"
                }
            
            # Step 2: Add payment method (boleto)
            # Extract and validate provider data - remove ALL non-numeric characters
            import re
            cpf = re.sub(r'\D', '', provider_data.get("cpf", ""))
            phone = re.sub(r'\D', '', provider_data.get("phone", ""))
            cep = re.sub(r'\D', '', provider_data.get("cep", ""))
            
            # Validate required fields
            if not cpf or len(cpf) != 11:
                raise ValueError(f"CPF inválido ou não fornecido: '{cpf}'. CPF deve ter 11 dígitos.")
            
            if not phone or len(phone) < 10:
                raise ValueError(f"Telefone inválido ou não fornecido: '{phone}'. Telefone deve ter pelo menos 10 dígitos.")
            
            if not cep or len(cep) != 8:
                raise ValueError(f"CEP inválido ou não fornecido: '{cep}'. CEP deve ter 8 dígitos.")
            
            street = provider_data.get("address", "")
            number = provider_data.get("number", "")
            neighborhood = provider_data.get("bairro", "")
            city = provider_data.get("city", "")
            state = provider_data.get("state", "")
            
            if not all([street, number, neighborhood, city, state]):
                missing = []
                if not street: missing.append("Endereço (Rua)")
                if not number: missing.append("Número")
                if not neighborhood: missing.append("Bairro")
                if not city: missing.append("Cidade")
                if not state: missing.append("Estado")
                raise ValueError(f"Dados de endereço incompletos. Faltando: {', '.join(missing)}")
            
            payment_body = {
                "payment": {
                    "banking_billet": {
                        "expire_at": due_date,
                        "customer": {
                            "name": provider_data.get("name", "")[:80],
                            "email": provider_data.get("email", ""),
                            "cpf": cpf,
                            "phone_number": phone,
                            "birth": "1980-01-01",  # Default birth date (optional field)
                            "address": {
                                "zipcode": cep,
                                "street": street,
                                "number": number,
                                "neighborhood": neighborhood,
                                "city": city,
                                "state": state
                            }
                        },
                        "message": "Pagamento da mensalidade do sistema ControleIsp"
                    }
                }
            }
            
            logger.info(f"Step 2 - Payment body: {payment_body}")
            
            # Add payment method to the charge
            params = {"id": charge_id}
            response = self.gn.pay_charge(params=params, body=payment_body)
            
            logger.info(f"Efi response type: {type(response)}")
            logger.info(f"Efi response: {response}")
            
            # Log error details if not successful
            if not (isinstance(response, dict) and response.get("code") == 200):
                error_msg = response.get("error_description") if isinstance(response, dict) else str(response)
                logger.error(f"❌ EFI BANK ERROR - Code: {response.get('code') if isinstance(response, dict) else 'N/A'}")
                logger.error(f"❌ EFI BANK ERROR - Message: {error_msg}")
                logger.error(f"❌ EFI BANK ERROR - Full Response: {response}")
                return {
                    "success": False,
                    "error": f"Efi Bank: {error_msg}"
                }
            
            if isinstance(response, dict) and response.get("code") == 200:
                data = response.get("data", {})
                charge_id = data.get("charge_id")
                
                logger.info(f"Boleto charge created successfully: {charge_id}")
                
                # Safely get PDF URL
                pdf_data = data.get("pdf")
                pdf_url = ""
                if isinstance(pdf_data, dict):
                    pdf_url = pdf_data.get("charge", "")
                elif isinstance(pdf_data, str):
                    pdf_url = pdf_data
                
                return {
                    "success": True,
                    "charge_id": charge_id,
                    "status": data.get("status", "pending"),
                    "total": amount,
                    "barcode": data.get("barcode", ""),
                    "link": data.get("link", ""),
                    "pdf": pdf_url,
                    "expire_at": due_date,
                    "created_at": datetime.now().isoformat()
                }
            else:
                logger.error(f"Failed to create boleto: {response}")
                return {
                    "success": False,
                    "error": "Erro ao criar boleto"
                }
                
        except Exception as e:
            logger.error(f"Error creating boleto charge: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def create_pix_charge(
        self,
        provider_data: Dict[str, Any],
        amount: float,
        expiration_minutes: int = 30
    ) -> Dict[str, Any]:
        """
        Create a PIX charge for provider subscription
        
        Args:
            provider_data: Provider information
            amount: Amount in BRL
            expiration_minutes: Minutes until PIX expires (default: 30)
            
        Returns:
            Dictionary with PIX QR code and copy-paste code
        """
        try:
            # Prepare charge data
            body = {
                "items": [{
                    "name": "ControleIsp - Mensalidade do Sistema",
                    "value": int(amount * 100),  # Convert to cents
                    "amount": 1
                }],
                "metadata": {
                    "custom_id": provider_data.get("provider_id", ""),
                    "notification_url": os.getenv("WEBHOOK_URL", "https://telecom-control-1.preview.emergentagent.com/api/webhook/efi")
                }
            }
            
            # Create charge
            logger.info(f"Creating PIX charge for provider: {provider_data.get('name')}")
            response = self.gn.create_charge(body=body)
            
            if response.get("code") == 200:
                charge_id = response.get("data", {}).get("charge_id")
                
                # Now create PIX payment for this charge
                params = {"id": charge_id}
                pix_body = {
                    "payment": {
                        "credit_card": {
                            "installments": 1,
                            "billing_address": {},
                            "payment_token": "",
                            "customer": {}
                        }
                    }
                }
                
                # For PIX, we need to use the one-step endpoint
                # Let's use the simplified approach
                pix_response = self.gn.create_charge(body={
                    "items": [{
                        "name": "ControleIsp - Mensalidade",
                        "value": int(amount * 100),
                        "amount": 1
                    }],
                    "metadata": {
                        "custom_id": provider_data.get("provider_id", "")
                    }
                })
                
                if pix_response.get("code") == 200:
                    pix_data = pix_response.get("data", {})
                    charge_id = pix_data.get("charge_id")
                    
                    # Generate QR Code image
                    qr_code = pix_data.get("pix", {}).get("qrcode", "")
                    qr_code_image = pix_data.get("pix", {}).get("qrcode_image", "")
                    
                    # Generate QR Code base64 if not provided
                    if qr_code and not qr_code_image:
                        qr = qrcode.QRCode(version=1, box_size=10, border=5)
                        qr.add_data(qr_code)
                        qr.make(fit=True)
                        
                        img = qr.make_image(fill_color="black", back_color="white")
                        buffer = BytesIO()
                        img.save(buffer, format='PNG')
                        qr_code_image = base64.b64encode(buffer.getvalue()).decode()
                    
                    logger.info(f"PIX charge created successfully: {charge_id}")
                    
                    return {
                        "success": True,
                        "charge_id": charge_id,
                        "status": "waiting",
                        "total": amount,
                        "qr_code": qr_code,
                        "qr_code_base64": qr_code_image,
                        "expires_at": (datetime.now() + timedelta(minutes=expiration_minutes)).isoformat(),
                        "created_at": datetime.now().isoformat()
                    }
                else:
                    logger.error(f"Failed to create PIX: {pix_response}")
                    return {
                        "success": False,
                        "error": "Erro ao criar PIX"
                    }
            else:
                logger.error(f"Failed to create charge for PIX: {response}")
                return {
                    "success": False,
                    "error": "Erro ao criar cobrança"
                }
                
        except Exception as e:
            logger.error(f"Error creating PIX charge: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_charge_details(self, charge_id: int) -> Dict[str, Any]:
        """
        Get charge details from Efi Bank
        
        Args:
            charge_id: Charge ID from Efi Bank
            
        Returns:
            Dictionary with charge details and status
        """
        try:
            params = {"id": charge_id}
            response = self.gn.detail_charge(params=params)
            
            if response.get("code") == 200:
                data = response.get("data", {})
                return {
                    "success": True,
                    "charge_id": charge_id,
                    "status": data.get("status", ""),
                    "total": data.get("total", 0) / 100,  # Convert from cents
                    "paid": data.get("paid", 0) / 100,
                    "payment_method": data.get("payment", ""),
                    "created_at": data.get("created_at", ""),
                    "paid_at": data.get("paid_at", "")
                }
            else:
                logger.error(f"Failed to get charge details: {response}")
                return {
                    "success": False,
                    "error": "Erro ao consultar cobrança"
                }
                
        except Exception as e:
            logger.error(f"Error getting charge details: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def cancel_charge(self, charge_id: int) -> Dict[str, Any]:
        """
        Cancel a charge
        
        Args:
            charge_id: Charge ID to cancel
            
        Returns:
            Dictionary with cancellation result
        """
        try:
            params = {"id": charge_id}
            response = self.gn.cancel_charge(params=params)
            
            if response.get("code") == 200:
                logger.info(f"Charge {charge_id} cancelled successfully")
                return {
                    "success": True,
                    "message": "Cobrança cancelada com sucesso"
                }
            else:
                logger.error(f"Failed to cancel charge: {response}")
                return {
                    "success": False,
                    "error": "Erro ao cancelar cobrança"
                }
                
        except Exception as e:
            logger.error(f"Error cancelling charge: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Create global instance (lazy initialization)
efi_service = None

def get_efi_service():
    """Get or create Efi service instance"""
    global efi_service
    if efi_service is None:
        efi_service = EfiPaymentService()
    return efi_service

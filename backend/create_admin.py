"""
Script para criar um usuário admin no banco de dados
"""
import asyncio
import os
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Configuração
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/controleisp")

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

async def create_admin():
    # Conectar ao MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_default_database()
    
    # Dados do admin
    admin_username = "admin"
    admin_password = "admin123"  # IMPORTANTE: Trocar após primeiro login!
    
    # Verificar se já existe admin
    existing_admin = await db.admins.find_one({"username": admin_username})
    if existing_admin:
        print(f"⚠️ Admin '{admin_username}' já existe no banco de dados!")
        return
    
    # Criar hash da senha
    password_hash = pwd_context.hash(admin_password)
    
    # Criar documento do admin
    admin_data = {
        "id": str(uuid.uuid4()),
        "username": admin_username,
        "password_hash": password_hash,
        "created_at": "2025-01-01T00:00:00"
    }
    
    # Inserir no banco
    await db.admins.insert_one(admin_data)
    
    print("✅ Admin criado com sucesso!")
    print(f"   Username: {admin_username}")
    print(f"   Password: {admin_password}")
    print("\n⚠️  IMPORTANTE: Troque a senha após o primeiro login!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())

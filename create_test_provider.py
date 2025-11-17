#!/usr/bin/env python3
"""
Create a test provider directly in the database
"""
import asyncio
import os
import hashlib
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Load environment
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('/app/backend/.env'))

# Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_db")

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

async def create_test_provider():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Provider data
    provider_id = str(uuid.uuid4())
    provider_data = {
        "id": provider_id,
        "name": "Provedor Teste Efi",
        "nome_fantasia": "Efi Test Provider",
        "email": "teste.efi@example.com",
        "username": "teste.efi@example.com",
        "password_hash": hash_password("senha123"),
        "cnpj": "11.222.333/0001-81",
        "phone": "(11) 99999-9999",
        "address": "Rua Teste, 123",
        "bairro": "Centro",
        "is_active": True,
        "is_blocked": False,
        "blocked_at": None,
        "blocked_reason": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "id_front_photo": "test_front.jpg",
        "id_back_photo": "test_back.jpg",
        "holding_id_photo": "test_holding.jpg",
        "logo_url": None,
        "contract_accepted": True,
        "contract_acceptance_date": datetime.now(timezone.utc).isoformat(),
        "contract_ip": "127.0.0.1",
        "contract_version": "1.0",
        "financial_generated": False,  # This is what we want to test
        "approved": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert provider
    await db.providers.insert_one(provider_data)
    
    print(f"✅ Test provider created successfully!")
    print(f"   ID: {provider_id}")
    print(f"   Email: {provider_data['email']}")
    print(f"   Password: senha123")
    print(f"   Financial Generated: {provider_data['financial_generated']}")
    
    client.close()
    return provider_id

if __name__ == "__main__":
    asyncio.run(create_test_provider())
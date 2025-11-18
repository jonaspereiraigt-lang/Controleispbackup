#!/usr/bin/env python3
"""
Test Admin Efi Integration
Tests the admin endpoint for generating financial with Efi Bank
"""

import requests
import json
import time

# Configuration
BACKEND_URL = "https://ispadmin-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "master"
ADMIN_PASSWORD = "master123"

def get_admin_token():
    """Get admin token"""
    response = requests.post(
        f"{BACKEND_URL}/auth/admin/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=30
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def create_test_provider(token):
    """Create a test provider"""
    headers = {"Authorization": f"Bearer {token}"}
    
    provider_data = {
        "name": "Provedor Teste Efi Final",
        "nome_fantasia": "Efi Test Final",
        "email": f"teste.efi.final.{int(time.time())}@example.com",
        "password": "senha123",
        "cnpj": "11.222.333/0001-81",
        "phone": "(11) 99999-9999",
        "address": "Rua Teste, 123",
        "bairro": "Centro"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/admin/providers",
        json=provider_data,
        headers=headers,
        timeout=30
    )
    
    if response.status_code == 200:
        return response.json().get("provider_id")
    else:
        print(f"Failed to create provider: {response.status_code} - {response.text}")
        return None

def test_generate_boleto(token, provider_id):
    """Test boleto generation"""
    headers = {"Authorization": f"Bearer {token}"}
    
    payment_data = {
        "type": "boleto",
        "amount": 199.00
    }
    
    response = requests.post(
        f"{BACKEND_URL}/admin/providers/{provider_id}/generate-financial",
        json=payment_data,
        headers=headers,
        timeout=60
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Boleto generated successfully!")
        print(f"   Success: {data.get('success')}")
        print(f"   Message: {data.get('message')}")
        payment = data.get('payment', {})
        print(f"   Charge ID: {payment.get('charge_id')}")
        print(f"   Status: {payment.get('status')}")
        print(f"   Amount: R$ {payment.get('amount')}")
        return True
    else:
        print(f"❌ Boleto generation failed: {response.status_code} - {response.text}")
        return False

def test_generate_pix(token, provider_id):
    """Test PIX generation"""
    headers = {"Authorization": f"Bearer {token}"}
    
    payment_data = {
        "type": "pix",
        "amount": 199.00
    }
    
    response = requests.post(
        f"{BACKEND_URL}/admin/providers/{provider_id}/generate-financial",
        json=payment_data,
        headers=headers,
        timeout=60
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ PIX generated successfully!")
        print(f"   Success: {data.get('success')}")
        print(f"   Message: {data.get('message')}")
        payment = data.get('payment', {})
        print(f"   Charge ID: {payment.get('charge_id')}")
        print(f"   Status: {payment.get('status')}")
        print(f"   Amount: R$ {payment.get('amount')}")
        return True
    else:
        print(f"❌ PIX generation failed: {response.status_code} - {response.text}")
        return False

def main():
    print("🚀 Testing Admin Efi Integration")
    print("=" * 50)
    
    # Get admin token
    print("🔐 Getting admin token...")
    token = get_admin_token()
    if not token:
        print("❌ Failed to get admin token")
        return 1
    print("✅ Admin token obtained")
    
    # Create test provider
    print("\n👤 Creating test provider...")
    provider_id = create_test_provider(token)
    if not provider_id:
        print("❌ Failed to create test provider")
        return 1
    print(f"✅ Test provider created: {provider_id}")
    
    # Test boleto generation
    print("\n💰 Testing boleto generation...")
    boleto_success = test_generate_boleto(token, provider_id)
    
    # Test PIX generation  
    print("\n💳 Testing PIX generation...")
    pix_success = test_generate_pix(token, provider_id)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    if boleto_success and pix_success:
        print("🎉 All tests passed! Admin Efi integration is working perfectly!")
        print("\n✅ INTEGRATION STATUS:")
        print("   • Efi Bank credentials: VALID")
        print("   • Boleto generation: WORKING")
        print("   • PIX generation: WORKING")
        print("   • Admin endpoint: WORKING")
        return 0
    else:
        print("⚠️  Some tests failed:")
        print(f"   • Boleto: {'✅' if boleto_success else '❌'}")
        print(f"   • PIX: {'✅' if pix_success else '❌'}")
        return 1

if __name__ == "__main__":
    exit(main())
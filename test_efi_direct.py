#!/usr/bin/env python3
"""
Direct Efi Bank Integration Test
Tests the Efi service directly without going through the full provider creation flow
"""

import sys
import os
sys.path.append('/app/backend')

from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path('/app/backend/.env'))

from efi_service import get_efi_service
import json

def test_efi_credentials():
    """Test if Efi credentials are working"""
    print("🔑 Testing Efi Bank Credentials...")
    
    try:
        efi_service = get_efi_service()
        print("✅ Efi service initialized successfully")
        print(f"   Sandbox mode: {efi_service.sandbox}")
        print(f"   Client ID: {efi_service.client_id[:20]}...")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Efi service: {e}")
        return False

def test_boleto_creation():
    """Test boleto creation"""
    print("\n💰 Testing Boleto Creation...")
    
    try:
        efi_service = get_efi_service()
        
        # Test provider data
        provider_data = {
            "provider_id": "test-provider-123",
            "name": "Provedor Teste Efi",
            "email": "teste@provedor.com",
            "cpf": "12345678901",
            "phone": "(11) 99999-9999"
        }
        
        result = efi_service.create_boleto_charge(provider_data, 199.00, due_days=3)
        
        if result.get("success"):
            print("✅ Boleto created successfully!")
            print(f"   Charge ID: {result.get('charge_id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Amount: R$ {result.get('total')}")
            print(f"   Barcode: {result.get('barcode', '')[:50]}...")
            return True
        else:
            print(f"❌ Boleto creation failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating boleto: {e}")
        return False

def test_pix_creation():
    """Test PIX creation"""
    print("\n💳 Testing PIX Creation...")
    
    try:
        efi_service = get_efi_service()
        
        # Test provider data
        provider_data = {
            "provider_id": "test-provider-123",
            "name": "Provedor Teste Efi",
            "email": "teste@provedor.com"
        }
        
        result = efi_service.create_pix_charge(provider_data, 199.00, expiration_minutes=30)
        
        if result.get("success"):
            print("✅ PIX created successfully!")
            print(f"   Charge ID: {result.get('charge_id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Amount: R$ {result.get('total')}")
            print(f"   QR Code: {'Present' if result.get('qr_code') else 'Not provided'}")
            return True
        else:
            print(f"❌ PIX creation failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating PIX: {e}")
        return False

def main():
    """Main test execution"""
    print("🚀 Direct Efi Bank Integration Test")
    print("=" * 50)
    
    tests = [
        ("Efi Credentials", test_efi_credentials),
        ("Boleto Creation", test_boleto_creation),
        ("PIX Creation", test_pix_creation),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ CRITICAL ERROR in {test_name}: {str(e)}")
            failed += 1
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All tests passed! Efi Bank integration is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
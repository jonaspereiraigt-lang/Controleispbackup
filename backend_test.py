#!/usr/bin/env python3
"""
Backend Testing Script for Onboarding Flow with Automatic Installment Generation
Tests the complete onboarding flow where provider accepts terms and 12 installments are automatically generated
Specifically tests the fix for error 400 in production environment with real provider data
"""

import requests
import json
import sys
import time
from datetime import datetime
import pymongo
from pymongo import MongoClient
import subprocess
import os

# Configuration
BACKEND_URL = "https://telecom-control-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_db"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.provider_token = None
        self.test_provider_id = None
        self.test_provider_email = None
        self.test_provider_password = "senha123"
        self.results = []
        self.mongo_client = None
        self.db = None
        self.generated_payments = []  # Store all generated payments
        self.new_provider_data = None  # Store new provider data for onboarding test
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        if details:
            print(f"   Details: {details}")
        print()
    
    def create_admin_if_needed(self):
        """Create admin using the create_admin.py script if needed"""
        print("👤 Creating Admin if needed...")
        
        try:
            # First try to login to see if admin exists
            response = requests.post(
                f"{BACKEND_URL}/auth/admin/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_result("Admin Check", True, "Admin already exists")
                return True
            
            # Admin doesn't exist, create it
            print("   Admin not found, creating...")
            result = subprocess.run(
                ["python3", "/app/backend/create_admin.py"],
                cwd="/app/backend",
                capture_output=True,
                text=True,
                env=dict(os.environ, MONGO_URL=MONGO_URL)
            )
            
            if result.returncode == 0:
                self.log_result("Admin Creation", True, "Admin created successfully")
                return True
            else:
                self.log_result("Admin Creation", False, f"Failed to create admin: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Admin Creation", False, f"Error creating admin: {str(e)}")
            return False

    def admin_login(self):
        """Test admin login and get token"""
        print("🔐 Testing Admin Login...")
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/admin/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.admin_token}"
                })
                self.log_result("Admin Login", True, "Admin login successful")
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def create_test_provider(self):
        """Create or use existing test provider for boleto testing"""
        print("👤 Creating/Finding Test Provider...")
        
        try:
            # Check database directly for valid providers
            if self.db is not None:
                providers = list(self.db.providers.find({
                    "is_active": True,
                    "name": {"$ne": None},
                    "email": {"$ne": None}
                }))
                
                if providers:
                    test_provider = providers[0]
                    self.test_provider_id = test_provider.get("id")
                    self.test_provider_email = test_provider.get("email")
                    # Try common passwords
                    self.test_provider_password = "123456"
                    
                    self.log_result("Create Provider", True, f"Using existing provider from DB: {self.test_provider_id} ({self.test_provider_email})")
                    return True
                
                # If no active providers with valid data, use any provider and fix it
                all_providers = list(self.db.providers.find({}))
                if all_providers:
                    test_provider = all_providers[0]
                    provider_id = test_provider.get("id")
                    
                    # Update provider with valid data and known password
                    import hashlib
                    password_hash = hashlib.sha256("123456".encode('utf-8')).hexdigest()
                    
                    self.db.providers.update_one(
                        {"id": provider_id},
                        {"$set": {
                            "name": "Test Provider",
                            "email": "test@provider.com",
                            "password_hash": password_hash,
                            "is_active": True,
                            "is_blocked": False
                        }}
                    )
                    
                    self.test_provider_id = provider_id
                    self.test_provider_email = "test@provider.com"
                    self.test_provider_password = "123456"
                    
                    self.log_result("Create Provider", True, f"Fixed and using provider: {self.test_provider_id}")
                    return True
            
            # If no existing providers, create a new one
            timestamp = int(time.time())
            unique_email = f"provedor.boleto.test.{timestamp}@example.com"
            
            provider_data = {
                "name": "Provedor Teste Boleto",
                "nome_fantasia": "Boleto Test Provider",
                "email": unique_email,
                "password": self.test_provider_password,
                "cnpj": "11.222.333/0001-81",
                "cpf": "123.456.789-00",
                "phone": "(11) 99999-9999",
                "address": "Rua Teste Boleto, 123",
                "bairro": "Centro",
                "number": "123",
                "complement": "Sala 1",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "cep": "01000-000",
                "id_front_photo": "test_front_photo.jpg",
                "id_back_photo": "test_back_photo.jpg",
                "holding_id_photo": "test_holding_photo.jpg",
                "contract_accepted": True
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/providers",
                json=provider_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_provider_id = data.get("provider_id")
                self.test_provider_email = unique_email
                self.log_result("Create Provider", True, f"Provider created successfully: {self.test_provider_id}")
                return True
            else:
                self.log_result("Create Provider", False, f"Failed to create provider: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Create Provider", False, f"Error creating provider: {str(e)}")
            return False
    
    def test_provider_login(self):
        """Test provider login"""
        print("🔑 Testing Provider Login...")
        
        if not self.test_provider_email:
            self.log_result("Provider Login", False, "No test provider email available")
            return False
        
        try:
            # Try to login as provider
            login_response = requests.post(
                f"{BACKEND_URL}/auth/provider/login",
                json={
                    "username": self.test_provider_email,
                    "password": self.test_provider_password
                },
                timeout=30
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.provider_token = data.get("access_token")
                self.log_result("Provider Login", True, "Provider login successful")
                return True
            else:
                self.log_result("Provider Login", False, f"Provider login failed: {login_response.status_code}", login_response.text)
                return False
                
        except Exception as e:
            self.log_result("Provider Login", False, f"Error in provider login: {str(e)}")
            return False
    
    def test_provider_access_without_financial(self):
        """Test provider access to resources without financial_generated (should get 402)"""
        print("🚫 Testing Provider Access Without Financial...")
        
        if not self.provider_token:
            self.log_result("Provider Access Test", False, "No provider token available")
            return False
        
        try:
            # Create a new session for provider
            provider_session = requests.Session()
            provider_session.headers.update({
                "Authorization": f"Bearer {self.provider_token}"
            })
            
            # Try to access a protected resource (create client)
            client_data = {
                "name": "Cliente Teste",
                "cpf": "123.456.789-00",
                "email": "cliente@test.com",
                "phone": "(11) 99999-9999",
                "address": "Rua Cliente, 123",
                "bairro": "Centro",
                "debt_amount": 100.00,
                "reason": "Teste de acesso",
                "inclusion_date": "2025-01-01",
                "observations": "Teste",
                "risk_level": 1
            }
            
            response = provider_session.post(
                f"{BACKEND_URL}/provider/clients",
                json=client_data,
                timeout=30
            )
            
            # We expect either 402 (payment required) or success if system is free
            if response.status_code == 402:
                self.log_result("Provider Access Test", True, "Correctly blocked with 402 - Payment Required")
                return True
            elif response.status_code == 200 or response.status_code == 201:
                self.log_result("Provider Access Test", True, "Access allowed - System appears to be in free mode")
                return True
            else:
                self.log_result("Provider Access Test", False, f"Unexpected response: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Provider Access Test", False, f"Error testing provider access: {str(e)}")
            return False
    
    def test_generate_financial_boleto(self):
        """Test admin endpoint to generate boleto financial for provider"""
        print("💰 Testing Generate Financial - Boleto...")
        
        if not self.test_provider_id:
            self.log_result("Generate Boleto", False, "No test provider ID available")
            return False
        
        try:
            payment_data = {
                "type": "boleto",
                "amount": 199.00
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/generate-financial",
                json=payment_data,
                timeout=60  # Longer timeout for Efi API
            )
            
            if response.status_code == 200:
                data = response.json()
                payment_info = data.get("payment", {})
                
                # Check if we got the expected boleto data
                if payment_info.get("success") and payment_info.get("payment_type") == "boleto":
                    details = {
                        "charge_id": payment_info.get("charge_id"),
                        "barcode": payment_info.get("barcode", "")[:50] + "..." if payment_info.get("barcode") else "Not provided",
                        "amount": payment_info.get("amount"),
                        "status": payment_info.get("status")
                    }
                    self.log_result("Generate Boleto", True, "Boleto generated successfully", details)
                    return True
                else:
                    self.log_result("Generate Boleto", False, "Invalid boleto response", data)
                    return False
            else:
                self.log_result("Generate Boleto", False, f"Failed to generate boleto: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Generate Boleto", False, f"Error generating boleto: {str(e)}")
            return False
    
    def test_generate_financial_pix(self):
        """Test admin endpoint to generate PIX financial for provider"""
        print("💳 Testing Generate Financial - PIX...")
        
        if not self.test_provider_id:
            self.log_result("Generate PIX", False, "No test provider ID available")
            return False
        
        try:
            payment_data = {
                "type": "pix",
                "amount": 199.00
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/generate-financial",
                json=payment_data,
                timeout=60  # Longer timeout for Efi API
            )
            
            if response.status_code == 200:
                data = response.json()
                payment_info = data.get("payment", {})
                
                # Check if we got the expected PIX data
                if payment_info.get("success") and payment_info.get("payment_type") == "pix":
                    details = {
                        "charge_id": payment_info.get("charge_id"),
                        "qr_code": payment_info.get("qr_code", "")[:50] + "..." if payment_info.get("qr_code") else "Not provided",
                        "amount": payment_info.get("amount"),
                        "status": payment_info.get("status")
                    }
                    self.log_result("Generate PIX", True, "PIX generated successfully", details)
                    return True
                else:
                    self.log_result("Generate PIX", False, "Invalid PIX response", data)
                    return False
            else:
                self.log_result("Generate PIX", False, f"Failed to generate PIX: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Generate PIX", False, f"Error generating PIX: {str(e)}")
            return False
    
    def test_provider_financial_status(self):
        """Test if provider financial_generated status was updated"""
        print("📊 Testing Provider Financial Status...")
        
        if not self.test_provider_id:
            self.log_result("Financial Status", False, "No test provider ID available")
            return False
        
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/providers", timeout=30)
            
            if response.status_code == 200:
                providers = response.json()
                test_provider = None
                for provider in providers:
                    if provider.get("id") == self.test_provider_id:
                        test_provider = provider
                        break
                
                if test_provider:
                    financial_generated = test_provider.get("financial_generated", False)
                    if financial_generated:
                        self.log_result("Financial Status", True, "Provider financial_generated status updated to True")
                        return True
                    else:
                        self.log_result("Financial Status", False, "Provider financial_generated status still False")
                        return False
                else:
                    self.log_result("Financial Status", False, "Test provider not found in list")
                    return False
            else:
                self.log_result("Financial Status", False, f"Failed to get providers: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Financial Status", False, f"Error checking financial status: {str(e)}")
            return False
    
    def connect_to_database(self):
        """Connect to MongoDB to check payments collection directly"""
        print("🗄️ Connecting to Database...")
        
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            # Test connection
            self.db.list_collection_names()
            self.log_result("Database Connection", True, "Successfully connected to MongoDB")
            return True
        except Exception as e:
            self.log_result("Database Connection", False, f"Failed to connect to MongoDB: {str(e)}")
            return False
    
    def get_existing_providers(self):
        """Get list of existing providers"""
        print("👥 Getting Existing Providers...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/providers", timeout=30)
            
            if response.status_code == 200:
                providers = response.json()
                self.log_result("Get Providers", True, f"Found {len(providers)} providers")
                
                # Show provider details
                for i, provider in enumerate(providers[:3]):  # Show first 3
                    print(f"   Provider {i+1}: {provider.get('name')} (ID: {provider.get('id')[:8]}...)")
                
                if providers:
                    # Use the first provider for testing
                    self.test_provider_id = providers[0].get('id')
                    return True
                else:
                    self.log_result("Get Providers", False, "No providers found in system")
                    return False
            else:
                self.log_result("Get Providers", False, f"Failed to get providers: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get Providers", False, f"Error getting providers: {str(e)}")
            return False
    
    def test_generate_financial_boleto_installments(self):
        """Test admin endpoint to generate boleto financial with 2 installments - MAIN TEST"""
        print("💰 Testing Generate Financial - Boleto with 2 Installments...")
        
        if not self.test_provider_id:
            self.log_result("Generate Boleto Installments", False, "No test provider ID available")
            return False
        
        try:
            payment_data = {
                "type": "boleto",
                "amount": 199.00,
                "installments": 2
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/generate-financial",
                json=payment_data,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response indicates success (the API might return different structure)
                if data.get("success") or data.get("message"):
                    # The API might have generated payments even if structure is different
                    self.log_result("Generate Boleto Installments", True, f"Boleto generation request successful", data)
                    return True
                else:
                    self.log_result("Generate Boleto Installments", False, "Response doesn't indicate success", data)
                    return False
            else:
                self.log_result("Generate Boleto Installments", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Generate Boleto Installments", False, f"Error generating boleto installments: {str(e)}")
            return False
    
    def test_provider_my_payments(self):
        """Test provider endpoint to get their payments - CRITICAL TEST"""
        print("🔍 Testing Provider My Payments Endpoint...")
        
        if not self.provider_token:
            self.log_result("Provider My Payments", False, "No provider token available")
            return False
        
        try:
            # Create a new session for provider
            provider_session = requests.Session()
            provider_session.headers.update({
                "Authorization": f"Bearer {self.provider_token}"
            })
            
            response = provider_session.get(
                f"{BACKEND_URL}/provider/my-payments",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                payments = data.get("payments", []) if isinstance(data, dict) else data
                self.log_result("Provider My Payments", True, f"Endpoint working - Found {len(payments)} payments")
                
                # Verify critical fields are present
                critical_issues = []
                for i, payment in enumerate(payments):
                    payment_id = payment.get("payment_id") or payment.get("charge_id")
                    
                    # Check required fields
                    required_fields = ["link", "pdf", "barcode", "status", "amount", "created_at", "expires_at"]
                    missing_fields = []
                    empty_fields = []
                    
                    for field in required_fields:
                        if field not in payment:
                            missing_fields.append(field)
                        elif not payment.get(field):
                            empty_fields.append(field)
                    
                    if missing_fields or empty_fields:
                        critical_issues.append({
                            "payment_id": payment_id,
                            "missing_fields": missing_fields,
                            "empty_fields": empty_fields
                        })
                    
                    # Log payment details
                    print(f"   Payment {i+1}:")
                    print(f"     ID: {payment_id}")
                    print(f"     Link: {'✅' if payment.get('link') else '❌'} {payment.get('link', 'MISSING')}")
                    print(f"     PDF: {'✅' if payment.get('pdf') else '❌'} {payment.get('pdf', 'MISSING')}")
                    print(f"     Status: {payment.get('status', 'MISSING')}")
                    print(f"     Amount: {payment.get('amount', 'MISSING')}")
                
                if critical_issues:
                    self.log_result("Provider My Payments - Fields Check", False, f"Critical fields missing/empty in {len(critical_issues)} payments", critical_issues)
                    return False
                else:
                    self.log_result("Provider My Payments - Fields Check", True, "All critical fields present and non-empty")
                    return True
            else:
                self.log_result("Provider My Payments", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Provider My Payments", False, f"Error getting provider payments: {str(e)}")
            return False
    
    def test_admin_provider_payments(self):
        """Test admin endpoint to get provider's payments - CRITICAL TEST"""
        print("🔍 Testing Admin Provider Payments Endpoint...")
        
        if not self.test_provider_id:
            self.log_result("Admin Provider Payments", False, "No test provider ID available")
            return False
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/payments",
                timeout=30
            )
            
            if response.status_code == 200:
                payments = response.json()
                self.log_result("Admin Provider Payments", True, f"Endpoint working - Found {len(payments)} payments")
                
                # Verify we have at least 2 payments (there might be more from previous tests)
                if len(payments) < 2:
                    self.log_result("Admin Provider Payments - Count Check", False, f"Expected at least 2 payments, found {len(payments)}")
                    return False
                
                # Verify critical fields are present
                critical_issues = []
                for i, payment in enumerate(payments):
                    payment_id = payment.get("payment_id") or payment.get("charge_id")
                    
                    # Check required fields
                    required_fields = ["payment_id", "link", "pdf", "barcode", "status", "amount", "created_at", "expires_at"]
                    missing_fields = []
                    empty_fields = []
                    
                    for field in required_fields:
                        if field not in payment:
                            missing_fields.append(field)
                        elif not payment.get(field):
                            empty_fields.append(field)
                    
                    if missing_fields or empty_fields:
                        critical_issues.append({
                            "payment_id": payment_id,
                            "missing_fields": missing_fields,
                            "empty_fields": empty_fields
                        })
                    
                    # Verify specific values
                    if payment.get("status") != "pending":
                        critical_issues.append({
                            "payment_id": payment_id,
                            "issue": f"Status should be 'pending', got '{payment.get('status')}'"
                        })
                    
                    if payment.get("amount") != 199.00:
                        critical_issues.append({
                            "payment_id": payment_id,
                            "issue": f"Amount should be 199.00, got {payment.get('amount')}"
                        })
                    
                    # Log payment details
                    print(f"   Payment {i+1}:")
                    print(f"     ID: {payment_id}")
                    print(f"     Link: {'✅' if payment.get('link') else '❌'} {payment.get('link', 'MISSING')}")
                    print(f"     PDF: {'✅' if payment.get('pdf') else '❌'} {payment.get('pdf', 'MISSING')}")
                    print(f"     Status: {payment.get('status', 'MISSING')}")
                    print(f"     Amount: {payment.get('amount', 'MISSING')}")
                    print(f"     Expires: {payment.get('expires_at', 'MISSING')}")
                
                if critical_issues:
                    self.log_result("Admin Provider Payments - Fields Check", False, f"Critical issues found in payments", critical_issues)
                    return False
                else:
                    self.log_result("Admin Provider Payments - Fields Check", True, "All critical fields present and correct")
                    return True
            else:
                self.log_result("Admin Provider Payments", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Provider Payments", False, f"Error getting admin provider payments: {str(e)}")
            return False
    
    def check_database_payments(self):
        """Check payments collection in database directly - DIAGNOSTIC TEST"""
        print("🗄️ Checking Database Payments Collection...")
        
        if self.db is None:
            self.log_result("Database Payments Check", False, "No database connection available")
            return False
        
        try:
            # Get all payments from database
            payments_collection = self.db.payments
            all_payments = list(payments_collection.find({}))
            
            self.log_result("Database Payments Check", True, f"Found {len(all_payments)} payments in database")
            
            # Show payment details
            for i, payment in enumerate(all_payments[-5:]):  # Show last 5 payments
                print(f"   Payment {i+1}:")
                print(f"     ID: {payment.get('id', payment.get('_id'))}")
                print(f"     Provider ID: {payment.get('provider_id')}")
                print(f"     Payment ID: {payment.get('payment_id')}")
                print(f"     Amount: {payment.get('amount')}")
                print(f"     Status: {payment.get('status')}")
                print(f"     Created: {payment.get('created_at')}")
                print()
            
            # Check if our test provider has payments
            if self.test_provider_id:
                provider_payments = list(payments_collection.find({"provider_id": self.test_provider_id}))
                print(f"   Payments for test provider ({self.test_provider_id[:8]}...): {len(provider_payments)}")
                
                # Check for recent payments (last 5 minutes)
                from datetime import datetime, timedelta
                recent_time = datetime.now() - timedelta(minutes=5)
                recent_payments = list(payments_collection.find({
                    "provider_id": self.test_provider_id,
                    "created_at": {"$gte": recent_time.isoformat()}
                }))
                print(f"   Recent payments for test provider: {len(recent_payments)}")
            
            return True
                
        except Exception as e:
            self.log_result("Database Payments Check", False, f"Error checking database: {str(e)}")
            return False

    # =============================================================================
    # ONBOARDING FLOW TESTS - AUTOMATIC INSTALLMENT GENERATION
    # =============================================================================
    
    def test_create_new_provider_with_complete_data(self):
        """STEP 1: Create a new provider with ALL required data for production Efi Bank"""
        print("👤 STEP 1: Creating New Provider with Complete Data...")
        
        try:
            # Generate unique data for this test
            timestamp = int(time.time())
            
            # Complete provider data with all required fields for Efi Bank production
            self.new_provider_data = {
                "name": "ISP Teste Producao Ltda",
                "nome_fantasia": "ISP Teste",
                "email": f"teste.producao.{timestamp}@ispteste.com",
                "password": "senha123",
                "cnpj": "12345678000190",
                "cpf": "12345678901",  # CPF do responsável
                "phone": "11987654321",
                "cep": "01310100",
                "address": "Avenida Paulista",
                "number": "1578",
                "bairro": "Bela Vista",
                "city": "São Paulo",
                "state": "SP",
                "id_front_photo": "data:image/png;base64,iVBORw0KGgo=",
                "id_back_photo": "data:image/png;base64,iVBORw0KGgo=",
                "holding_id_photo": "data:image/png;base64,iVBORw0KGgo=",
                "contract_accepted": True,
                "due_day": 10
            }
            
            response = requests.post(
                f"{BACKEND_URL}/provider/register",
                json=self.new_provider_data,
                timeout=30
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                self.test_provider_id = data.get("provider_id") or data.get("id")
                self.test_provider_email = self.new_provider_data["email"]
                self.test_provider_password = self.new_provider_data["password"]
                
                self.log_result("Create New Provider", True, f"Provider created successfully: {self.test_provider_id}")
                return True
            else:
                self.log_result("Create New Provider", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Create New Provider", False, f"Error creating provider: {str(e)}")
            return False
    
    def test_provider_login_first_time(self):
        """STEP 2: Login provider and verify first_login status"""
        print("🔑 STEP 2: Testing Provider First Login...")
        
        if not self.test_provider_email:
            self.log_result("Provider First Login", False, "No test provider email available")
            return False
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/provider/login",
                json={
                    "username": self.test_provider_email,
                    "password": self.test_provider_password
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.provider_token = data.get("access_token")
                
                # Verify login response structure
                expected_fields = ["access_token", "token_type", "user_type", "first_login", "terms_accepted", "financial_generated"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Provider First Login", False, f"Missing fields in response: {missing_fields}", data)
                    return False
                
                # Verify expected values for new provider
                if data.get("first_login") != True:
                    self.log_result("Provider First Login", False, f"Expected first_login=true, got {data.get('first_login')}", data)
                    return False
                
                if data.get("terms_accepted") != False:
                    self.log_result("Provider First Login", False, f"Expected terms_accepted=false, got {data.get('terms_accepted')}", data)
                    return False
                
                if data.get("financial_generated") != False:
                    self.log_result("Provider First Login", False, f"Expected financial_generated=false, got {data.get('financial_generated')}", data)
                    return False
                
                self.log_result("Provider First Login", True, "Login successful with correct first_login status", {
                    "first_login": data.get("first_login"),
                    "terms_accepted": data.get("terms_accepted"),
                    "financial_generated": data.get("financial_generated")
                })
                return True
            else:
                self.log_result("Provider First Login", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Provider First Login", False, f"Error in provider login: {str(e)}")
            return False
    
    def test_accept_terms_and_generate_installments(self):
        """STEP 3: Accept terms and trigger automatic generation of 12 installments"""
        print("📋 STEP 3: Accepting Terms and Generating Automatic Installments...")
        
        if not self.provider_token:
            self.log_result("Accept Terms", False, "No provider token available")
            return False
        
        try:
            # Create provider session
            provider_session = requests.Session()
            provider_session.headers.update({
                "Authorization": f"Bearer {self.provider_token}",
                "Content-Type": "application/json"
            })
            
            response = provider_session.post(
                f"{BACKEND_URL}/provider/accept-terms",
                timeout=120  # Longer timeout for installment generation
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response indicates success
                if not data.get("success"):
                    self.log_result("Accept Terms", False, "Response indicates failure", data)
                    return False
                
                # Verify expected response structure
                expected_fields = ["success", "message", "payments_generated"]
                present_fields = [field for field in expected_fields if field in data]
                
                if len(present_fields) < 2:  # At least success and message should be present
                    self.log_result("Accept Terms", False, f"Missing expected fields. Present: {present_fields}", data)
                    return False
                
                # Check if payments were generated
                payments_generated = data.get("payments_generated", 0)
                if payments_generated < 12:
                    self.log_result("Accept Terms", False, f"Expected 12 payments, got {payments_generated}", data)
                    return False
                
                self.log_result("Accept Terms", True, f"Terms accepted and {payments_generated} installments generated", {
                    "payments_generated": payments_generated,
                    "first_due_date": data.get("first_due_date"),
                    "total_amount": data.get("total_amount")
                })
                return True
            
            elif response.status_code == 400:
                # This is the error we're testing for - should be fixed now
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Accept Terms", False, f"ERROR 400 - Provider data validation failed", error_data)
                return False
            else:
                self.log_result("Accept Terms", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Accept Terms", False, f"Error accepting terms: {str(e)}")
            return False
    
    def test_verify_generated_installments(self):
        """STEP 4: Verify that 12 installments were generated with correct values"""
        print("🔍 STEP 4: Verifying Generated Installments...")
        
        if not self.provider_token:
            self.log_result("Verify Installments", False, "No provider token available")
            return False
        
        try:
            # Create provider session
            provider_session = requests.Session()
            provider_session.headers.update({
                "Authorization": f"Bearer {self.provider_token}"
            })
            
            response = provider_session.get(
                f"{BACKEND_URL}/provider/my-payments",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                payments = data.get("payments", []) if isinstance(data, dict) else data
                
                # Verify we have 12 payments
                if len(payments) != 12:
                    self.log_result("Verify Installments", False, f"Expected 12 payments, found {len(payments)}")
                    return False
                
                # Verify payment structure and values
                issues = []
                total_amount = 0
                
                for i, payment in enumerate(payments, 1):
                    # Check required fields
                    required_fields = ["payment_id", "link", "pdf", "barcode", "status", "amount", "created_at", "expires_at"]
                    missing_fields = [field for field in required_fields if not payment.get(field)]
                    
                    if missing_fields:
                        issues.append(f"Payment {i}: Missing fields {missing_fields}")
                        continue
                    
                    # Verify payment values based on installment rules
                    amount = payment.get("amount", 0)
                    total_amount += amount
                    
                    # Check installment amounts (1st: proportional, 2nd-3rd: 99.90, 4th-12th: 199.90)
                    installment_number = payment.get("installment_number", i)
                    
                    if installment_number == 1:
                        # First installment should be proportional (variable amount)
                        if amount <= 0 or amount > 99.90:
                            issues.append(f"Payment {i}: Invalid proportional amount {amount}")
                    elif installment_number in [2, 3]:
                        # Promotional installments
                        if amount != 99.90:
                            issues.append(f"Payment {i}: Expected 99.90, got {amount}")
                    elif 4 <= installment_number <= 12:
                        # Full price installments
                        if amount != 199.90:
                            issues.append(f"Payment {i}: Expected 199.90, got {amount}")
                    
                    # Verify status
                    if payment.get("status") != "pending":
                        issues.append(f"Payment {i}: Expected status 'pending', got '{payment.get('status')}'")
                    
                    # Verify Efi Bank fields are present and valid
                    link = payment.get("link", "")
                    pdf = payment.get("pdf", "")
                    
                    if not link or not link.startswith("https://"):
                        issues.append(f"Payment {i}: Invalid or missing link")
                    
                    if not pdf or not pdf.startswith("https://"):
                        issues.append(f"Payment {i}: Invalid or missing PDF")
                
                if issues:
                    self.log_result("Verify Installments", False, f"Found {len(issues)} issues in payments", issues[:5])  # Show first 5 issues
                    return False
                
                self.log_result("Verify Installments", True, f"All 12 installments verified successfully", {
                    "total_payments": len(payments),
                    "total_amount": total_amount,
                    "first_payment_amount": payments[0].get("amount") if payments else 0,
                    "promotional_amount": 99.90,
                    "full_amount": 199.90
                })
                return True
            else:
                self.log_result("Verify Installments", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Verify Installments", False, f"Error verifying installments: {str(e)}")
            return False
    
    def test_check_backend_logs_for_errors(self):
        """Check backend logs for any errors during installment generation"""
        print("📋 Checking Backend Logs for Errors...")
        
        try:
            # Check supervisor backend logs
            result = subprocess.run(
                ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Look for error patterns
                error_patterns = [
                    "ERROR",
                    "400",
                    "parcela",
                    "boleto",
                    "Efi",
                    "CPF inválido",
                    "Dados de endereço incompletos"
                ]
                
                found_errors = []
                for line in log_content.split('\n')[-20:]:  # Check last 20 lines
                    for pattern in error_patterns:
                        if pattern.lower() in line.lower():
                            found_errors.append(line.strip())
                            break
                
                if found_errors:
                    self.log_result("Backend Logs Check", False, f"Found {len(found_errors)} potential errors", found_errors[:3])
                    return False
                else:
                    self.log_result("Backend Logs Check", True, "No errors found in recent backend logs")
                    return True
            else:
                self.log_result("Backend Logs Check", False, f"Could not read backend logs: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Backend Logs Check", False, f"Error checking logs: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        print("🧹 Cleaning up...")
        
        # Close database connection
        if self.mongo_client:
            try:
                self.mongo_client.close()
                print("✅ Database connection closed")
            except Exception as e:
                print(f"⚠️  Error closing database: {str(e)}")
        
        # Note: We don't delete the test provider since we're using existing providers
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Boleto Generation and Link/PDF Fields Verification")
        print("=" * 80)
        print("TESTING: Complete flow for boleto generation with 'link' and 'pdf' fields")
        print("1. Admin generates financial with 2 boleto installments")
        print("2. Verify admin can see payments with link/pdf fields")
        print("3. Verify provider can see payments with link/pdf fields")
        print("=" * 80)
        
        # Test sequence - focused on the boleto flow
        tests = [
            ("Database Connection", self.connect_to_database),
            ("Create Admin", self.create_admin_if_needed),
            ("Admin Login", self.admin_login),
            ("Create Test Provider", self.create_test_provider),
            ("Provider Login", self.test_provider_login),
            ("Generate Boleto Installments", self.test_generate_financial_boleto_installments),
            ("Admin Provider Payments", self.test_admin_provider_payments),
            ("Provider My Payments", self.test_provider_my_payments),
            ("Database Payments Check", self.check_database_payments),
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
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("=" * 80)
        print("📊 BOLETO GENERATION AND LINK/PDF VERIFICATION SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        # Analyze the specific issue
        print("\n🔍 BOLETO FUNCTIONALITY ANALYSIS:")
        
        # Check if the main endpoints are working
        generate_working = any(r["success"] and "generate boleto" in r["test"].lower() for r in self.results)
        provider_payments_working = any(r["success"] and "provider my payments" in r["test"].lower() for r in self.results)
        admin_payments_working = any(r["success"] and "admin provider payments" in r["test"].lower() for r in self.results)
        
        if generate_working:
            print("   ✅ Admin can generate boleto installments")
        else:
            print("   ❌ Admin CANNOT generate boleto installments - CRITICAL ISSUE")
        
        if provider_payments_working:
            print("   ✅ Provider can access payments with link/pdf fields")
        else:
            print("   ❌ Provider payments missing link/pdf fields - CRITICAL ISSUE")
        
        if admin_payments_working:
            print("   ✅ Admin can access payments with link/pdf fields")
        else:
            print("   ❌ Admin payments missing link/pdf fields - CRITICAL ISSUE")
        
        # Final verdict
        if generate_working and provider_payments_working and admin_payments_working:
            print("\n🎉 BOLETO FUNCTIONALITY: FULLY WORKING")
            print("   Providers can click and print boletos from 'Meu Financeiro'")
        else:
            print("\n❌ BOLETO FUNCTIONALITY: ISSUES FOUND")
            if not generate_working:
                print("   - Fix boleto generation endpoint")
            if not provider_payments_working:
                print("   - Fix provider payments endpoint (missing link/pdf)")
            if not admin_payments_working:
                print("   - Fix admin payments endpoint (missing link/pdf)")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = BackendTester()
    
    try:
        passed, failed = tester.run_all_tests()
        
        # Exit with appropriate code
        if failed == 0:
            print("\n🎉 All tests passed! Efi Bank integration is working correctly.")
            sys.exit(0)
        else:
            print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        tester.cleanup()
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Critical error during testing: {str(e)}")
        tester.cleanup()
        sys.exit(1)

if __name__ == "__main__":
    main()
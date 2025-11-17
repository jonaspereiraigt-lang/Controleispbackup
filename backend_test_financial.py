#!/usr/bin/env python3
"""
Backend Testing Script for Financial Generation Issue Investigation
Tests the specific issue where admin-generated financial records are not appearing
in provider's "Meu Financeiro" or admin's "Financeiro" tab
"""

import requests
import json
import sys
import time
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Configuration
BACKEND_URL = "https://copia-finalizada.emergent.host/api"
ADMIN_USERNAME = "master"
ADMIN_PASSWORD = "master123"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_db"

class FinancialTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.provider_token = None
        self.test_provider_id = None
        self.results = []
        self.mongo_client = None
        self.db = None
        self.generated_payment_id = None
        
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
    
    def connect_to_database(self):
        """Connect to MongoDB to check payments collection directly"""
        print("🗄️ Connecting to Database...")
        
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            # Test connection
            self.db.admin.command('ping')
            self.log_result("Database Connection", True, "Successfully connected to MongoDB")
            return True
        except Exception as e:
            self.log_result("Database Connection", False, f"Failed to connect to MongoDB: {str(e)}")
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
    
    def test_provider_login(self):
        """Test provider login"""
        print("🔑 Testing Provider Login...")
        
        if not self.test_provider_id:
            self.log_result("Provider Login", False, "No test provider ID available")
            return False
        
        try:
            # Get provider details first
            response = self.session.get(f"{BACKEND_URL}/admin/providers", timeout=30)
            if response.status_code != 200:
                self.log_result("Provider Login", False, "Failed to get provider details")
                return False
            
            providers = response.json()
            test_provider = None
            for provider in providers:
                if provider.get("id") == self.test_provider_id:
                    test_provider = provider
                    break
            
            if not test_provider:
                self.log_result("Provider Login", False, "Test provider not found")
                return False
            
            # Try to login as provider (assuming default password)
            login_response = self.session.post(
                f"{BACKEND_URL}/auth/provider/login",
                json={
                    "username": test_provider.get("email"),
                    "password": "123456"  # Default password
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
    
    def test_admin_generate_financial(self):
        """Test admin endpoint to generate financial for provider - MAIN TEST"""
        print("💰 Testing Admin Generate Financial (MAIN TEST)...")
        
        if not self.test_provider_id:
            self.log_result("Admin Generate Financial", False, "No test provider ID available")
            return False
        
        try:
            # Test both PIX and Boleto
            for payment_type in ["pix", "boleto"]:
                print(f"   Testing {payment_type.upper()}...")
                
                payment_data = {
                    "type": payment_type,
                    "amount": 199.00
                }
                
                response = self.session.post(
                    f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/generate-financial",
                    json=payment_data,
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    payment_info = data.get("payment", {})
                    
                    if payment_info.get("success"):
                        # Store the payment ID for later verification
                        if payment_type == "pix":
                            self.generated_payment_id = payment_info.get("charge_id")
                        
                        details = {
                            "type": payment_type,
                            "charge_id": payment_info.get("charge_id"),
                            "amount": payment_info.get("amount"),
                            "status": payment_info.get("status")
                        }
                        self.log_result(f"Admin Generate Financial ({payment_type.upper()})", True, f"{payment_type.upper()} generated successfully", details)
                    else:
                        self.log_result(f"Admin Generate Financial ({payment_type.upper()})", False, f"Failed to generate {payment_type}", payment_info)
                        return False
                else:
                    self.log_result(f"Admin Generate Financial ({payment_type.upper()})", False, f"HTTP {response.status_code}", response.text)
                    return False
            
            return True
                
        except Exception as e:
            self.log_result("Admin Generate Financial", False, f"Error generating financial: {str(e)}")
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
                payments = response.json()
                self.log_result("Provider My Payments", True, f"Endpoint working - Found {len(payments)} payments")
                
                # Check if our generated payment is in the list
                if self.generated_payment_id:
                    found_payment = False
                    for payment in payments:
                        if payment.get("payment_id") == self.generated_payment_id or payment.get("charge_id") == self.generated_payment_id:
                            found_payment = True
                            break
                    
                    if found_payment:
                        print("   ✅ Generated payment found in provider's payment list")
                    else:
                        print("   ❌ Generated payment NOT found in provider's payment list")
                        print(f"   Looking for payment_id: {self.generated_payment_id}")
                        print(f"   Found payments: {[p.get('payment_id', p.get('charge_id')) for p in payments]}")
                
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
                
                # Check if our generated payment is in the list
                if self.generated_payment_id:
                    found_payment = False
                    for payment in payments:
                        if payment.get("payment_id") == self.generated_payment_id or payment.get("charge_id") == self.generated_payment_id:
                            found_payment = True
                            break
                    
                    if found_payment:
                        print("   ✅ Generated payment found in admin's payment list")
                    else:
                        print("   ❌ Generated payment NOT found in admin's payment list")
                        print(f"   Looking for payment_id: {self.generated_payment_id}")
                        print(f"   Found payments: {[p.get('payment_id', p.get('charge_id')) for p in payments]}")
                
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
        
        if not self.db:
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
                
                if self.generated_payment_id:
                    matching_payments = list(payments_collection.find({
                        "$or": [
                            {"payment_id": self.generated_payment_id},
                            {"charge_id": self.generated_payment_id}
                        ]
                    }))
                    print(f"   Payments matching generated ID ({self.generated_payment_id}): {len(matching_payments)}")
            
            return True
                
        except Exception as e:
            self.log_result("Database Payments Check", False, f"Error checking database: {str(e)}")
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
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Financial Generation Issue Investigation")
        print("=" * 80)
        print("TESTING: Why admin-generated financial records don't appear in:")
        print("1. Provider's 'Meu Financeiro' button")
        print("2. Admin's 'Financeiro' tab")
        print("=" * 80)
        
        # Test sequence - focused on the specific issue
        tests = [
            ("Database Connection", self.connect_to_database),
            ("Admin Login", self.admin_login),
            ("Get Existing Providers", self.get_existing_providers),
            ("Provider Login", self.test_provider_login),
            ("Admin Generate Financial", self.test_admin_generate_financial),
            ("Provider My Payments", self.test_provider_my_payments),
            ("Admin Provider Payments", self.test_admin_provider_payments),
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
        print("📊 FINANCIAL GENERATION ISSUE INVESTIGATION SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        # Analyze the specific issue
        print("\n🔍 ISSUE ANALYSIS:")
        
        # Check if the main endpoints are working
        generate_working = any(r["success"] and "generate financial" in r["test"].lower() for r in self.results)
        provider_payments_working = any(r["success"] and "provider my payments" in r["test"].lower() for r in self.results)
        admin_payments_working = any(r["success"] and "admin provider payments" in r["test"].lower() for r in self.results)
        
        if generate_working:
            print("   ✅ Admin can generate financial records")
        else:
            print("   ❌ Admin CANNOT generate financial records - ROOT CAUSE")
        
        if provider_payments_working:
            print("   ✅ Provider payments endpoint is working")
        else:
            print("   ❌ Provider payments endpoint is BROKEN")
        
        if admin_payments_working:
            print("   ✅ Admin payments endpoint is working")
        else:
            print("   ❌ Admin payments endpoint is BROKEN")
        
        # Root cause analysis
        if generate_working and not (provider_payments_working and admin_payments_working):
            print("\n🎯 LIKELY ROOT CAUSE: Payment generation works but query endpoints are broken")
        elif not generate_working:
            print("\n🎯 LIKELY ROOT CAUSE: Payment generation is not working properly")
        elif generate_working and provider_payments_working and admin_payments_working:
            print("\n🎯 POSSIBLE CAUSE: Data mapping issue (provider_id mismatch or wrong collection)")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = FinancialTester()
    
    try:
        passed, failed = tester.run_all_tests()
        
        # Exit with appropriate code
        if failed == 0:
            print("\n🎉 All tests passed! Financial generation system is working correctly.")
            sys.exit(0)
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the analysis above for root cause.")
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
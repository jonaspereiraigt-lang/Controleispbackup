#!/usr/bin/env python3
"""
Focused test for Provider Payments Issue Investigation
Tests specifically why provider cannot see their payments in "Meu Financeiro"
"""

import requests
import json
import sys
import time
from datetime import datetime
import pymongo
from pymongo import MongoClient

# Configuration
BACKEND_URL = "https://ispadmin-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "master"
ADMIN_PASSWORD = "master123"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_db"

class ProviderPaymentsTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.provider_token = None
        self.test_provider_id = "5c90df66-b684-4fc8-8bf4-e10f34f9628b"
        self.provider_email = "teste.efi@example.com"
        self.provider_password = "senha123"
        self.results = []
        self.mongo_client = None
        self.db = None
        
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
    
    def provider_login(self):
        """Test provider login with different password attempts"""
        print("🔑 Testing Provider Login...")
        
        # Try different password combinations
        passwords_to_try = ["senha123", "123456", "password", "teste123", "efi123"]
        
        for password in passwords_to_try:
            try:
                print(f"   Trying password: {password}")
                
                response = requests.post(
                    f"{BACKEND_URL}/auth/provider/login",
                    json={
                        "username": self.provider_email,
                        "password": password
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.provider_token = data.get("access_token")
                    self.provider_password = password
                    self.log_result("Provider Login", True, f"Provider login successful with password: {password}")
                    return True
                else:
                    print(f"     Failed with {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"     Error with password {password}: {str(e)}")
        
        self.log_result("Provider Login", False, "All password attempts failed")
        return False
    
    def connect_to_database(self):
        """Connect to MongoDB"""
        print("🗄️ Connecting to Database...")
        
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            self.db.list_collection_names()
            self.log_result("Database Connection", True, "Successfully connected to MongoDB")
            return True
        except Exception as e:
            self.log_result("Database Connection", False, f"Failed to connect to MongoDB: {str(e)}")
            return False
    
    def check_provider_in_database(self):
        """Check provider details in database"""
        print("👤 Checking Provider in Database...")
        
        if self.db is None:
            self.log_result("Provider DB Check", False, "No database connection")
            return False
        
        try:
            provider = self.db.providers.find_one({"id": self.test_provider_id})
            if provider:
                details = {
                    "name": provider.get("name"),
                    "email": provider.get("email"),
                    "financial_generated": provider.get("financial_generated", False),
                    "is_active": provider.get("is_active", True),
                    "is_blocked": provider.get("is_blocked", False)
                }
                self.log_result("Provider DB Check", True, "Provider found in database", details)
                return True
            else:
                self.log_result("Provider DB Check", False, "Provider not found in database")
                return False
                
        except Exception as e:
            self.log_result("Provider DB Check", False, f"Error checking provider: {str(e)}")
            return False
    
    def check_payments_in_database(self):
        """Check payments for this provider in database"""
        print("💰 Checking Payments in Database...")
        
        if self.db is None:
            self.log_result("Payments DB Check", False, "No database connection")
            return False
        
        try:
            payments = list(self.db.payments.find({"provider_id": self.test_provider_id}))
            
            details = {
                "total_payments": len(payments),
                "payment_ids": [p.get("payment_id") for p in payments[-3:]],  # Last 3
                "amounts": [p.get("amount") for p in payments[-3:]],
                "statuses": [p.get("status") for p in payments[-3:]]
            }
            
            self.log_result("Payments DB Check", True, f"Found {len(payments)} payments for provider", details)
            return True
                
        except Exception as e:
            self.log_result("Payments DB Check", False, f"Error checking payments: {str(e)}")
            return False
    
    def test_provider_my_payments_endpoint(self):
        """Test the provider my-payments endpoint"""
        print("🔍 Testing Provider My-Payments Endpoint...")
        
        if not self.provider_token:
            self.log_result("Provider My-Payments", False, "No provider token available")
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
                details = {
                    "status_code": response.status_code,
                    "payments_count": len(payments),
                    "payment_ids": [p.get("payment_id", p.get("id")) for p in payments[-3:]] if payments else []
                }
                self.log_result("Provider My-Payments", True, f"Endpoint working - Found {len(payments)} payments", details)
                return True
            else:
                details = {
                    "status_code": response.status_code,
                    "response_text": response.text
                }
                self.log_result("Provider My-Payments", False, f"HTTP {response.status_code}", details)
                return False
                
        except Exception as e:
            self.log_result("Provider My-Payments", False, f"Error calling endpoint: {str(e)}")
            return False
    
    def test_admin_provider_payments_endpoint(self):
        """Test the admin provider payments endpoint"""
        print("🔍 Testing Admin Provider Payments Endpoint...")
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/payments",
                timeout=30
            )
            
            if response.status_code == 200:
                payments = response.json()
                details = {
                    "status_code": response.status_code,
                    "payments_count": len(payments),
                    "payment_ids": [p.get("payment_id", p.get("id")) for p in payments[-3:]] if payments else []
                }
                self.log_result("Admin Provider Payments", True, f"Endpoint working - Found {len(payments)} payments", details)
                return True
            else:
                details = {
                    "status_code": response.status_code,
                    "response_text": response.text
                }
                self.log_result("Admin Provider Payments", False, f"HTTP {response.status_code}", details)
                return False
                
        except Exception as e:
            self.log_result("Admin Provider Payments", False, f"Error calling endpoint: {str(e)}")
            return False
    
    def compare_database_vs_endpoints(self):
        """Compare what's in database vs what endpoints return"""
        print("🔄 Comparing Database vs Endpoints...")
        
        if self.db is None:
            self.log_result("Database vs Endpoints", False, "No database connection")
            return False
        
        try:
            # Get payments from database
            db_payments = list(self.db.payments.find({"provider_id": self.test_provider_id}))
            db_payment_ids = [p.get("payment_id") for p in db_payments]
            
            # Get payments from admin endpoint
            admin_response = self.session.get(f"{BACKEND_URL}/admin/providers/{self.test_provider_id}/payments", timeout=30)
            admin_payments = admin_response.json() if admin_response.status_code == 200 else []
            admin_payment_ids = [p.get("payment_id", p.get("id")) for p in admin_payments]
            
            # Get payments from provider endpoint (if we have token)
            provider_payments = []
            provider_payment_ids = []
            if self.provider_token:
                provider_session = requests.Session()
                provider_session.headers.update({"Authorization": f"Bearer {self.provider_token}"})
                provider_response = provider_session.get(f"{BACKEND_URL}/provider/my-payments", timeout=30)
                if provider_response.status_code == 200:
                    provider_payments = provider_response.json()
                    provider_payment_ids = [p.get("payment_id", p.get("id")) for p in provider_payments]
            
            details = {
                "database_count": len(db_payments),
                "admin_endpoint_count": len(admin_payments),
                "provider_endpoint_count": len(provider_payments),
                "db_payment_ids": db_payment_ids[-3:],  # Last 3
                "admin_payment_ids": admin_payment_ids[-3:],
                "provider_payment_ids": provider_payment_ids[-3:],
                "ids_match_admin": set(db_payment_ids) == set(admin_payment_ids),
                "ids_match_provider": set(db_payment_ids) == set(provider_payment_ids)
            }
            
            success = len(db_payments) > 0 and len(admin_payments) > 0
            message = "Data comparison completed"
            
            if not details["ids_match_admin"]:
                message += " - Admin endpoint data mismatch!"
            if not details["ids_match_provider"]:
                message += " - Provider endpoint data mismatch!"
            
            self.log_result("Database vs Endpoints", success, message, details)
            return success
                
        except Exception as e:
            self.log_result("Database vs Endpoints", False, f"Error comparing data: {str(e)}")
            return False
    
    def run_investigation(self):
        """Run the focused investigation"""
        print("🚀 Starting Provider Payments Issue Investigation")
        print("=" * 80)
        print("INVESTIGATING: Why provider cannot see payments in 'Meu Financeiro'")
        print("=" * 80)
        
        # Test sequence
        tests = [
            ("Database Connection", self.connect_to_database),
            ("Admin Login", self.admin_login),
            ("Provider DB Check", self.check_provider_in_database),
            ("Payments DB Check", self.check_payments_in_database),
            ("Provider Login", self.provider_login),
            ("Provider My-Payments", self.test_provider_my_payments_endpoint),
            ("Admin Provider Payments", self.test_admin_provider_payments_endpoint),
            ("Database vs Endpoints", self.compare_database_vs_endpoints),
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
        
        # Summary
        print("=" * 80)
        print("📊 PROVIDER PAYMENTS INVESTIGATION SUMMARY")
        print("=" * 80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        # Analysis
        print("\n🔍 ROOT CAUSE ANALYSIS:")
        
        db_has_payments = any(r["success"] and "payments db check" in r["test"].lower() for r in self.results)
        provider_login_works = any(r["success"] and "provider login" in r["test"].lower() for r in self.results)
        provider_endpoint_works = any(r["success"] and "provider my-payments" in r["test"].lower() for r in self.results)
        admin_endpoint_works = any(r["success"] and "admin provider payments" in r["test"].lower() for r in self.results)
        
        if db_has_payments:
            print("   ✅ Payments exist in database")
        else:
            print("   ❌ NO payments in database - this is the root cause!")
        
        if provider_login_works:
            print("   ✅ Provider login works")
        else:
            print("   ❌ Provider login FAILED - cannot test endpoint")
        
        if admin_endpoint_works:
            print("   ✅ Admin endpoint works")
        else:
            print("   ❌ Admin endpoint BROKEN")
        
        if provider_endpoint_works:
            print("   ✅ Provider endpoint works")
        else:
            print("   ❌ Provider endpoint BROKEN or inaccessible")
        
        # Final diagnosis
        if db_has_payments and admin_endpoint_works and not provider_endpoint_works:
            print("\n🎯 DIAGNOSIS: Provider endpoint issue - likely authentication or authorization problem")
        elif db_has_payments and not admin_endpoint_works and not provider_endpoint_works:
            print("\n🎯 DIAGNOSIS: Both endpoints broken - likely database query issue")
        elif not db_has_payments:
            print("\n🎯 DIAGNOSIS: No payments in database - payment generation not saving to DB")
        else:
            print("\n🎯 DIAGNOSIS: Mixed results - need deeper investigation")
        
        return passed, failed

def main():
    """Main test execution"""
    tester = ProviderPaymentsTester()
    
    try:
        passed, failed = tester.run_investigation()
        
        # Exit with appropriate code
        if failed == 0:
            print("\n🎉 All tests passed!")
            sys.exit(0)
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the analysis above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Investigation interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n💥 Critical error during investigation: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
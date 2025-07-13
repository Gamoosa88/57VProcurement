#!/usr/bin/env python3
"""
Focused Contracts Management Testing for 1957 Ventures Procurement Portal
Tests the newly implemented contracts management system as requested.
"""

import requests
import json
from pathlib import Path

# Load backend URL from frontend .env
def load_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"

BASE_URL = load_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"Testing contracts management at: {API_URL}")

class ContractsManagementTester:
    def __init__(self):
        self.demo_vendor_token = None
        self.admin_token = None
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status}: {test_name} - {details}"
        self.test_results.append(result)
        print(result)

    def setup_demo_tokens(self):
        """Setup demo tokens for testing"""
        print("\n=== Setting up Demo Tokens ===")
        
        # Setup demo vendor (vendor-001)
        demo_vendor_data = {
            "email": "vendor001@techcorp.sa",
            "password": "DemoVendor123!",
            "user_type": "vendor",
            "company_name": "TechCorp Solutions",
            "username": "vendor001"
        }
        
        try:
            # Try login first
            response = requests.post(f"{API_URL}/auth/login", json={
                "email": demo_vendor_data["email"],
                "password": demo_vendor_data["password"]
            })
            
            if response.status_code == 200:
                self.demo_vendor_token = response.json().get("token")
                self.log_result("Demo Vendor Login", True, "Successfully logged in")
            else:
                # Try signup if login fails
                response = requests.post(f"{API_URL}/auth/signup", json=demo_vendor_data)
                if response.status_code == 200:
                    self.demo_vendor_token = response.json().get("token")
                    self.log_result("Demo Vendor Creation", True, "Successfully created and logged in")
                else:
                    self.log_result("Demo Vendor Setup", False, f"Failed: {response.text}")
        except Exception as e:
            self.log_result("Demo Vendor Setup", False, f"Exception: {str(e)}")
        
        # Setup admin token
        admin_data = {
            "email": "admin@1957ventures.com",
            "password": "AdminPass123!"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/login", json=admin_data)
            if response.status_code == 200:
                self.admin_token = response.json().get("token")
                self.log_result("Admin Login", True, "Successfully logged in")
            else:
                # Try creating admin
                admin_signup = {
                    "email": "admin@1957ventures.com",
                    "password": "AdminPass123!",
                    "user_type": "admin",
                    "company_name": "1957 Ventures",
                    "username": "admin"
                }
                response = requests.post(f"{API_URL}/auth/signup", json=admin_signup)
                if response.status_code == 200:
                    self.admin_token = response.json().get("token")
                    self.log_result("Admin Creation", True, "Successfully created and logged in")
                else:
                    self.log_result("Admin Setup", False, f"Failed: {response.text}")
        except Exception as e:
            self.log_result("Admin Setup", False, f"Exception: {str(e)}")

    def test_contracts_endpoints(self):
        """Test all contracts management endpoints"""
        print("\n=== Testing Contracts Management Endpoints ===")
        
        # Test 1: GET /api/contracts with demo vendor token
        if self.demo_vendor_token:
            headers = {"Authorization": f"Bearer {self.demo_vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    # Check for vendor-001 contracts
                    vendor_contracts = [c for c in contracts if c.get("vendor_id") == "vendor-001"]
                    
                    if len(vendor_contracts) > 0:
                        self.log_result("GET /api/contracts (vendor)", True, 
                                      f"Retrieved {len(vendor_contracts)} contracts for vendor-001")
                        
                        # Test contract data structure
                        sample_contract = vendor_contracts[0]
                        required_fields = ["id", "rfp_title", "vendor_company", "contract_value", 
                                         "start_date", "end_date", "status", "progress"]
                        
                        missing_fields = [field for field in required_fields if field not in sample_contract]
                        
                        if not missing_fields:
                            self.log_result("Contract Data Structure", True, 
                                          "All required fields present")
                        else:
                            self.log_result("Contract Data Structure", False, 
                                          f"Missing fields: {missing_fields}")
                    else:
                        self.log_result("GET /api/contracts (vendor)", False, 
                                      "No contracts found for vendor-001")
                else:
                    self.log_result("GET /api/contracts (vendor)", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("GET /api/contracts (vendor)", False, f"Exception: {str(e)}")
        
        # Test 2: GET /api/contracts/{contract_id} for specific contract
        if self.demo_vendor_token:
            headers = {"Authorization": f"Bearer {self.demo_vendor_token}"}
            test_contract_id = "CTR-2025-001"  # From demo data
            
            try:
                response = requests.get(f"{API_URL}/contracts/{test_contract_id}", headers=headers)
                if response.status_code == 200:
                    contract = response.json()
                    
                    if (contract.get("id") == test_contract_id and 
                        contract.get("vendor_id") == "vendor-001"):
                        self.log_result("GET /api/contracts/{id} (specific)", True, 
                                      f"Contract {test_contract_id} retrieved successfully")
                        
                        # Check detailed fields
                        detailed_fields = ["milestones", "payment_status", "documents", "progress"]
                        present_fields = [field for field in detailed_fields if field in contract]
                        
                        if len(present_fields) == len(detailed_fields):
                            self.log_result("Contract Details Structure", True, 
                                          f"All detailed fields present: {present_fields}")
                        else:
                            missing = [f for f in detailed_fields if f not in contract]
                            self.log_result("Contract Details Structure", False, 
                                          f"Missing detailed fields: {missing}")
                    else:
                        self.log_result("GET /api/contracts/{id} (specific)", False, 
                                      "Wrong contract returned or access denied")
                elif response.status_code == 403:
                    self.log_result("GET /api/contracts/{id} (specific)", False, 
                                  "Access denied - vendor cannot access this contract")
                else:
                    self.log_result("GET /api/contracts/{id} (specific)", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("GET /api/contracts/{id} (specific)", False, f"Exception: {str(e)}")

    def test_access_control(self):
        """Test access control for contracts"""
        print("\n=== Testing Access Control ===")
        
        # Test vendor isolation - create another vendor and verify they can't see vendor-001's contracts
        other_vendor_data = {
            "email": "othervendor@example.com",
            "password": "OtherVendor123!",
            "user_type": "vendor",
            "company_name": "Other Vendor Corp",
            "username": "othervendor"
        }
        
        other_vendor_token = None
        try:
            response = requests.post(f"{API_URL}/auth/signup", json=other_vendor_data)
            if response.status_code == 200:
                other_vendor_token = response.json().get("token")
            else:
                # Try login if signup fails
                response = requests.post(f"{API_URL}/auth/login", json={
                    "email": other_vendor_data["email"],
                    "password": other_vendor_data["password"]
                })
                if response.status_code == 200:
                    other_vendor_token = response.json().get("token")
        except:
            pass
        
        if other_vendor_token:
            headers = {"Authorization": f"Bearer {other_vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    # This vendor should not see vendor-001's contracts
                    vendor_001_contracts = [c for c in contracts if c.get("vendor_id") == "vendor-001"]
                    
                    if len(vendor_001_contracts) == 0:
                        self.log_result("Vendor Access Control", True, 
                                      "Vendor correctly cannot see other vendor's contracts")
                    else:
                        self.log_result("Vendor Access Control", False, 
                                      f"Vendor can see {len(vendor_001_contracts)} contracts from other vendor")
                else:
                    self.log_result("Vendor Access Control", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Vendor Access Control", False, f"Exception: {str(e)}")
        
        # Test admin can see all contracts
        if self.admin_token:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    if len(contracts) > 0:
                        self.log_result("Admin Access Control", True, 
                                      f"Admin can see {len(contracts)} total contracts")
                    else:
                        self.log_result("Admin Access Control", False, 
                                      "Admin cannot see any contracts")
                else:
                    self.log_result("Admin Access Control", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Admin Access Control", False, f"Exception: {str(e)}")

    def test_demo_contracts_creation(self):
        """Test demo contracts creation and data structure"""
        print("\n=== Testing Demo Contracts Creation ===")
        
        if self.admin_token:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    # Check for expected demo contracts
                    expected_contract_ids = ["CTR-2025-001", "CTR-2024-018", "CTR-2024-012"]
                    found_contracts = [c.get("id") for c in contracts if c.get("id") in expected_contract_ids]
                    
                    if len(found_contracts) >= 3:
                        self.log_result("Demo Contracts Creation", True, 
                                      f"Found {len(found_contracts)} demo contracts: {found_contracts}")
                        
                        # Test data structure of demo contracts
                        demo_contract = next((c for c in contracts if c.get("id") == "CTR-2025-001"), None)
                        if demo_contract:
                            # Verify expected data
                            expected_data = {
                                "vendor_company": "TechCorp Solutions",
                                "contract_value": 750000.0,
                                "status": "active",
                                "vendor_id": "vendor-001"
                            }
                            
                            data_matches = all(demo_contract.get(key) == value for key, value in expected_data.items())
                            
                            if data_matches:
                                self.log_result("Demo Contract Data Validation", True, 
                                              "Demo contract data matches expected structure")
                            else:
                                self.log_result("Demo Contract Data Validation", False, 
                                              "Demo contract data doesn't match expected structure")
                    else:
                        self.log_result("Demo Contracts Creation", False, 
                                      f"Only found {len(found_contracts)} demo contracts: {found_contracts}")
                else:
                    self.log_result("Demo Contracts Creation", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("Demo Contracts Creation", False, f"Exception: {str(e)}")

    def test_document_download(self):
        """Test document download endpoint"""
        print("\n=== Testing Document Download ===")
        
        if self.demo_vendor_token:
            headers = {"Authorization": f"Bearer {self.demo_vendor_token}"}
            test_contract_id = "CTR-2025-001"
            
            # First get the contract to find a document ID
            try:
                response = requests.get(f"{API_URL}/contracts/{test_contract_id}", headers=headers)
                if response.status_code == 200:
                    contract = response.json()
                    documents = contract.get("documents", [])
                    
                    if documents:
                        doc_id = documents[0].get("id")
                        if doc_id:
                            # Test document download
                            doc_response = requests.get(f"{API_URL}/contracts/{test_contract_id}/documents/{doc_id}", 
                                                      headers=headers)
                            if doc_response.status_code == 200:
                                doc_data = doc_response.json()
                                if doc_data.get("id") == doc_id:
                                    self.log_result("Document Download Endpoint", True, 
                                                  f"Document '{doc_data.get('name')}' downloaded successfully")
                                else:
                                    self.log_result("Document Download Endpoint", False, 
                                                  "Wrong document returned")
                            else:
                                self.log_result("Document Download Endpoint", False, 
                                              f"Status: {doc_response.status_code}")
                        else:
                            self.log_result("Document Download Endpoint", False, 
                                          "No document ID found")
                    else:
                        self.log_result("Document Download Endpoint", False, 
                                      "No documents found in contract")
                else:
                    self.log_result("Document Download Endpoint", False, 
                                  f"Cannot access contract: {response.status_code}")
            except Exception as e:
                self.log_result("Document Download Endpoint", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all contracts management tests"""
        print("🚀 Starting Contracts Management Testing")
        print("=" * 60)
        
        self.setup_demo_tokens()
        self.test_contracts_endpoints()
        self.test_access_control()
        self.test_demo_contracts_creation()
        self.test_document_download()
        
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 CONTRACTS MANAGEMENT TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result)
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result)
        
        for result in self.test_results:
            print(result)
        
        print("\n" + "=" * 60)
        overall_status = "✅ SUCCESS" if failed == 0 else f"❌ {failed} FAILURES"
        print(f"OVERALL RESULT: {passed} passed, {failed} failed - {overall_status}")
        
        if failed == 0:
            print("🎉 Contracts management system is working correctly!")
        else:
            print("⚠️  Some issues found that need attention.")
        
        print("=" * 60)

if __name__ == "__main__":
    tester = ContractsManagementTester()
    tester.run_all_tests()
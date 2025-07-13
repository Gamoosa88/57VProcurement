#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for 1957 Ventures Procurement Portal
Tests all major backend functionality including authentication, RFP management, 
proposal submission, and AI-powered evaluation system.
"""

import requests
import json
import base64
import io
from datetime import datetime, timedelta
import os
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

print(f"Testing backend at: {API_URL}")

class ProcurementPortalTester:
    def __init__(self):
        self.admin_token = None
        self.vendor_token = None
        self.admin_user_id = None
        self.vendor_user_id = None
        self.rfp_id = None
        self.proposal_id = None
        self.test_results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "rfp_management": {"passed": 0, "failed": 0, "details": []},
            "proposal_system": {"passed": 0, "failed": 0, "details": []},
            "ai_evaluation": {"passed": 0, "failed": 0, "details": []},
            "dashboard": {"passed": 0, "failed": 0, "details": []},
            "contracts": {"passed": 0, "failed": 0, "details": []}
        }

    def log_result(self, category, test_name, success, details=""):
        """Log test results"""
        if success:
            self.test_results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]["failed"] += 1
            status = "❌ FAIL"
        
        self.test_results[category]["details"].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")

    def create_mock_file_content(self, filename, content):
        """Create mock file content for testing"""
        return io.BytesIO(content.encode('utf-8'))

    def test_authentication_system(self):
        """Test user authentication endpoints"""
        print("\n=== Testing Authentication System ===")
        
        # Test 1: Admin Signup
        admin_data = {
            "email": "sarah.johnson@1957ventures.com",
            "password": "SecureAdmin123!",
            "user_type": "admin",
            "company_name": "1957 Ventures",
            "username": "sarah.johnson"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/signup", json=admin_data)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                self.admin_user_id = data.get("user", {}).get("id")
                self.log_result("authentication", "Admin Signup", True, 
                              f"Admin user created successfully with ID: {self.admin_user_id}")
            else:
                self.log_result("authentication", "Admin Signup", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Admin Signup", False, f"Exception: {str(e)}")

        # Test 2: Vendor Signup
        vendor_data = {
            "email": "ahmed.alfarisi@techsolutions.sa",
            "password": "VendorPass456!",
            "user_type": "vendor",
            "company_name": "TechSolutions Saudi Arabia",
            "username": "ahmed.alfarisi",
            "cr_number": "1010123456",
            "country": "Saudi Arabia"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/signup", json=vendor_data)
            if response.status_code == 200:
                data = response.json()
                self.vendor_token = data.get("token")
                self.vendor_user_id = data.get("user", {}).get("id")
                self.log_result("authentication", "Vendor Signup", True, 
                              f"Vendor user created successfully with ID: {self.vendor_user_id}")
            else:
                self.log_result("authentication", "Vendor Signup", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Vendor Signup", False, f"Exception: {str(e)}")

        # Test 3: Admin Login
        admin_login = {
            "email": "sarah.johnson@1957ventures.com",
            "password": "SecureAdmin123!"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/login", json=admin_login)
            if response.status_code == 200:
                data = response.json()
                if data.get("token"):
                    self.admin_token = data.get("token")
                    self.admin_user_id = data.get("user", {}).get("id")
                    self.log_result("authentication", "Admin Login", True, "Login successful with valid token")
                else:
                    self.log_result("authentication", "Admin Login", False, "No token in response")
            else:
                self.log_result("authentication", "Admin Login", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Admin Login", False, f"Exception: {str(e)}")

        # Test 4: Vendor Login
        vendor_login = {
            "email": "ahmed.alfarisi@techsolutions.sa",
            "password": "VendorPass456!"
        }
        
        try:
            response = requests.post(f"{API_URL}/auth/login", json=vendor_login)
            if response.status_code == 200:
                data = response.json()
                if data.get("token"):
                    self.vendor_token = data.get("token")
                    self.vendor_user_id = data.get("user", {}).get("id")
                    self.log_result("authentication", "Vendor Login", True, "Login successful with valid token")
                else:
                    self.log_result("authentication", "Vendor Login", False, "No token in response")
            else:
                self.log_result("authentication", "Vendor Login", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Vendor Login", False, f"Exception: {str(e)}")

        # Test 5: Get Current User (Admin)
        if self.admin_token:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/auth/me", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("user_type") == "admin":
                        self.log_result("authentication", "Admin Auth Verification", True, 
                                      f"User type verified: {data.get('user_type')}")
                    else:
                        self.log_result("authentication", "Admin Auth Verification", False, 
                                      f"Wrong user type: {data.get('user_type')}")
                else:
                    self.log_result("authentication", "Admin Auth Verification", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("authentication", "Admin Auth Verification", False, f"Exception: {str(e)}")

        # Test 6: Get Current User (Vendor)
        if self.vendor_token:
            headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/auth/me", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("user_type") == "vendor":
                        self.log_result("authentication", "Vendor Auth Verification", True, 
                                      f"User type verified: {data.get('user_type')}")
                    else:
                        self.log_result("authentication", "Vendor Auth Verification", False, 
                                      f"Wrong user type: {data.get('user_type')}")
                else:
                    self.log_result("authentication", "Vendor Auth Verification", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("authentication", "Vendor Auth Verification", False, f"Exception: {str(e)}")

    def test_rfp_management(self):
        """Test RFP management endpoints"""
        print("\n=== Testing RFP Management System ===")
        
        if not self.admin_token:
            self.log_result("rfp_management", "RFP Creation", False, "No admin token available")
            return

        # Test 1: Create RFP (Admin only)
        rfp_data = {
            "title": "Enterprise Cloud Infrastructure Modernization",
            "description": "Comprehensive cloud migration and infrastructure modernization project for 1957 Ventures portfolio companies. Includes AWS/Azure setup, security implementation, and DevOps automation.",
            "budget": 750000.0,
            "deadline": (datetime.now() + timedelta(days=45)).isoformat(),
            "categories": ["Cloud Infrastructure", "DevOps", "Security", "Migration"],
            "scope_of_work": "Phase 1: Assessment and planning (2 weeks)\nPhase 2: Infrastructure setup (4 weeks)\nPhase 3: Migration execution (3 weeks)\nPhase 4: Testing and optimization (2 weeks)\nPhase 5: Documentation and handover (1 week)"
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        try:
            response = requests.post(f"{API_URL}/rfps", json=rfp_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.rfp_id = data.get("id")
                approval_level = data.get("approval_level")
                self.log_result("rfp_management", "RFP Creation", True, 
                              f"RFP created with ID: {self.rfp_id}, Approval level: {approval_level}")
            else:
                self.log_result("rfp_management", "RFP Creation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("rfp_management", "RFP Creation", False, f"Exception: {str(e)}")

        # Test 2: Get RFPs (Admin view)
        try:
            response = requests.get(f"{API_URL}/rfps", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("rfp_management", "Admin RFP Listing", True, 
                                  f"Retrieved {len(data)} RFPs")
                else:
                    self.log_result("rfp_management", "Admin RFP Listing", False, "No RFPs returned")
            else:
                self.log_result("rfp_management", "Admin RFP Listing", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("rfp_management", "Admin RFP Listing", False, f"Exception: {str(e)}")

        # Test 3: Get RFPs (Vendor view)
        if self.vendor_token:
            vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/rfps", headers=vendor_headers)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        active_rfps = [rfp for rfp in data if rfp.get("status") == "active"]
                        self.log_result("rfp_management", "Vendor RFP Listing", True, 
                                      f"Retrieved {len(active_rfps)} active RFPs")
                    else:
                        self.log_result("rfp_management", "Vendor RFP Listing", False, "Invalid response format")
                else:
                    self.log_result("rfp_management", "Vendor RFP Listing", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("rfp_management", "Vendor RFP Listing", False, f"Exception: {str(e)}")

        # Test 4: Get specific RFP
        if self.rfp_id:
            try:
                response = requests.get(f"{API_URL}/rfps/{self.rfp_id}", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") == self.rfp_id:
                        self.log_result("rfp_management", "RFP Details Retrieval", True, 
                                      f"RFP details retrieved successfully")
                    else:
                        self.log_result("rfp_management", "RFP Details Retrieval", False, "Wrong RFP returned")
                else:
                    self.log_result("rfp_management", "RFP Details Retrieval", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("rfp_management", "RFP Details Retrieval", False, f"Exception: {str(e)}")

        # Test 5: Vendor cannot create RFP
        if self.vendor_token:
            vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.post(f"{API_URL}/rfps", json=rfp_data, headers=vendor_headers)
                if response.status_code == 403:
                    self.log_result("rfp_management", "Vendor RFP Creation Restriction", True, 
                                  "Correctly blocked vendor from creating RFP")
                else:
                    self.log_result("rfp_management", "Vendor RFP Creation Restriction", False, 
                                  f"Vendor was able to create RFP (Status: {response.status_code})")
            except Exception as e:
                self.log_result("rfp_management", "Vendor RFP Creation Restriction", False, f"Exception: {str(e)}")

    def test_proposal_system(self):
        """Test proposal submission and management"""
        print("\n=== Testing Proposal Submission System ===")
        
        if not self.vendor_token or not self.rfp_id:
            self.log_result("proposal_system", "Proposal Submission", False, 
                          "Missing vendor token or RFP ID")
            return

        # Test 1: Submit Proposal with file uploads
        vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
        
        # Create mock technical document
        technical_content = """
        TECHNICAL PROPOSAL - Enterprise Cloud Infrastructure Modernization
        
        Company: TechSolutions Saudi Arabia
        Project: Cloud Infrastructure Modernization
        
        1. TECHNICAL APPROACH
        - AWS-first strategy with multi-region deployment
        - Infrastructure as Code using Terraform
        - Containerization with Kubernetes
        - CI/CD pipeline with GitLab
        
        2. ARCHITECTURE OVERVIEW
        - Microservices architecture
        - Auto-scaling groups
        - Load balancers and CDN
        - Database clustering
        
        3. SECURITY MEASURES
        - Zero-trust network architecture
        - End-to-end encryption
        - IAM and RBAC implementation
        - Compliance with SAMA regulations
        
        4. TIMELINE
        - Week 1-2: Infrastructure assessment
        - Week 3-6: Core infrastructure setup
        - Week 7-9: Application migration
        - Week 10-11: Testing and optimization
        - Week 12: Go-live and handover
        """
        
        # Create mock commercial document
        commercial_content = """
        COMMERCIAL PROPOSAL - Enterprise Cloud Infrastructure Modernization
        
        Company: TechSolutions Saudi Arabia
        Total Project Value: 680,000 SAR
        
        1. COST BREAKDOWN
        - Infrastructure Setup: 250,000 SAR
        - Migration Services: 200,000 SAR
        - Security Implementation: 150,000 SAR
        - Testing & Optimization: 80,000 SAR
        
        2. PAYMENT TERMS
        - 30% upon contract signing
        - 40% upon infrastructure completion
        - 20% upon successful migration
        - 10% upon final acceptance
        
        3. WARRANTY & SUPPORT
        - 12 months warranty
        - 24/7 support for first 6 months
        - Knowledge transfer included
        
        4. ADDITIONAL BENEFITS
        - 15% cost savings compared to competitors
        - Local Saudi team for ongoing support
        - Compliance with Vision 2030 objectives
        """
        
        # Prepare files for upload
        files = {
            'technical_file': ('technical_proposal.txt', technical_content, 'text/plain'),
            'commercial_file': ('commercial_proposal.txt', commercial_content, 'text/plain')
        }
        
        data = {'rfp_id': self.rfp_id}
        
        try:
            response = requests.post(f"{API_URL}/proposals", 
                                   data=data, files=files, headers=vendor_headers)
            if response.status_code == 200:
                result = response.json()
                self.proposal_id = result.get("proposal_id")
                self.log_result("proposal_system", "Proposal Submission", True, 
                              f"Proposal submitted successfully with ID: {self.proposal_id}")
            else:
                self.log_result("proposal_system", "Proposal Submission", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("proposal_system", "Proposal Submission", False, f"Exception: {str(e)}")

        # Test 2: Get Proposals (Vendor view)
        try:
            response = requests.get(f"{API_URL}/proposals", headers=vendor_headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    vendor_proposals = [p for p in data if p.get("vendor_id") == self.vendor_user_id]
                    self.log_result("proposal_system", "Vendor Proposal Listing", True, 
                                  f"Retrieved {len(vendor_proposals)} vendor proposals")
                else:
                    self.log_result("proposal_system", "Vendor Proposal Listing", False, "No proposals returned")
            else:
                self.log_result("proposal_system", "Vendor Proposal Listing", False, 
                              f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("proposal_system", "Vendor Proposal Listing", False, f"Exception: {str(e)}")

        # Test 3: Get Proposals (Admin view)
        if self.admin_token:
            admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/proposals", headers=admin_headers)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_result("proposal_system", "Admin Proposal Listing", True, 
                                      f"Retrieved {len(data)} total proposals")
                    else:
                        self.log_result("proposal_system", "Admin Proposal Listing", False, "Invalid response format")
                else:
                    self.log_result("proposal_system", "Admin Proposal Listing", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("proposal_system", "Admin Proposal Listing", False, f"Exception: {str(e)}")

        # Test 4: Get specific proposal
        if self.proposal_id:
            try:
                response = requests.get(f"{API_URL}/proposals/{self.proposal_id}", headers=vendor_headers)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") == self.proposal_id:
                        self.log_result("proposal_system", "Proposal Details Retrieval", True, 
                                      "Proposal details retrieved successfully")
                    else:
                        self.log_result("proposal_system", "Proposal Details Retrieval", False, "Wrong proposal returned")
                else:
                    self.log_result("proposal_system", "Proposal Details Retrieval", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("proposal_system", "Proposal Details Retrieval", False, f"Exception: {str(e)}")

    def test_ai_evaluation_system(self):
        """Test AI-powered proposal evaluation"""
        print("\n=== Testing AI-Powered Proposal Evaluation ===")
        
        if not self.admin_token or not self.proposal_id:
            self.log_result("ai_evaluation", "AI Evaluation", False, 
                          "Missing admin token or proposal ID")
            return

        # Test 1: AI Evaluation (Admin only)
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.post(f"{API_URL}/proposals/{self.proposal_id}/evaluate", 
                                   headers=admin_headers)
            if response.status_code == 200:
                data = response.json()
                evaluation = data.get("evaluation", {})
                
                # Check if evaluation contains required fields
                required_fields = ["commercial_score", "technical_score", "overall_score", 
                                 "strengths", "weaknesses", "recommendation", "detailed_analysis"]
                
                missing_fields = [field for field in required_fields if field not in evaluation]
                
                if not missing_fields:
                    commercial_score = evaluation.get("commercial_score", 0)
                    technical_score = evaluation.get("technical_score", 0)
                    overall_score = evaluation.get("overall_score", 0)
                    
                    self.log_result("ai_evaluation", "AI Evaluation", True, 
                                  f"Evaluation completed - Commercial: {commercial_score}, Technical: {technical_score}, Overall: {overall_score}")
                    
                    # Verify weighted scoring (70% commercial, 30% technical)
                    expected_score = (commercial_score * 0.7) + (technical_score * 0.3)
                    score_diff = abs(overall_score - expected_score)
                    
                    if score_diff < 1.0:  # Allow small rounding differences
                        self.log_result("ai_evaluation", "Weighted Scoring Verification", True, 
                                      f"Correct weighted scoring applied")
                    else:
                        self.log_result("ai_evaluation", "Weighted Scoring Verification", False, 
                                      f"Incorrect weighted scoring - Expected: {expected_score}, Got: {overall_score}")
                else:
                    self.log_result("ai_evaluation", "AI Evaluation", False, 
                                  f"Missing evaluation fields: {missing_fields}")
            else:
                self.log_result("ai_evaluation", "AI Evaluation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("ai_evaluation", "AI Evaluation", False, f"Exception: {str(e)}")

        # Test 2: Vendor cannot evaluate proposals
        if self.vendor_token:
            vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.post(f"{API_URL}/proposals/{self.proposal_id}/evaluate", 
                                       headers=vendor_headers)
                if response.status_code == 403:
                    self.log_result("ai_evaluation", "Vendor Evaluation Restriction", True, 
                                  "Correctly blocked vendor from evaluating proposals")
                else:
                    self.log_result("ai_evaluation", "Vendor Evaluation Restriction", False, 
                                  f"Vendor was able to evaluate proposal (Status: {response.status_code})")
            except Exception as e:
                self.log_result("ai_evaluation", "Vendor Evaluation Restriction", False, f"Exception: {str(e)}")

    def test_contracts_management(self):
        """Test contracts management endpoints"""
        print("\n=== Testing Contracts Management System ===")
        
        # Test 1: Create demo token for vendor-001 (as mentioned in review request)
        demo_vendor_token = None
        demo_admin_token = None
        
        # First, let's try to create or login as the demo vendor (vendor-001)
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
                demo_vendor_token = response.json().get("token")
                self.log_result("contracts", "Demo Vendor Login", True, "Demo vendor logged in successfully")
            else:
                # Try signup if login fails
                response = requests.post(f"{API_URL}/auth/signup", json=demo_vendor_data)
                if response.status_code == 200:
                    demo_vendor_token = response.json().get("token")
                    self.log_result("contracts", "Demo Vendor Creation", True, "Demo vendor created successfully")
                else:
                    self.log_result("contracts", "Demo Vendor Setup", False, f"Failed to setup demo vendor: {response.text}")
        except Exception as e:
            self.log_result("contracts", "Demo Vendor Setup", False, f"Exception: {str(e)}")
        
        # Test 2: Get contracts with demo vendor token
        if demo_vendor_token:
            headers = {"Authorization": f"Bearer {demo_vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    # Check if we have demo contracts for vendor-001
                    vendor_contracts = [c for c in contracts if c.get("vendor_id") == "vendor-001"]
                    
                    if len(vendor_contracts) > 0:
                        self.log_result("contracts", "Demo Contracts Retrieval", True, 
                                      f"Retrieved {len(vendor_contracts)} contracts for vendor-001")
                        
                        # Test contract data structure
                        sample_contract = vendor_contracts[0]
                        required_fields = ["id", "rfp_title", "vendor_company", "contract_value", 
                                         "start_date", "end_date", "status", "progress", "milestones"]
                        
                        missing_fields = [field for field in required_fields if field not in sample_contract]
                        
                        if not missing_fields:
                            self.log_result("contracts", "Contract Data Structure", True, 
                                          f"All required fields present in contract data")
                        else:
                            self.log_result("contracts", "Contract Data Structure", False, 
                                          f"Missing fields: {missing_fields}")
                    else:
                        self.log_result("contracts", "Demo Contracts Retrieval", False, 
                                      "No contracts found for vendor-001")
                else:
                    self.log_result("contracts", "Demo Contracts Retrieval", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("contracts", "Demo Contracts Retrieval", False, f"Exception: {str(e)}")
        
        # Test 3: Get specific contract details
        if demo_vendor_token:
            headers = {"Authorization": f"Bearer {demo_vendor_token}"}
            test_contract_id = "CTR-2025-001"  # From demo data
            
            try:
                response = requests.get(f"{API_URL}/contracts/{test_contract_id}", headers=headers)
                if response.status_code == 200:
                    contract = response.json()
                    
                    # Verify contract details
                    if (contract.get("id") == test_contract_id and 
                        contract.get("vendor_id") == "vendor-001"):
                        self.log_result("contracts", "Specific Contract Retrieval", True, 
                                      f"Contract {test_contract_id} retrieved successfully")
                        
                        # Test contract details structure
                        expected_fields = ["rfp_title", "contract_value", "progress", "milestones", 
                                         "payment_status", "documents"]
                        
                        present_fields = [field for field in expected_fields if field in contract]
                        
                        if len(present_fields) == len(expected_fields):
                            self.log_result("contracts", "Contract Details Structure", True, 
                                          f"All expected fields present: {present_fields}")
                        else:
                            missing = [f for f in expected_fields if f not in contract]
                            self.log_result("contracts", "Contract Details Structure", False, 
                                          f"Missing fields: {missing}")
                    else:
                        self.log_result("contracts", "Specific Contract Retrieval", False, 
                                      "Wrong contract returned or access denied")
                elif response.status_code == 403:
                    self.log_result("contracts", "Specific Contract Retrieval", False, 
                                  "Access denied - vendor cannot access this contract")
                else:
                    self.log_result("contracts", "Specific Contract Retrieval", False, 
                                  f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_result("contracts", "Specific Contract Retrieval", False, f"Exception: {str(e)}")
        
        # Test 4: Access control - try to access contracts with different vendor
        if self.vendor_token:  # Use the regular vendor token from earlier tests
            headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    # This vendor should not see vendor-001's contracts
                    vendor_001_contracts = [c for c in contracts if c.get("vendor_id") == "vendor-001"]
                    
                    if len(vendor_001_contracts) == 0:
                        self.log_result("contracts", "Access Control - Vendor Isolation", True, 
                                      "Vendor correctly cannot see other vendor's contracts")
                    else:
                        self.log_result("contracts", "Access Control - Vendor Isolation", False, 
                                      f"Vendor can see {len(vendor_001_contracts)} contracts from other vendor")
                else:
                    self.log_result("contracts", "Access Control - Vendor Isolation", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("contracts", "Access Control - Vendor Isolation", False, f"Exception: {str(e)}")
        
        # Test 5: Admin can see all contracts
        if self.admin_token:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/contracts", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    contracts = data.get("contracts", [])
                    
                    if len(contracts) > 0:
                        self.log_result("contracts", "Admin Access - All Contracts", True, 
                                      f"Admin can see {len(contracts)} total contracts")
                    else:
                        self.log_result("contracts", "Admin Access - All Contracts", False, 
                                      "Admin cannot see any contracts")
                else:
                    self.log_result("contracts", "Admin Access - All Contracts", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("contracts", "Admin Access - All Contracts", False, f"Exception: {str(e)}")
        
        # Test 6: Document download endpoint
        if demo_vendor_token:
            headers = {"Authorization": f"Bearer {demo_vendor_token}"}
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
                                    self.log_result("contracts", "Document Download", True, 
                                                  f"Document {doc_data.get('name')} downloaded successfully")
                                else:
                                    self.log_result("contracts", "Document Download", False, 
                                                  "Wrong document returned")
                            else:
                                self.log_result("contracts", "Document Download", False, 
                                              f"Status: {doc_response.status_code}")
                        else:
                            self.log_result("contracts", "Document Download", False, 
                                          "No document ID found")
                    else:
                        self.log_result("contracts", "Document Download", False, 
                                      "No documents found in contract")
            except Exception as e:
                self.log_result("contracts", "Document Download", False, f"Exception: {str(e)}")
        
        # Test 7: Test demo contracts creation (verify startup data)
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
                        self.log_result("contracts", "Demo Contracts Creation", True, 
                                      f"Found {len(found_contracts)} demo contracts: {found_contracts}")
                    else:
                        self.log_result("contracts", "Demo Contracts Creation", False, 
                                      f"Only found {len(found_contracts)} demo contracts: {found_contracts}")
                else:
                    self.log_result("contracts", "Demo Contracts Creation", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("contracts", "Demo Contracts Creation", False, f"Exception: {str(e)}")

    def test_dashboard_statistics(self):
        """Test dashboard statistics endpoints"""
        print("\n=== Testing Dashboard Statistics ===")
        
        # Test 1: Admin Dashboard Stats
        if self.admin_token:
            admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
            try:
                response = requests.get(f"{API_URL}/dashboard/stats", headers=admin_headers)
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["total_rfps", "total_proposals", "pending_vendors"]
                    
                    if all(field in data for field in required_fields):
                        self.log_result("dashboard", "Admin Dashboard Stats", True, 
                                      f"RFPs: {data['total_rfps']}, Proposals: {data['total_proposals']}, Pending Vendors: {data['pending_vendors']}")
                    else:
                        missing = [f for f in required_fields if f not in data]
                        self.log_result("dashboard", "Admin Dashboard Stats", False, 
                                      f"Missing fields: {missing}")
                else:
                    self.log_result("dashboard", "Admin Dashboard Stats", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("dashboard", "Admin Dashboard Stats", False, f"Exception: {str(e)}")

        # Test 2: Vendor Dashboard Stats
        if self.vendor_token:
            vendor_headers = {"Authorization": f"Bearer {self.vendor_token}"}
            try:
                response = requests.get(f"{API_URL}/dashboard/stats", headers=vendor_headers)
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["total_proposals", "awarded_contracts", "active_rfps"]
                    
                    if all(field in data for field in required_fields):
                        self.log_result("dashboard", "Vendor Dashboard Stats", True, 
                                      f"Proposals: {data['total_proposals']}, Awarded: {data['awarded_contracts']}, Active RFPs: {data['active_rfps']}")
                    else:
                        missing = [f for f in required_fields if f not in data]
                        self.log_result("dashboard", "Vendor Dashboard Stats", False, 
                                      f"Missing fields: {missing}")
                else:
                    self.log_result("dashboard", "Vendor Dashboard Stats", False, 
                                  f"Status: {response.status_code}")
            except Exception as e:
                self.log_result("dashboard", "Vendor Dashboard Stats", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Backend Testing for 1957 Ventures Procurement Portal")
        print("=" * 80)
        
        self.test_authentication_system()
        self.test_rfp_management()
        self.test_proposal_system()
        self.test_ai_evaluation_system()
        self.test_contracts_management()
        self.test_dashboard_statistics()
        
        self.print_summary()

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ ALL PASS" if failed == 0 else f"❌ {failed} FAILED"
            print(f"\n{category.upper().replace('_', ' ')}: {passed} passed, {failed} failed - {status}")
            
            for detail in results["details"]:
                print(f"  {detail}")
        
        print("\n" + "=" * 80)
        overall_status = "✅ SUCCESS" if total_failed == 0 else f"❌ {total_failed} FAILURES"
        print(f"OVERALL RESULT: {total_passed} passed, {total_failed} failed - {overall_status}")
        
        if total_failed == 0:
            print("🎉 All backend systems are working correctly!")
        else:
            print("⚠️  Some issues found that need attention.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = ProcurementPortalTester()
    tester.run_all_tests()
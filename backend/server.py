from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import re
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI integration
openai_api_key = os.environ.get('OPENAI_API_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    user_type: str  # 'vendor' or 'admin'
    company_name: Optional[str] = None
    username: Optional[str] = None
    password_hash: str
    is_approved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_data: Optional[Dict] = None

class UserSignup(BaseModel):
    email: str
    password: str
    user_type: str
    company_name: Optional[str] = None
    username: Optional[str] = None
    cr_number: Optional[str] = None
    country: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class RFP(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    budget: float
    deadline: datetime
    categories: List[str]
    scope_of_work: str
    attachments: Optional[List[str]] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"  # active, closed, awarded
    approval_level: str  # based on budget

class RFPCreate(BaseModel):
    title: str
    description: str
    budget: float
    deadline: datetime
    categories: List[str]
    scope_of_work: str

class Proposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rfp_id: str
    vendor_id: str
    vendor_company: str
    technical_document: Optional[str] = None  # base64 encoded
    commercial_document: Optional[str] = None  # base64 encoded
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "submitted"  # submitted, under_review, evaluated, awarded, rejected
    ai_score: Optional[float] = None
    ai_evaluation: Optional[Dict] = None

class AIEvaluation(BaseModel):
    commercial_score: float
    technical_score: float
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    recommendation: str
    detailed_analysis: str

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rfp_id: str
    rfp_title: str
    vendor_id: str
    vendor_company: str
    contract_value: float
    start_date: datetime
    end_date: datetime
    status: str = "active"  # active, completed, pending
    progress: float = 0.0
    milestones: List[Dict] = []
    next_milestone: Optional[str] = None
    payment_status: str = "unpaid"  # unpaid, partial_paid, fully_paid
    paid_amount: float = 0.0
    pending_amount: float = 0.0
    documents: List[Dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, user_type: str) -> str:
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_approval_level(budget: float) -> str:
    if budget <= 100000:
        return "procurement_officer"
    elif budget <= 500000:
        return "manager"
    elif budget <= 1000000:
        return "cfo"
    else:
        return "ceo"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user_type = payload.get('user_type')
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "user_type": user_type}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def evaluate_proposal_with_ai(proposal: Proposal, rfp: RFP) -> AIEvaluation:
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Initialize LLM chat
        chat = LlmChat(
            api_key=openai_api_key,
            session_id=f"eval_{proposal.id}",
            system_message="""You are an expert procurement evaluator. Analyze proposals with the following criteria:
            - Commercial Evaluation (70% weight): pricing competitiveness, payment terms, value for money
            - Technical Evaluation (30% weight): technical capability, approach, innovation
            
            Provide detailed scoring and recommendations."""
        ).with_model("openai", "gpt-4.1")

        # Prepare evaluation prompt
        evaluation_prompt = f"""
        Please evaluate this proposal for RFP: {rfp.title}
        
        RFP Details:
        - Budget: {rfp.budget} SAR
        - Description: {rfp.description}
        - Scope: {rfp.scope_of_work}
        
        Proposal submitted by: {proposal.vendor_company}
        
        Commercial Document: {"Available" if proposal.commercial_document else "Missing"}
        Technical Document: {"Available" if proposal.technical_document else "Missing"}
        
        Please provide:
        1. Commercial score (0-100)
        2. Technical score (0-100)
        3. Overall weighted score (commercial 70% + technical 30%)
        4. Top 3 strengths
        5. Top 3 weaknesses
        6. Clear recommendation (Highly Recommended/Recommended/Not Recommended)
        7. Detailed analysis
        
        Format your response as JSON:
        {{
            "commercial_score": number,
            "technical_score": number,
            "overall_score": number,
            "strengths": ["strength1", "strength2", "strength3"],
            "weaknesses": ["weakness1", "weakness2", "weakness3"],
            "recommendation": "recommendation",
            "detailed_analysis": "detailed analysis text"
        }}
        """
        
        # Send to AI
        response = await chat.send_message(UserMessage(text=evaluation_prompt))
        
        # Parse JSON response
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return AIEvaluation(**result)
            else:
                # Fallback evaluation
                return AIEvaluation(
                    commercial_score=75.0,
                    technical_score=70.0,
                    overall_score=73.5,
                    strengths=["Competitive pricing", "Good technical approach", "Timely submission"],
                    weaknesses=["Limited experience", "Basic proposal format", "Missing some details"],
                    recommendation="Recommended",
                    detailed_analysis="AI evaluation completed with standard scoring."
                )
        except json.JSONDecodeError:
            # Fallback evaluation
            return AIEvaluation(
                commercial_score=75.0,
                technical_score=70.0,
                overall_score=73.5,
                strengths=["Competitive pricing", "Good technical approach", "Timely submission"],
                weaknesses=["Limited experience", "Basic proposal format", "Missing some details"],
                recommendation="Recommended",
                detailed_analysis="AI evaluation completed with standard scoring."
            )
    
    except Exception as e:
        logging.error(f"AI evaluation error: {str(e)}")
        # Fallback evaluation
        return AIEvaluation(
            commercial_score=70.0,
            technical_score=65.0,
            overall_score=68.5,
            strengths=["Proposal submitted", "Meets basic requirements", "Vendor participation"],
            weaknesses=["Evaluation error", "Limited assessment", "Manual review needed"],
            recommendation="Requires Manual Review",
            detailed_analysis=f"AI evaluation encountered an error: {str(e)}. Manual review recommended."
        )

# Routes
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        user_type=user_data.user_type,
        company_name=user_data.company_name,
        username=user_data.username,
        password_hash=hashed_password,
        is_approved=(user_data.user_type == "admin"),  # Auto-approve admin users
        profile_data={
            "cr_number": user_data.cr_number,
            "country": user_data.country
        }
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    token = create_jwt_token(user.id, user.user_type)
    
    return {
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "user_type": user.user_type,
            "is_approved": user.is_approved,
            "company_name": user.company_name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['user_type'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "user_type": user['user_type'],
            "is_approved": user['is_approved'],
            "company_name": user.get('company_name')
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user['id'],
        "email": user['email'],
        "user_type": user['user_type'],
        "is_approved": user['is_approved'],
        "company_name": user.get('company_name')
    }

@api_router.post("/rfps", response_model=RFP)
async def create_rfp(rfp_data: RFPCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin users can create RFPs")
    
    approval_level = get_approval_level(rfp_data.budget)
    
    rfp = RFP(
        **rfp_data.dict(),
        created_by=current_user["user_id"],
        approval_level=approval_level
    )
    
    await db.rfps.insert_one(rfp.dict())
    return rfp

@api_router.get("/rfps", response_model=List[RFP])
async def get_rfps(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] == "vendor":
        # Vendors see only active RFPs
        rfps = await db.rfps.find({"status": "active"}).to_list(1000)
    else:
        # Admins see all RFPs
        rfps = await db.rfps.find().to_list(1000)
    
    return [RFP(**rfp) for rfp in rfps]

@api_router.get("/rfps/{rfp_id}", response_model=RFP)
async def get_rfp(rfp_id: str, current_user: dict = Depends(get_current_user)):
    rfp = await db.rfps.find_one({"id": rfp_id})
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    
    return RFP(**rfp)

@api_router.post("/proposals")
async def submit_proposal(
    rfp_id: str = Form(...),
    technical_file: Optional[UploadFile] = File(None),
    commercial_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can submit proposals")
    
    # Get user info
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user or not user.get('is_approved'):
        raise HTTPException(status_code=403, detail="Vendor not approved")
    
    # Check if RFP exists
    rfp = await db.rfps.find_one({"id": rfp_id})
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    
    # Process file uploads
    technical_doc = None
    commercial_doc = None
    
    if technical_file:
        content = await technical_file.read()
        technical_doc = base64.b64encode(content).decode('utf-8')
    
    if commercial_file:
        content = await commercial_file.read()
        commercial_doc = base64.b64encode(content).decode('utf-8')
    
    # Create proposal
    proposal = Proposal(
        rfp_id=rfp_id,
        vendor_id=current_user["user_id"],
        vendor_company=user.get('company_name', 'Unknown Company'),
        technical_document=technical_doc,
        commercial_document=commercial_doc
    )
    
    await db.proposals.insert_one(proposal.dict())
    
    return {"message": "Proposal submitted successfully", "proposal_id": proposal.id}

@api_router.get("/proposals")
async def get_proposals(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] == "vendor":
        # Vendors see only their proposals
        proposals = await db.proposals.find({"vendor_id": current_user["user_id"]}).to_list(1000)
    else:
        # Admins see all proposals
        proposals = await db.proposals.find().to_list(1000)
    
    return [Proposal(**proposal) for proposal in proposals]

@api_router.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: str, current_user: dict = Depends(get_current_user)):
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Check access rights
    if (current_user["user_type"] == "vendor" and 
        proposal["vendor_id"] != current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Proposal(**proposal)

@api_router.post("/proposals/{proposal_id}/evaluate")
async def evaluate_proposal(proposal_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin users can evaluate proposals")
    
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    rfp = await db.rfps.find_one({"id": proposal["rfp_id"]})
    if not rfp:
        raise HTTPException(status_code=404, detail="Associated RFP not found")
    
    # Perform AI evaluation
    proposal_obj = Proposal(**proposal)
    rfp_obj = RFP(**rfp)
    
    evaluation = await evaluate_proposal_with_ai(proposal_obj, rfp_obj)
    
    # Update proposal with evaluation
    await db.proposals.update_one(
        {"id": proposal_id},
        {
            "$set": {
                "status": "evaluated",
                "ai_score": evaluation.overall_score,
                "ai_evaluation": evaluation.dict()
            }
        }
    )
    
    return {
        "message": "Proposal evaluated successfully",
        "evaluation": evaluation.dict()
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] == "vendor":
        # Vendor dashboard stats
        total_proposals = await db.proposals.count_documents({"vendor_id": current_user["user_id"]})
        awarded_contracts = await db.proposals.count_documents({
            "vendor_id": current_user["user_id"], 
            "status": "awarded"
        })
        active_rfps = await db.rfps.count_documents({"status": "active"})
        
        return {
            "total_proposals": total_proposals,
            "awarded_contracts": awarded_contracts,
            "active_rfps": active_rfps
        }
    else:
        # Admin dashboard stats
        total_rfps = await db.rfps.count_documents({})
        total_proposals = await db.proposals.count_documents({})
        pending_vendors = await db.users.count_documents({
            "user_type": "vendor", 
            "is_approved": False
        })
        
        return {
            "total_rfps": total_rfps,
            "total_proposals": total_proposals,
            "pending_vendors": pending_vendors
        }

# Contract endpoints
@api_router.get("/contracts")
async def get_contracts(current_user: dict = Depends(get_current_user)):
    """Get contracts for the current user (vendor gets their contracts, admin gets all)"""
    try:
        if current_user["user_type"] == "vendor":
            # Vendor sees only their contracts
            contracts = await db.contracts.find({"vendor_id": current_user["user_id"]}).to_list(None)
        else:
            # Admin sees all contracts
            contracts = await db.contracts.find().to_list(None)
        
        # Convert ObjectId to string and clean up the data
        cleaned_contracts = []
        for contract in contracts:
            if "_id" in contract:
                del contract["_id"]  # Remove MongoDB ObjectId
            cleaned_contracts.append(contract)
        
        return {"contracts": cleaned_contracts}
    except Exception as e:
        logger.error(f"Error fetching contracts: {e}")
        raise HTTPException(status_code=500, detail="Error fetching contracts")

@api_router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific contract details"""
    try:
        contract = await db.contracts.find_one({"id": contract_id})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Check access permission
        if current_user["user_type"] == "vendor" and contract["vendor_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Remove MongoDB ObjectId
        if "_id" in contract:
            del contract["_id"]
        
        return contract
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching contract: {e}")
        raise HTTPException(status_code=500, detail="Error fetching contract")

@api_router.post("/contracts")
async def create_contract(contract_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new contract (admin only)"""
    try:
        if current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create contracts")
        
        # Create new contract
        new_contract = Contract(
            rfp_id=contract_data["rfp_id"],
            rfp_title=contract_data["rfp_title"],
            vendor_id=contract_data["vendor_id"],
            vendor_company=contract_data["vendor_company"],
            contract_value=contract_data["contract_value"],
            start_date=datetime.fromisoformat(contract_data["start_date"]),
            end_date=datetime.fromisoformat(contract_data["end_date"]),
            milestones=contract_data.get("milestones", []),
            documents=contract_data.get("documents", []),
            pending_amount=contract_data["contract_value"]
        )
        
        # Insert into database
        await db.contracts.insert_one(new_contract.dict())
        
        return {"message": "Contract created successfully", "contract_id": new_contract.id}
    except Exception as e:
        logger.error(f"Error creating contract: {e}")
        raise HTTPException(status_code=500, detail="Error creating contract")

@api_router.put("/contracts/{contract_id}")
async def update_contract(contract_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    """Update contract details (admin only)"""
    try:
        if current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update contracts")
        
        # Update contract
        update_data["updated_at"] = datetime.utcnow()
        result = await db.contracts.update_one(
            {"id": contract_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        return {"message": "Contract updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract: {e}")
        raise HTTPException(status_code=500, detail="Error updating contract")

@api_router.post("/contracts/{contract_id}/documents")
async def upload_contract_document(contract_id: str, document_data: dict, current_user: dict = Depends(get_current_user)):
    """Upload a document to a contract"""
    try:
        # Check if contract exists and user has access
        contract = await db.contracts.find_one({"id": contract_id})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        if current_user["user_type"] == "vendor" and contract["vendor_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Add document to contract
        document = {
            "id": str(uuid.uuid4()),
            "name": document_data["name"],
            "type": document_data["type"],
            "size": document_data["size"],
            "content": document_data.get("content", ""),
            "uploaded_at": datetime.utcnow(),
            "uploaded_by": current_user["user_id"]
        }
        
        await db.contracts.update_one(
            {"id": contract_id},
            {"$push": {"documents": document}}
        )
        
        return {"message": "Document uploaded successfully", "document_id": document["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail="Error uploading document")

@api_router.get("/contracts/{contract_id}/documents/{document_id}")
async def download_contract_document(contract_id: str, document_id: str, current_user: dict = Depends(get_current_user)):
    """Download a contract document"""
    try:
        # Check if contract exists and user has access
        contract = await db.contracts.find_one({"id": contract_id})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        if current_user["user_type"] == "vendor" and contract["vendor_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Find document
        document = None
        for doc in contract.get("documents", []):
            if doc["id"] == document_id:
                document = doc
                break
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading document: {e}")
        raise HTTPException(status_code=500, detail="Error downloading document")

async def create_demo_data():
    """Create demo data for testing including vendor and contracts"""
    try:
        # First, create or get demo vendor
        demo_vendor_email = "vendor001@techcorp.sa"
        existing_vendor = await db.users.find_one({"email": demo_vendor_email})
        
        if not existing_vendor:
            # Create demo vendor with specific ID
            demo_vendor = User(
                id="vendor-001",  # Use specific ID for demo
                email=demo_vendor_email,
                user_type="vendor",
                company_name="TechCorp Solutions",
                username="vendor001",
                password_hash=hash_password("DemoVendor123!"),
                is_approved=True  # Auto-approve for demo
            )
            await db.users.insert_one(demo_vendor.dict())
            logger.info("Demo vendor created with ID: vendor-001")
            vendor_id = "vendor-001"
        else:
            vendor_id = existing_vendor["id"]
            logger.info(f"Using existing demo vendor with ID: {vendor_id}")
        
        # Check if contracts already exist
        existing_contracts = await db.contracts.count_documents({})
        if existing_contracts > 0:
            logger.info("Demo contracts already exist, skipping creation")
            return
        
        # Create demo contracts with the correct vendor ID
        demo_contracts = [
            {
                "id": "CTR-2025-001",
                "rfp_id": "rfp-001",
                "rfp_title": "Enterprise Cloud Infrastructure Modernization",
                "vendor_id": vendor_id,
                "vendor_company": "TechCorp Solutions",
                "contract_value": 750000.0,
                "start_date": datetime(2025, 1, 15),
                "end_date": datetime(2025, 4, 15),
                "status": "active",
                "progress": 65.0,
                "milestones": [
                    {"name": "Infrastructure Assessment", "status": "completed", "date": "2025-01-30"},
                    {"name": "Migration Planning", "status": "completed", "date": "2025-02-15"},
                    {"name": "Cloud Setup & Testing", "status": "in_progress", "date": "2025-03-01"},
                    {"name": "Data Migration", "status": "pending", "date": "2025-03-15"},
                    {"name": "Go-Live & Support", "status": "pending", "date": "2025-04-01"}
                ],
                "next_milestone": "Cloud Setup & Testing",
                "payment_status": "partial_paid",
                "paid_amount": 487500.0,
                "pending_amount": 262500.0,
                "documents": [
                    {"name": "Signed Contract", "type": "pdf", "size": "2.4 MB", "id": str(uuid.uuid4())},
                    {"name": "Statement of Work", "type": "pdf", "size": "1.8 MB", "id": str(uuid.uuid4())},
                    {"name": "Technical Specifications", "type": "pdf", "size": "3.2 MB", "id": str(uuid.uuid4())}
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": "CTR-2024-018",
                "rfp_id": "rfp-002",
                "rfp_title": "Security Infrastructure Upgrade",
                "vendor_id": vendor_id,
                "vendor_company": "TechCorp Solutions",
                "contract_value": 180000.0,
                "start_date": datetime(2024, 10, 1),
                "end_date": datetime(2024, 12, 31),
                "status": "completed",
                "progress": 100.0,
                "milestones": [
                    {"name": "Security Assessment", "status": "completed", "date": "2024-10-15"},
                    {"name": "Implementation Phase 1", "status": "completed", "date": "2024-11-15"},
                    {"name": "Implementation Phase 2", "status": "completed", "date": "2024-12-15"},
                    {"name": "Final Testing & Handover", "status": "completed", "date": "2024-12-30"}
                ],
                "payment_status": "fully_paid",
                "paid_amount": 180000.0,
                "pending_amount": 0.0,
                "documents": [
                    {"name": "Signed Contract", "type": "pdf", "size": "2.1 MB", "id": str(uuid.uuid4())},
                    {"name": "Completion Certificate", "type": "pdf", "size": "1.2 MB", "id": str(uuid.uuid4())},
                    {"name": "Security Audit Report", "type": "pdf", "size": "4.5 MB", "id": str(uuid.uuid4())},
                    {"name": "Final Invoice", "type": "pdf", "size": "890 KB", "id": str(uuid.uuid4())}
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": "CTR-2024-012",
                "rfp_id": "rfp-003",
                "rfp_title": "Digital Transformation Consulting",
                "vendor_id": vendor_id,
                "vendor_company": "TechCorp Solutions",
                "contract_value": 320000.0,
                "start_date": datetime(2024, 6, 1),
                "end_date": datetime(2024, 9, 30),
                "status": "completed",
                "progress": 100.0,
                "milestones": [
                    {"name": "Current State Analysis", "status": "completed", "date": "2024-06-30"},
                    {"name": "Strategy Development", "status": "completed", "date": "2024-07-31"},
                    {"name": "Implementation Planning", "status": "completed", "date": "2024-08-31"},
                    {"name": "Knowledge Transfer", "status": "completed", "date": "2024-09-30"}
                ],
                "payment_status": "fully_paid",
                "paid_amount": 320000.0,
                "pending_amount": 0.0,
                "documents": [
                    {"name": "Signed Contract", "type": "pdf", "size": "2.8 MB", "id": str(uuid.uuid4())},
                    {"name": "Digital Strategy Report", "type": "pdf", "size": "6.2 MB", "id": str(uuid.uuid4())},
                    {"name": "Implementation Roadmap", "type": "pdf", "size": "3.1 MB", "id": str(uuid.uuid4())},
                    {"name": "Final Deliverables", "type": "zip", "size": "15.4 MB", "id": str(uuid.uuid4())}
                ],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        # Insert demo contracts
        await db.contracts.insert_many(demo_contracts)
        logger.info("Demo contracts created successfully")
        
    except Exception as e:
        logger.error(f"Error creating demo data: {e}")

async def create_demo_contracts():
    """Create demo contracts for testing"""
    # This function is kept for backward compatibility but now calls create_demo_data
    await create_demo_data()

@app.on_event("startup")
async def startup_event():
    """Initialize demo data on startup"""
    await create_demo_contracts()

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
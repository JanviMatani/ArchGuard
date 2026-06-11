# main.py
# 🎯 Kaam: FastAPI server — frontend aur agent ke beech bridge
# 🧠 Concepts: REST API, Endpoints, Async Programming, Webhooks

import os
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from ingestor import fetch_repo_data
from embedder import embed_and_store, search_similar
from agent import reasoning_agent, check_pr_against_decisions

load_dotenv()

# ─────────────────────────────────────────
# FASTAPI KYA HAI?
# ─────────────────────────────────────────
# FastAPI = Python ka fastest web framework
# Ye HTTP requests handle karta hai
# Frontend se aaya request → Python function run karo → Response bhejo
# 
# REST API = ek convention hai communicate karne ka
# GET    = data lao
# POST   = data bhejo / kuch karo
# ─────────────────────────────────────────

app = FastAPI(
    title="ArchGuard API",
    description="AI Agent that explains WHY your codebase is the way it is",
    version="1.0.0"
)

# ─────────────────────────────────────────
# CORS KYA HAI?
# ─────────────────────────────────────────
# Browser security rule hai — ek domain doosre domain ko
# directly call nahi kar sakta bina permission ke
# Frontend (localhost:3000) → Backend (localhost:8000)
# CORS middleware ye permission deta hai
# ─────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development mein sab allow — production mein specific domain do
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory store — konse repos already indexed hain
# Production mein Redis ya DB use karenge
indexed_repos = {}

# ─────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────
# Ye define karta hai — API ko kaunsa data milega
# Automatic validation — wrong data aaya toh error
# ─────────────────────────────────────────

class IndexRequest(BaseModel):
    repo_name: str  # "facebook/react" format

class QuestionRequest(BaseModel):
    repo_name: str
    question: str

class PRGuardRequest(BaseModel):
    repo_name: str
    pr_title: str
    pr_description: str = ""

# ═══════════════════════════════════════
# ENDPOINT 1: Health Check
# ═══════════════════════════════════════
@app.get("/")
def root():
    """Server chal raha hai check karne ke liye"""
    return {
        "status": "ArchGuard is running! 🛡️",
        "version": "1.0.0",
        "endpoints": ["/index", "/ask", "/pr-guard", "/status/{repo}"]
    }

# ═══════════════════════════════════════
# ENDPOINT 2: Repo Index Karo
# ═══════════════════════════════════════
@app.post("/index")
async def index_repository(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    GitHub repo ka data fetch karo aur Chroma mein store karo
    
    🧠 Background Tasks concept:
    Indexing slow process hai — 2-3 minutes lag sakte hain
    Background mein chalao — user ko immediately response do
    User poochh sakta hai status baad mein
    """
    
    repo_name = request.repo_name
    
    # Already indexing ho raha hai?
    if repo_name in indexed_repos and indexed_repos[repo_name] == "indexing":
        return {"status": "already_indexing", "message": f"{repo_name} is being indexed"}
    
    # Status update karo
    indexed_repos[repo_name] = "indexing"
    
    # Background mein index karo — user wait nahi karega
    background_tasks.add_task(run_indexing, repo_name)
    
    return {
        "status": "started",
        "message": f"Indexing {repo_name} in background. Check /status/{repo_name.replace('/', '_')} for updates"
    }

async def run_indexing(repo_name: str):
    """Background mein chalne wala actual indexing function"""
    try:
        print(f"\n🚀 Starting indexing for {repo_name}")
        
        # Step 1: GitHub se data fetch karo
        documents = fetch_repo_data(repo_name)
        
        # Step 2: Embed karo aur Chroma mein store karo
        collection_name = repo_name.replace("/", "_")
        embed_and_store(documents, collection_name)
        
        # Done!
        indexed_repos[repo_name] = "ready"
        print(f"✅ Indexing complete for {repo_name}")
        
    except Exception as e:
        indexed_repos[repo_name] = f"error: {str(e)}"
        print(f"❌ Indexing failed for {repo_name}: {e}")

# ═══════════════════════════════════════
# ENDPOINT 3: Status Check
# ═══════════════════════════════════════
@app.get("/status/{repo_owner}/{repo_name}")
def get_status(repo_owner: str, repo_name: str):
    """Repo indexing ka status check karo"""
    full_name = f"{repo_owner}/{repo_name}"
    status = indexed_repos.get(full_name, "not_indexed")
    return {
        "repo": full_name,
        "status": status,
        "ready": status == "ready"
    }

# ═══════════════════════════════════════
# ENDPOINT 4: Question Poochho — MAIN FEATURE
# ═══════════════════════════════════════
@app.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Repo ke baare mein koi bhi WHY question poochho
    Agent multi-step reasoning karke cited answer dega
    
    🧠 Ye RAG pipeline ka full flow hai:
    Question → Retrieve → Reason → Answer with Citations
    """
    
    repo_name = request.repo_name
    collection_name = repo_name.replace("/", "_")
    
    # Repo indexed hai?
    status = indexed_repos.get(repo_name, "not_indexed")
    if status == "not_indexed":
        raise HTTPException(
            status_code=400,
            detail=f"Repo not indexed yet. Call POST /index first with repo_name: {repo_name}"
        )
    if status == "indexing":
        raise HTTPException(
            status_code=202,
            detail="Repo is still being indexed. Please wait and try again."
        )
    
    try:
        # Agent ko question do
        result = reasoning_agent(
            question=request.question,
            repo_name=repo_name,
            collection_name=collection_name
        )
        
        return {
            "question": request.question,
            "repo": repo_name,
            "answer": result["answer"],
            "citations": result["citations"],
            "confidence": result["confidence"],
            "reasoning_steps": result["reasoning_steps"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════
# ENDPOINT 5: PR Guard — CI/CD Hook
# ═══════════════════════════════════════
@app.post("/pr-guard")
async def pr_guard(request: PRGuardRequest):
    """
    Naya PR check karo — architectural rules toot rahe hain?
    
    🧠 CI/CD Integration concept:
    Ye endpoint GitHub Actions se call hoga automatically
    Jab bhi koi PR open kare — ye fire hoga
    Warning mili → GitHub pe comment post hoga
    """
    
    collection_name = request.repo_name.replace("/", "_")
    
    result = check_pr_against_decisions(
        pr_title=request.pr_title,
        pr_description=request.pr_description,
        collection_name=collection_name
    )
    
    return {
        "pr_title": request.pr_title,
        "safe": result["safe"],
        "warning": result["warning"],
        "similar_past_decisions": result.get("similar_decisions", []),
        "recommendation": "Proceed with caution" if not result["safe"] else "Looks good!"
    }

# ═══════════════════════════════════════
# ENDPOINT 6: GitHub Webhook — Real CI/CD
# ═══════════════════════════════════════
@app.post("/webhook/github")
async def github_webhook(payload: dict):
    """
    GitHub directly yahan call karta hai jab PR open ho
    
    🧠 Webhook concept:
    Normal API = tum jaake data maango
    Webhook = GitHub khud aake data bhejta hai
    Event-driven architecture ka example
    """
    
    # Sirf PR events handle karo
    if "pull_request" not in payload:
        return {"status": "ignored"}
    
    pr = payload["pull_request"]
    repo = payload["repository"]["full_name"]
    
    # PR opened ya reopened ho toh check karo
    action = payload.get("action", "")
    if action not in ["opened", "reopened", "synchronize"]:
        return {"status": "ignored", "reason": f"Action {action} not monitored"}
    
    # PR Guard check karo
    result = check_pr_against_decisions(
        pr_title=pr["title"],
        pr_description=pr.get("body", ""),
        collection_name=repo.replace("/", "_")
    )
    
    print(f"\n🔔 Webhook received for PR: {pr['title']}")
    print(f"   Safe: {result['safe']}")
    if not result["safe"]:
        print(f"   ⚠️ Warning: {result['warning']}")
    
    return {
        "pr_number": pr["number"],
        "repo": repo,
        "guard_result": result
    }


# Server start karo
if __name__ == "__main__":
    import uvicorn
    # reload=True — code change karo, server automatically restart hoga
    # Development ke liye useful
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
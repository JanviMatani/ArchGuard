# agent.py
# 🎯 Kaam: Multi-step reasoning agent — "WHY" ka jawab dhundna
# 🧠 Concepts: LangGraph, Agentic AI, Chain of Thought, RAG Pipeline

import os
from groq import Groq
from embedder import search_similar
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────
# GROQ KYA HAI?
# ─────────────────────────────────────────
# Groq = ultra-fast free LLM API
# Llama 3 model run karta hai — same quality as GPT-4
# Free tier: 14,400 requests/day — more than enough
# ─────────────────────────────────────────

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─────────────────────────────────────────
# LANGGRAPH KYA HAI? (Concept samjho)
# ─────────────────────────────────────────
# Normal AI: Question → Answer (1 step)
#
# LangGraph: Question → Think → Search → 
#            Think Again → Search Again → 
#            Synthesize → Answer (multiple steps)
#
# Ye "Graph" hai — nodes aur edges se bana
# Har node = ek kaam (search, think, answer)
# Edges = kab kaunse node pe jaana hai
#
# Hum simplified version banayenge — 
# same concept, beginner-friendly code
# ─────────────────────────────────────────

def reasoning_agent(question: str, repo_name: str, collection_name: str = "archguard") -> dict:
    """
    Multi-step reasoning agent
    
    Step 1: Question analyze karo — kya dhundna hai?
    Step 2: Relevant documents retrieve karo (RAG)
    Step 3: LLM se reason karwao — cited answer banao
    Step 4: Confidence check — answer strong hai?
    
    Returns: {answer, citations, reasoning_steps, confidence}
    """
    
    print(f"\n🤔 Agent thinking about: {question}")
    reasoning_steps = []  # Har step track karenge — transparency ke liye
    
    # ═══════════════════════════════════════
    # STEP 1: QUERY DECOMPOSITION
    # ═══════════════════════════════════════
    # Complex question ko simple search queries mein todna
    # "Why did React switch to Fiber and how does it affect rendering?"
    # → ["React Fiber architecture decision", "Fiber rendering performance"]
    
    print("📋 Step 1: Decomposing question into search queries...")
    
    decompose_prompt = f"""You are analyzing a question about a GitHub repository.
Break this question into 2-3 specific search queries to find relevant PRs, commits, and issues.

Question: {question}
Repository: {repo_name}

Return ONLY a Python list of strings, nothing else.
Example: ["query 1", "query 2", "query 3"]"""

    decompose_response = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # Fast, free Llama model
        messages=[{"role": "user", "content": decompose_prompt}],
        temperature=0.1  # Low temperature = more focused, less random
    )
    
    # Response parse karo — string to list
    queries_text = decompose_response.choices[0].message.content.strip()
    
    try:
        # Safe eval — string list ko actual list mein convert karo
        import ast
        search_queries = ast.literal_eval(queries_text)
    except:
        # Agar parse fail ho — original question hi use karo
        search_queries = [question]
    
    reasoning_steps.append({
        "step": "Query Decomposition",
        "input": question,
        "output": search_queries
    })
    print(f"  🔍 Search queries: {search_queries}")
    
    # ═══════════════════════════════════════
    # STEP 2: MULTI-QUERY RETRIEVAL (RAG)
    # ═══════════════════════════════════════
    # Har query ke liye Chroma search karo
    # Duplicate documents hatao
    # Ye "Multi-Query RAG" pattern hai — single query se better
    
    print("📚 Step 2: Retrieving relevant documents...")
    
    all_results = []
    seen_ids = set()  # Duplicates track karne ke liye
    
    for query in search_queries:
        results = search_similar(query, collection_name, n_results=4)
        
        for result in results:
            doc_id = result["metadata"].get("source_id", "")
            
            # Duplicate check — same document baar baar mat lo
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                all_results.append(result)
    
    # Similarity score ke basis pe sort karo — most relevant pehle
    all_results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    # Top 6 most relevant documents lo
    top_results = all_results[:6]
    
    reasoning_steps.append({
        "step": "Document Retrieval",
        "queries_used": search_queries,
        "documents_found": len(top_results),
        "top_sources": [r["metadata"]["title"] for r in top_results]
    })
    
    print(f"  ✅ Found {len(top_results)} relevant documents")
    
    if not top_results:
        return {
            "answer": "No relevant information found in the repository for this question.",
            "citations": [],
            "reasoning_steps": reasoning_steps,
            "confidence": "low"
        }
    
    # ═══════════════════════════════════════
    # STEP 3: CONTEXT BUILDING
    # ═══════════════════════════════════════
    # Retrieved documents ko ek clean context mein organize karo
    # LLM ko dena hai ye context — iske basis pe answer banega
    
    print("🧩 Step 3: Building context from retrieved documents...")
    
    context_parts = []
    citations = []
    
    for i, result in enumerate(top_results):
        meta = result["metadata"]
        
        # Citation banao — [1], [2] format mein
        citation_num = i + 1
        citations.append({
            "number": citation_num,
            "type": meta.get("type", "unknown"),
            "title": meta.get("title", "Unknown"),
            "author": meta.get("author", "Unknown"),
            "date": meta.get("date", "Unknown"),
            "url": meta.get("url", ""),
            "relevance_score": round(result["similarity_score"], 2)
        })
        
        # Context mein daalo
        context_parts.append(
            f"[{citation_num}] {meta.get('type', '').upper()}: {meta.get('title', '')}\n"
            f"Author: {meta.get('author', 'Unknown')} | Date: {meta.get('date', 'Unknown')}\n"
            f"Content: {result['content'][:500]}...\n"  # First 500 chars
        )
    
    context = "\n---\n".join(context_parts)
    
    # ═══════════════════════════════════════
    # STEP 4: REASONING + ANSWER GENERATION
    # ═══════════════════════════════════════
    # Ab LLM ko context do aur reasoning karwao
    # "Chain of Thought" prompting — step by step sochne ko kaho
    
    print("💭 Step 4: Generating reasoned answer...")
    
    reasoning_prompt = f"""You are ArchGuard, an AI agent that explains WHY architectural decisions were made in codebases.

You have been given context from the {repo_name} repository including PRs, commits, and issues.

QUESTION: {question}

RETRIEVED CONTEXT:
{context}

Instructions:
1. Analyze the context carefully
2. Identify the most relevant evidence
3. Explain the reasoning behind the architectural decision
4. Cite your sources using [1], [2] etc format
5. Be specific — mention actual PR numbers, commit hashes, author names
6. If context is insufficient, say so honestly

Provide a clear, cited explanation of WHY this decision was made."""

    final_response = client.chat.completions.create(
       model="llama-3.3-70b-versatile",  # Bigger model for final answer — better reasoning
        messages=[
            {
                "role": "system", 
                "content": "You are ArchGuard — an expert at explaining architectural decisions in codebases. Always cite sources. Always explain the WHY, not just the WHAT."
            },
            {
                "role": "user", 
                "content": reasoning_prompt
            }
        ],
        temperature=0.2  # Slightly creative but mostly factual
    )
    
    answer = final_response.choices[0].message.content
    
    reasoning_steps.append({
        "step": "Answer Generation",
        "model_used": "llama-3.3-70b-versatile",
        "context_documents": len(top_results)
    })
    
    # ═══════════════════════════════════════
    # STEP 5: CONFIDENCE SCORING
    # ═══════════════════════════════════════
    # Answer kitna reliable hai?
    # High similarity scores = high confidence
    
    avg_score = sum(r["similarity_score"] for r in top_results) / len(top_results)
    
    if avg_score > 0.7:
        confidence = "high"
    elif avg_score > 0.4:
        confidence = "medium"
    else:
        confidence = "low"
    
    print(f"✅ Answer generated! Confidence: {confidence}")
    
    return {
        "answer": answer,
        "citations": citations,
        "reasoning_steps": reasoning_steps,
        "confidence": confidence,
        "avg_relevance_score": round(avg_score, 2)
    }


# ─────────────────────────────────────────
# PR GUARD LOGIC
# ─────────────────────────────────────────
# Ye proactive part hai — user ne nahi poocha
# Agent khud check karta hai — kya ye PR kuch todega?

def check_pr_against_decisions(pr_title: str, pr_description: str, collection_name: str = "archguard") -> dict:
    """
    Naya PR check karo — kya ye koi architectural rule todta hai?
    
    🧠 Concept: Proactive AI — reactive nahi, preventive
    CI/CD pipeline mein hook hoga ye function
    """
    
    print(f"\n🛡️ PR Guard checking: {pr_title}")
    
    # PR ka content embed karo aur similar past decisions dhundo
    pr_content = f"{pr_title}\n{pr_description}"
    
    similar_decisions = search_similar(
        pr_content, 
        collection_name, 
        n_results=5
    )
    
    if not similar_decisions:
        return {"warning": None, "safe": True}
    
    # LLM se analyze karwao — conflict hai kya?
    context = "\n".join([
        f"- {r['metadata']['title']} ({r['metadata']['type']}): {r['content'][:200]}"
        for r in similar_decisions
    ])
    
    guard_prompt = f"""You are ArchGuard's PR safety checker.

NEW PR:
Title: {pr_title}
Description: {pr_description}

SIMILAR PAST DECISIONS IN THIS REPO:
{context}

Does this new PR potentially conflict with or violate any past architectural decisions?

If YES: Explain specifically what rule/decision it might break and cite the source.
If NO: Say "SAFE: No conflicts detected"

Be concise. Maximum 3 sentences."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": guard_prompt}],
        temperature=0.1
    )
    
    analysis = response.choices[0].message.content
    
    # Warning hai ya safe hai?
    is_safe = analysis.upper().startswith("SAFE")
    
    return {
        "warning": None if is_safe else analysis,
        "safe": is_safe,
        "similar_decisions": [r["metadata"]["title"] for r in similar_decisions[:3]]
    }


# Test karne ke liye
if __name__ == "__main__":
    # Simple test — dummy collection se
    result = check_pr_against_decisions(
        "Add synchronous rendering fallback",
        "This PR adds a synchronous rendering mode for simpler components"
    )
    print("\n🛡️ PR Guard Result:")
    print(result)
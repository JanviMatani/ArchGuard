# embedder.py
# 🎯 Kaam: Text data ko vectors mein convert karna aur Chroma mein store karna
# 🧠 Concept: EMBEDDINGS + VECTOR DATABASE — RAG ka heart

import os
import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────
# EMBEDDINGS KYA HOTE HAIN?
# ─────────────────────────────────────────
# Normal text: "Why did React choose Fiber?"
# Embedding:   [0.23, -0.87, 0.45, 0.12, ...]  ← 384 numbers ka array
#
# Similar meaning = similar numbers
# "Fiber architecture" aur "reconciler redesign" 
# dono ke vectors close honge mathematically
#
# Isi se semantic search possible hota hai —
# exact words match nahi, meaning match karta hai
# ─────────────────────────────────────────

# Free, local model — koi API cost nahi
# 384-dimensional embeddings banata hai
model = SentenceTransformer('all-MiniLM-L6-v2')

# Chroma = local vector database
# Tera PC pe hi store hoga — cloud nahi chahiye
# ./chroma_db folder mein save hoga automatically
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def embed_and_store(documents: list[dict], collection_name: str = "archguard"):
    """
    Documents lo → Embeddings banao → Chroma mein store karo
    
    Ye RAG pipeline ka 'Indexing' step hai
    Ek baar karo — phir instantly search kar sakte ho
    """
    
    print(f"\n🔄 Embedding {len(documents)} documents...")
    
    # Collection = ek folder jaise — ek repo ka saara data ek collection mein
    # get_or_create = agar already hai toh reuse karo, nahi toh banao
    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}  # Cosine similarity use karega search mein
    )
    
    # Batch processing — ek saath 50 documents process karo
    # Memory efficient hai aur faster bhi
    batch_size = 50
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        
        # Har document ki text nikalo
        texts = [doc["content"] for doc in batch]
        
        # ⭐ YE HAI EMBEDDING — text → numbers
        # Model har text ko 384 numbers ke array mein convert karta hai
        embeddings = model.encode(texts).tolist()
        
        # Chroma mein store karo — 3 cheezein saath mein:
        # 1. ids       = unique identifier (PR#123, commit abc123)
        # 2. embeddings = wo 384 numbers
        # 3. documents  = original text (search result mein dikhayenge)
        # 4. metadatas  = extra info (type, author, url, date)
        collection.add(
            ids=[f"{doc['id']}_{i+j}" for j, doc in enumerate(batch)],
            embeddings=embeddings,
            documents=texts,
            metadatas=[{
                "type": doc["type"],
                "title": doc["title"],
                "author": doc["author"],
                "date": doc["created_at"],
                "url": doc["url"],
                "source_id": doc["id"]
            } for doc in batch]
        )
        
        print(f"  ✅ Stored batch {i//batch_size + 1} ({len(batch)} docs)")
    
    total = collection.count()
    print(f"\n🎉 Total documents in Chroma: {total}")
    return collection


def search_similar(query: str, collection_name: str = "archguard", n_results: int = 5):
    """
    Query lo → Embedding banao → Similar documents dhundo
    
    🧠 Ye RAG pipeline ka 'Retrieval' step hai
    "Why did React use Fiber?" poochho
    → query embed karo
    → Chroma mein closest vectors dhundo
    → Relevant PRs/commits return karo
    """
    
    # Query ko bhi same model se embed karo
    query_embedding = model.encode([query]).tolist()
    
    collection = chroma_client.get_or_create_collection(name=collection_name)
    
    # Vector similarity search — mathematically closest documents
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        # Metadata bhi wapas chahiye — URL, author etc
        include=["documents", "metadatas", "distances"]
    )
    
    # Results format karo — clean list of dicts
    formatted = []
    for i in range(len(results["documents"][0])):
        formatted.append({
            "content": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            # Distance = kitna close hai — 0 = exact match, 1 = totally different
            "similarity_score": 1 - results["distances"][0][i]
        })
    
    return formatted


# Test karne ke liye
if __name__ == "__main__":
    # Dummy data se test karo pehle
    test_docs = [
        {
            "type": "pull_request",
            "id": "PR#1",
            "title": "Switch to Fiber architecture",
            "content": "PR #1: Switch to Fiber architecture\n\nFiber allows React to pause and resume rendering work, enabling concurrent features.",
            "author": "acdlite",
            "created_at": "2016-07-26",
            "url": "https://github.com/facebook/react/pull/1",
            "labels": ["architecture"]
        }
    ]
    
    # Store karo
    embed_and_store(test_docs, "test_collection")
    
    # Search karo
    results = search_similar("Why did React change rendering?", "test_collection")
    print("\n🔍 Search Results:")
    for r in results:
        print(f"  Score: {r['similarity_score']:.2f} | {r['metadata']['title']}")
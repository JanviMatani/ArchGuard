# embedder.py
import os
import chromadb
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_embedding(text: str) -> list:
    response = groq_client.embeddings.create(
        model="nomic-embed-text-v1.5",
        input=text[:512]
    )
    return response.data[0].embedding

def embed_and_store(documents: list[dict], collection_name: str = "archguard"):
    print(f"\n🔄 Embedding {len(documents)} documents...")
    
    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )
    
    batch_size = 50
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        texts = [doc["content"] for doc in batch]
        
        embeddings = [get_embedding(text) for text in texts]
        
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
    query_embedding = get_embedding(query)
    
    collection = chroma_client.get_or_create_collection(name=collection_name)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    formatted = []
    for i in range(len(results["documents"][0])):
        formatted.append({
            "content": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "similarity_score": 1 - results["distances"][0][i]
        })
    
    return formatted
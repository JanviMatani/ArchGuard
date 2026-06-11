# 🛡️ ArchGuard

> **Why is your codebase the way it is?**

ArchGuard is a multi-agent AI reasoning system that reconstructs *why* architectural decisions were made in any GitHub repository — by reasoning across commits, PRs, and issues — with citations. Plus a proactive **PR Guard** that warns before architectural rules are broken.

🔗 **Live Demo:** https://archguard-frontend.onrender.com
🔗 **API Docs:** https://archguard-backend.onrender.com/docs

---

## 🎯 The Problem

Every software team faces this daily:
- A senior engineer leaves. Their decisions live nowhere.
- An AI coding agent rewrites a function "cleanly" — and silently breaks a compliance rule from 2022.
- A new hire spends 3 weeks figuring out *why* the codebase is structured this way.
- A 2AM incident. You find a config set to `5 retries`. Was it arbitrary? Safe to change?

**The knowledge exists. It's trapped in commits, PRs, Slack threads, and people's heads.**

ArchGuard fixes this.

---

## ✨ Features

### 🔍 Ask WHY
Pose any architectural question about a GitHub repository. ArchGuard reasons across the entire decision history and returns a cited answer.

> *"Why did React switch to Fiber architecture?"*
> → Agent searches commits, PRs, issues → returns cited explanation with real GitHub links

### 🛡️ PR Guard
Proactively detects when a new PR violates a past architectural decision — **before it's merged.**

> *"Add synchronous rendering fallback"*
> → ⚠️ "This pattern was explicitly rejected in PR #8942 because it blocks the main thread"

### ⚡ CI/CD Integration
PR Guard runs automatically via **GitHub Actions** on every PR open — no manual steps needed.

---

## 🧠 AI Concepts Covered

| Concept | Implementation |
|---------|---------------|
| **RAG** | Multi-query retrieval from Chroma vector DB |
| **Embeddings** | Groq `nomic-embed-text-v1.5` |
| **Multi-hop Reasoning** | LangGraph-style multi-step agent |
| **Chain of Thought** | 5-step reasoning pipeline |
| **Agentic AI** | Query decomposition → retrieval → synthesis |
| **CI/CD Integration** | GitHub Actions webhook |
| **Semantic Search** | Cosine similarity vector search |

---

## 🏗️ Architecture

```
GitHub Repo
     ↓
ingestor.py      → Fetch commits, PRs, issues
     ↓
embedder.py      → Embed into Chroma vector DB (Groq embeddings)
     ↓
agent.py         → Multi-step reasoning with Groq LLM (Llama 3.3 70B)
     ↓
main.py          → FastAPI REST API
     ↓
frontend/        → React UI
     ↓
GitHub Actions   → CI/CD PR Guard automation
```

---

## 🛠️ Tech Stack

**Backend**
- Python + FastAPI
- LangChain + LangGraph
- Chroma (vector database)
- Groq API (Llama 3.3 70B + nomic-embed-text)
- GitHub API (PyGithub)

**Frontend**
- React + TypeScript
- Framer Motion
- Lucide React

**Infrastructure**
- Render (deployment)
- GitHub Actions (CI/CD)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- GitHub Personal Access Token
- Groq API Key (free at [console.groq.com](https://console.groq.com))

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```
GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key
```

```bash
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Usage
1. Open `http://localhost:3000`
2. Enter a GitHub repo (e.g. `facebook/react`)
3. Click **Index Repo** — wait for indexing
4. Ask any WHY question
5. Get cited answer with real GitHub sources

---

## 🔄 CI/CD PR Guard

Add this to your repo's `.github/workflows/pr-guard.yml`:

```yaml
name: ArchGuard PR Guard
on:
  pull_request:
    types: [opened, reopened, synchronize]
jobs:
  archguard:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR against architectural decisions
        run: |
          curl -X POST https://archguard-backend.onrender.com/pr-guard \
            -H "Content-Type: application/json" \
            -d '{
              "repo_name": "${{ github.repository }}",
              "pr_title": "${{ github.event.pull_request.title }}",
              "pr_description": "${{ github.event.pull_request.body }}"
            }'
```

---


## 📄 License

MIT License

Copyright (c) 2026 Janvi Matani

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 👩‍💻 Author

**Janvi Matani** — [github.com/JanviMatani](https://github.com/JanviMatani)
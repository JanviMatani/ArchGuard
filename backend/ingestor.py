# ingestor.py
# 🎯 Kaam: GitHub repo ka historical data fetch karna
# Commits, Pull Requests, Issues — sab ek jagah

import os
from github import Github
from dotenv import load_dotenv

# .env file se API keys load karna
load_dotenv()

# GitHub client banana — token se authenticate karna
# Bina token ke sirf 60 requests/hour, token se 5000/hour
g = Github(os.getenv("GITHUB_TOKEN"))

def fetch_repo_data(repo_name: str) -> list[dict]:
    """
    Ek GitHub repo ka poora data fetch karta hai.
    
    repo_name: "facebook/react" ya "microsoft/vscode" format mein
    Returns: list of documents — har document ek decision/event hai
    """
    
    print(f"📥 Fetching data from {repo_name}...")
    
    repo = g.get_repo(repo_name)
    documents = []  # Yahan saara data store hoga
    
    # ─────────────────────────────────────────
    # PART 1: Pull Requests fetch karna
    # PRs = jahan architectural decisions hote hain
    # "Why did we change X" ka jawab PRs mein hota hai
    # ─────────────────────────────────────────
    print("📌 Fetching Pull Requests...")
    
    pulls = repo.get_pulls(state='closed', sort='created', direction='desc')
    
    pr_count = 0
    for pr in pulls:
        if pr_count >= 100:  # Pehle 100 PRs — free tier ke liye enough
            break
            
        # Har PR ek "document" hai jise hum store karenge
        doc = {
            "type": "pull_request",
            "id": f"PR#{pr.number}",
            "title": pr.title,
            # Body = PR description — yahan decisions explain hote hain
            "content": f"PR #{pr.number}: {pr.title}\n\n{pr.body or 'No description'}",
            "author": pr.user.login,
            "created_at": str(pr.created_at),
            "url": pr.html_url,
            # Labels = tags jaise "breaking-change", "architecture" etc
            "labels": [label.name for label in pr.labels]
        }
        documents.append(doc)
        pr_count += 1
    
    print(f"✅ Fetched {pr_count} Pull Requests")
    
    # ─────────────────────────────────────────
    # PART 2: Commits fetch karna
    # Commits = actual code changes ka record
    # "What changed and when" ka jawab yahan hai
    # ─────────────────────────────────────────
    print("📌 Fetching Commits...")
    
    commits = repo.get_commits()
    
    commit_count = 0
    for commit in commits:
        if commit_count >= 200:  # Pehle 200 commits
            break
            
        doc = {
            "type": "commit",
            "id": commit.sha[:7],  # Short hash — jaise "a3f9c2"
            "title": commit.commit.message.split('\n')[0],  # First line
            "content": f"Commit {commit.sha[:7]}: {commit.commit.message}",
            "author": commit.commit.author.name,
            "created_at": str(commit.commit.author.date),
            "url": commit.html_url,
            "labels": []
        }
        documents.append(doc)
        commit_count += 1
    
    print(f"✅ Fetched {commit_count} Commits")
    
    # ─────────────────────────────────────────
    # PART 3: Issues fetch karna
    # Issues = bugs, feature requests, discussions
    # "Why was this feature built/rejected" ka jawab yahan
    # ─────────────────────────────────────────
    print("📌 Fetching Issues...")
    
    issues = repo.get_issues(state='closed')
    
    issue_count = 0
    for issue in issues:
        if issue_count >= 100:
            break
        if issue.pull_request:  # PRs bhi issues mein aate hain — skip karo
            continue
            
        doc = {
            "type": "issue",
            "id": f"Issue#{issue.number}",
            "title": issue.title,
            "content": f"Issue #{issue.number}: {issue.title}\n\n{issue.body or 'No description'}",
            "author": issue.user.login,
            "created_at": str(issue.created_at),
            "url": issue.html_url,
            "labels": [label.name for label in issue.labels]
        }
        documents.append(doc)
        issue_count += 1
    
    print(f"✅ Fetched {issue_count} Issues")
    print(f"\n🎉 Total documents fetched: {len(documents)}")
    
    return documents


# Test karne ke liye — seedha file run karo
if __name__ == "__main__":
    # Facebook/react use kar rahe hain — judges jaante hain isko
    data = fetch_repo_data("facebook/react")
    print(f"\nSample document:")
    print(data[0])
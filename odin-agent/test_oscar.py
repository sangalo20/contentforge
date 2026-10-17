import json
import requests
import os

# 1. Read transcript
transcript_path = "/Users/sangalo/Development/belrose/content-pipeline/transcripts/Storage 100 Transcripts/Day 106 - FINALE - The Storage Mogul Graduation.txt"
with open(transcript_path, "r", encoding="utf-8") as f:
    # Just take first 5000 characters to keep the test quick and cheap
    transcript_text = f.read()[:5000]

# 2. Read workspace context
workspace_path = "/Users/sangalo/Development/belrose/contentforge/backend/data/workspaces.json"
with open(workspace_path, "r", encoding="utf-8") as f:
    workspaces = json.load(f)

# Find the mogul workspace
mogul_workspace = next((w for w in workspaces if w["id"] == "the-moguls-medium-blogs"), None)

if not mogul_workspace:
    print("Could not find workspace!")
    exit(1)

# 3. Build payload
payload = {
    "transcript": transcript_text,
    "systemPrompt": mogul_workspace.get("systemPrompt", ""),
    "description": mogul_workspace.get("description", ""),
    "wordCount": mogul_workspace.get("wordCount", ""),
    "aiProvider": mogul_workspace.get("aiProvider", ""),
    "aiModel": mogul_workspace.get("aiModel", "")
}

print(f"Sending test request to Odin Agent...")
print(f"Provider: {payload['aiProvider']}")
print(f"Model: {payload['aiModel']}")
print(f"Word Count: {payload['wordCount']}")

# 4. Make request
response = requests.post("http://localhost:8000/api/v1/tasks/generate-campaign", json=payload)

if response.status_code == 200:
    data = response.json()
    print("\n\n--- SUCCESS! Oscar Generated Draft: ---\n")
    print(data.get("data", {}).get("draft", "No draft returned!"))
else:
    print(f"Failed with status code {response.status_code}:")
    print(response.text)

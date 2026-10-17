import os

files_to_fix = [
    "WorkspaceEditor.jsx",
    "WorkspacesDashboard.jsx",
    "WorkspaceLibrary.jsx",
    "Sidebar.jsx",
    "ImageChatModal.jsx",
    "PipelineTrigger.jsx",
    "GlobalHeader.jsx",
    "WorkspaceLayout.jsx",
    "LibraryItemViewer.jsx"
]

base_dir = '/Users/sangalo/Development/belrose/contentforge/frontend/src'

for root, _, files in os.walk(base_dir):
    for f in files:
        if f in files_to_fix:
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            
            original_content = content
            
            # Replace http://localhost:3005 with ${API_BASE} in template literals
            content = content.replace("`http://localhost:3005", "`${API_BASE}")
            # Replace 'http://localhost:3005...' with `${API_BASE}...`
            content = content.replace("'http://localhost:3005", "`${API_BASE}")
            content = content.replace(".jsx'`", ".jsx`") # handle trailing quotes if they got mismatched
            
            # Special case for ImageChatModal.jsx
            if f == "ImageChatModal.jsx":
                content = content.replace("fetch('http://localhost:8000/api/v1/chat/stream'", "fetch(`${odinBase}/api/v1/chat/stream`")
                # Add import for API_BASE and getOdinBase
                if "import { authFetch" in content:
                    content = content.replace("import { authFetch }", "import { authFetch, API_BASE, getOdinBase }")
                elif "import { getIdToken" in content:
                    content = content.replace("import { getIdToken", "import { getIdToken, API_BASE, getOdinBase")
                    
                # Insert odinBase fetch inside handleSubmit
                if "const handleSubmit = async (e) => {" in content:
                    content = content.replace("const handleSubmit = async (e) => {", "const handleSubmit = async (e) => {\n    const odinBase = await getOdinBase();")
            else:
                # Add import for API_BASE if authFetch is imported
                if "import { authFetch" in content and "API_BASE" not in content:
                    content = content.replace("import { authFetch", "import { authFetch, API_BASE")
            
            # Fix the quote issue from replacing 'http... with `${API_BASE}...
            # We need to make sure the trailing single quote becomes a backtick
            # e.g. `${API_BASE}/api/workspaces'` -> `${API_BASE}/api/workspaces`
            import re
            content = re.sub(r"(\$\{API_BASE\}[^']+)'", r"\1`", content)

            if content != original_content:
                print(f"Fixed {f}")
                with open(path, 'w') as file:
                    file.write(content)


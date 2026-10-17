#!/usr/bin/env python3
"""Create one Google Doc per knowledge-base episode file and move them into a folder.

WHY THIS EXISTS (hard-won this session):
  1. `google_api.py docs create --body "$(cat big.txt)"` FAILS for full episode docs with
     "Argument list too long" — the body is a CLI arg. The CLI then prints nothing, so a piped
     json.loads throws "Expecting value: line 1 column 1". Fix = create with the FIRST chunk,
     then `docs append` the rest in chunks.
  2. Calling google_api.py via subprocess with bare 'python' resolves to an interpreter WITHOUT
     googleapiclient (ModuleNotFoundError). Fix = invoke the absolute venv python explicitly.
  3. Drive has no `move` subcommand and new docs land at root. Fix = reparent via the Drive API
     loaded as a module (build_service).

USAGE: edit VENV_PY/GAPI_PATH for the current user, set KB dir, FOLDER id, and the DOCS list
       (filename, doc title), then run with the venv python:
       <venv python> make_docs.py
"""
import subprocess, os, json, importlib.util, sys

# --- configure these for the host/run ---
USER = os.environ.get("USERNAME") or os.path.basename(os.path.expanduser("~"))
VENV_PY = rf"C:/Users/{USER}/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
GAPI_PATH = rf"C:/Users/{USER}/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py"
KB = rf"C:/Users/{USER}/sm_tx_work/kb"          # folder holding the DayNN.txt episode files
FOLDER = "PUT_KNOWLEDGE_BASE_FOLDER_ID_HERE"     # Storage100 Knowledge Base folder id
DOCS = [
    # (filename in KB, Google Doc title)
    # ("Day06.txt", "Storage 100 — Day 6 — ..."),
]
CHUNK = 8000   # safe well under the CLI arg-length limit
# -----------------------------------------

GAPI = [VENV_PY, GAPI_PATH]

def run(args):
    r = subprocess.run(GAPI + args, capture_output=True, text=True, encoding="utf-8")
    return r.returncode, r.stdout, r.stderr

def create_doc(title, body):
    rc, out, err = run(["docs", "create", "--title", title, "--body", body[:CHUNK]])
    if rc != 0:
        return None, err[-300:]
    try:
        doc_id = json.loads(out)["documentId"]
    except Exception:
        return None, f"parse fail: {out[:200]} | {err[-200:]}"
    for i in range(CHUNK, len(body), CHUNK):
        rc2, _, err2 = run(["docs", "append", doc_id, "--text", body[i:i+CHUNK]])
        if rc2 != 0:
            return doc_id, f"append fail @{i}: {err2[-200:]}"
    return doc_id, None

def get_drive_service():
    spec = importlib.util.spec_from_file_location("gapi", GAPI_PATH)
    gapi = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gapi)
    return gapi.build_service("drive", "v3")

def main():
    created = []
    for fname, title in DOCS:
        body = open(os.path.join(KB, fname), encoding="utf-8").read()
        doc_id, errmsg = create_doc(title, body)
        if not doc_id:
            print(f"FAIL {fname}: {errmsg}")
            continue
        print(f"created {fname} -> {doc_id}" + (f"  (WARN {errmsg})" if errmsg else ""))
        created.append((fname, doc_id))

    if FOLDER and not FOLDER.startswith("PUT_"):
        svc = get_drive_service()
        for fname, doc_id in created:
            f = svc.files().get(fileId=doc_id, fields="id,parents").execute()
            prev = ",".join(f.get("parents", []))
            svc.files().update(fileId=doc_id, addParents=FOLDER,
                               removeParents=prev, fields="id,parents").execute()
            print(f"moved {fname} -> {FOLDER}")
        res = svc.files().list(q=f"'{FOLDER}' in parents and trashed=false",
                               fields="files(name,id)", pageSize=100).execute()
        print("\nfolder now contains:")
        for x in res.get("files", []):
            print("  ", x["name"])

if __name__ == "__main__":
    main()

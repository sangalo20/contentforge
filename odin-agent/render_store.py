"""Durable storage for rendered artifacts (carousel PDFs, poster PNGs).

On Cloud Run the service scales to multiple instances, and a render created on
instance A must be downloadable from instance B. With RENDERS_BUCKET set, files
are stored in GCS under odin-renders/{file_id}/{filename}; without it (local
dev, single machine) they stay in the system temp dir exactly as before.
"""

import glob
import logging
import os
import tempfile

RENDERS_BUCKET = os.getenv("RENDERS_BUCKET")
RENDERS_PREFIX = "odin-renders"

logger = logging.getLogger("render_store")

_storage_client = None


def _bucket():
    global _storage_client
    if _storage_client is None:
        from google.cloud import storage
        _storage_client = storage.Client()
    return _storage_client.bucket(RENDERS_BUCKET)


def store(file_id: str, path: str) -> None:
    """Persist a freshly rendered file. Blocking — call from sync code or a
    worker thread. Fails open: a storage error leaves the temp file in place
    so single-instance downloads still work."""
    if not RENDERS_BUCKET:
        return
    try:
        blob = _bucket().blob(f"{RENDERS_PREFIX}/{file_id}/{os.path.basename(path)}")
        blob.upload_from_filename(path)
    except Exception as e:
        logger.error(f"Failed to upload render {file_id} to GCS (serving from local temp): {e}")


def fetch(file_id: str, ext: str):
    """Return (filename, content_bytes) for a stored render, or None.

    Checks GCS first (any-instance downloads), then the local temp dir (local
    dev, or an upload that failed open).
    """
    if RENDERS_BUCKET:
        try:
            for blob in _bucket().list_blobs(prefix=f"{RENDERS_PREFIX}/{file_id}/"):
                if blob.name.endswith(ext):
                    return os.path.basename(blob.name), blob.download_as_bytes()
        except Exception as e:
            logger.error(f"Failed to fetch render {file_id} from GCS: {e}")

    matches = glob.glob(os.path.join(tempfile.gettempdir(), f"*_{file_id}{ext}"))
    if matches:
        with open(matches[0], "rb") as f:
            return os.path.basename(matches[0]), f.read()
    return None

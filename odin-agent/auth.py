"""
End-user identity for the Odin Agent service.

Odin is a backend-only service: Cloud Run IAM authenticates the caller (only
the ContentForge backend service account holds ``roles/run.invoker``) before a
request ever reaches this app. The trusted caller has already verified the end
user via Firebase and forwards their identity in headers.
"""

from fastapi import Request


async def get_forwarded_user(request: Request) -> dict:
    """Read the end-user identity forwarded by the trusted caller.

    We do not re-verify the end user here; Cloud Run IAM has authenticated the
    calling service, which forwards the user's identity in ``X-User-Id`` /
    ``X-User-Email`` headers for logging/context.
    """
    return {
        "uid": request.headers.get("X-User-Id", ""),
        "email": request.headers.get("X-User-Email", ""),
    }

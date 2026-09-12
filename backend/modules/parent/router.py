"""
Parent Module Router - a WhatsApp digest, not a portal. There's no
parent-child account relationship in this app's data model and no parent
login; a guardian's phone number is a delivery preference on the
student's own User row (see models/user.py). This endpoint is
cron-callable (see .github/workflows/parent-digest.yml), not
user-facing - it's gated by a shared secret header rather than
get_current_user.
"""

import os
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.whatsapp import send_whatsapp_message
from modules.parent.digest import build_digest_text, eligible_users_for_digest

router = APIRouter(tags=["parent"])


@router.get("/")
async def parent_root():
    return {"module": "parent", "status": "active"}


@router.post("/send-digests")
async def send_digests(x_digest_secret: str = Header(...), db: Session = Depends(get_db)):
    expected = os.getenv("DIGEST_TRIGGER_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="Digest sending is not configured")
    if x_digest_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid digest secret")

    sent = skipped = failed = 0
    for user in eligible_users_for_digest(db):
        text = build_digest_text(db, user)
        if not text:
            skipped += 1
            continue
        if send_whatsapp_message(to=user.guardian_phone, body=text):
            user.last_digest_sent_at = datetime.utcnow()
            db.commit()
            sent += 1
        else:
            failed += 1

    return {"success": True, "sent": sent, "skipped": skipped, "failed": failed}

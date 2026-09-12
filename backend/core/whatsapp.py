"""
Minimal Twilio WhatsApp sender. Lazily configured via env vars, mirroring
core/email.py's pattern: no crash and no new required env var for local
dev/CI - if Twilio isn't configured, the message is logged instead of
sent. Real sending only activates once TWILIO_ACCOUNT_SID/AUTH_TOKEN/
WHATSAPP_FROM are set (e.g. in production).

Business-initiated messages (a periodic digest the parent never asked
for in the last 24 hours) require a pre-approved Content Template
(content_sid) per Twilio/WhatsApp Business Platform policy - freeform
body text only works within an active customer-service window. content_sid
is the real production path; body is what's usable for dev/sandbox testing
before a template exists and gets approved.
"""

import json
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

TWILIO_API_URL = "https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"


def send_whatsapp_message(
    to: str,
    body: Optional[str] = None,
    content_sid: Optional[str] = None,
    content_variables: Optional[dict] = None,
) -> bool:
    if not body and not content_sid:
        raise ValueError("Either body or content_sid is required")

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM")

    if not account_sid or not auth_token or not from_number:
        logger.info(f"[DEV] WhatsApp to {to} not sent (Twilio not configured). Body: {body}")
        return True

    data = {"From": f"whatsapp:{from_number}", "To": f"whatsapp:{to}"}
    if content_sid:
        data["ContentSid"] = content_sid
        if content_variables:
            data["ContentVariables"] = json.dumps(content_variables)
    else:
        data["Body"] = body

    try:
        response = requests.post(
            TWILIO_API_URL.format(account_sid=account_sid),
            data=data,
            auth=(account_sid, auth_token),
            timeout=10,
        )
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to}: {e}")
        return False

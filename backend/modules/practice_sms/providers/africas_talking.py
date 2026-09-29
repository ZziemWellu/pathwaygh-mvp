"""
Africa's Talking SMS adapter. Covers GH/NG/GM per the coverage findings
in the Sept 2026 feature-phone-fallback scoping doc - Sierra Leone and
Liberia are NOT listed in Africa's Talking's coverage and need a
separate provider before they can be offered honestly (see
providers/__init__.py's PROVIDERS_BY_COUNTRY).

Raw REST via requests, not the official SDK - same choice already made
for core/whatsapp.py's Twilio integration and modules/payment/providers/
paystack.py, keeping this app dependency-free for third-party API calls.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

SMS_API_URL = "https://api.africastalking.com/version1/messaging"


def send_sms(*, to: str, message: str) -> bool:
    username = os.getenv("AFRICAS_TALKING_USERNAME")
    api_key = os.getenv("AFRICAS_TALKING_API_KEY")
    sender_id = os.getenv("AFRICAS_TALKING_SENDER_ID")

    if not username or not api_key:
        logger.info(f"[DEV] SMS to {to} not sent (Africa's Talking not configured). Message: {message}")
        return True

    data = {"username": username, "to": to, "message": message}
    if sender_id:
        data["from"] = sender_id

    try:
        response = requests.post(
            SMS_API_URL,
            data=data,
            headers={
                "apiKey": api_key,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        body = response.json()
        recipients = body.get("SMSMessageData", {}).get("Recipients", [])
        # A 200 response can still carry a per-recipient failure (bad
        # number, insufficient balance) inside this array rather than as
        # an HTTP error - checking it is what makes "success" here mean
        # the message actually reached the carrier, not just that the
        # HTTP call didn't throw.
        if not recipients:
            logger.error(f"Africa's Talking returned no recipients for {to}: {body}")
            return False
        return all(r.get("status") == "Success" for r in recipients)
    except Exception as e:
        logger.error(f"Failed to send SMS to {to} via Africa's Talking: {e}")
        return False

"""
Minimal SMTP email sender. Lazily configured via env vars, mirroring the
GEMINI_API_KEY pattern in modules/tutor/router.py: no crash and no new
required env var for local dev/CI - if SMTP_HOST isn't set, the message
is logged instead of sent, so registration/consent flows keep working
without any email account configured. Real sending only activates once
SMTP_HOST etc. are set (e.g. in production).
"""

import logging
import os
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST")
    if not host:
        logger.info(f"[DEV] Email to {to} not sent (SMTP_HOST not configured). Subject: {subject}\n{body}")
        return True

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", user or "no-reply@pathwaygh.com")

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                if user and password:
                    server.login(user, password)
                server.sendmail(sender, [to], message.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                if user and password:
                    server.login(user, password)
                server.sendmail(sender, [to], message.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False

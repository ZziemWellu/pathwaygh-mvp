"""Phone numbers in the five countries the platform serves. Numbers are held
in E.164 and must belong to the student's own country, so a sign-up form
can't be used to send paid SMS to arbitrary international numbers."""

import re

# Calling code, and the allowed digit counts after it.
COUNTRY_PHONE_RULES = {
    "GH": ("233", (9,)),
    "NG": ("234", (10,)),
    "SL": ("232", (8,)),
    "LR": ("231", (7, 8, 9)),
    "GM": ("220", (7,)),
}


def normalize_phone(raw: str, country: str) -> str:
    """Accepts '024 123 4567', '0241234567', '233241234567', '00233241234567'
    or '+233241234567' and returns '+233241234567'. Raises ValueError if the
    number isn't a valid length for that country or belongs to another one."""
    code, lengths = COUNTRY_PHONE_RULES[country]
    cleaned = re.sub(r"[\s\-().]", "", raw or "")
    if cleaned.startswith("+"):
        digits = cleaned[1:]
        international = True
    elif cleaned.startswith("00"):
        digits = cleaned[2:]
        international = True
    else:
        digits = cleaned
        international = digits.startswith(code) and len(digits) - len(code) in lengths

    if not digits.isdigit():
        raise ValueError("Enter a valid phone number, for example 024 123 4567")
    if international:
        if not digits.startswith(code):
            raise ValueError(f"Enter a phone number from your country (+{code})")
        national = digits[len(code):]
    else:
        national = digits[1:] if digits.startswith("0") else digits
    if len(national) not in lengths:
        raise ValueError("That phone number is the wrong length - please check it")
    return f"+{code}{national}"


def mask_phone(phone: str) -> str:
    """'+233241234567' -> '+233 ••• 4567' - enough for a student to recognise
    the number without showing a parent's full number on screen."""
    code = next((c for c, _ in COUNTRY_PHONE_RULES.values() if phone.startswith(f"+{c}")), None)
    prefix = f"+{code}" if code else phone[:4]
    return f"{prefix} ••• {phone[-4:]}"

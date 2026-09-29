"""
Paystack adapter - the payment abstraction's first real implementation.
Covers Ghana (GHS) and Nigeria (NGN) only; Paystack does not support
Sierra Leonean Leone, Liberian Dollar, or Gambian Dalasi, so SL/LR/GM
need a different provider before the institutional tier can serve
schools in those 3 countries (see modules/payment/providers/__init__.py's
registry for Flutterwave/MTN MoMo, not yet integrated).
"""

import os

import requests

PAYSTACK_BASE_URL = "https://api.paystack.co"
SUPPORTED_CURRENCIES = {"GHS", "NGN"}
_REQUEST_TIMEOUT_SECONDS = 15


def _secret_key() -> str:
    key = os.getenv("PAYSTACK_SECRET_KEY")
    if not key:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not set")
    return key


def _headers() -> dict:
    return {"Authorization": f"Bearer {_secret_key()}", "Content-Type": "application/json"}


def initialize(*, reference, amount_minor_units, currency, email, callback_url, metadata):
    if currency not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Paystack does not support {currency} - supported currencies: {sorted(SUPPORTED_CURRENCIES)}")

    response = requests.post(
        f"{PAYSTACK_BASE_URL}/transaction/initialize",
        headers=_headers(),
        json={
            "reference": reference,
            "amount": amount_minor_units,
            "currency": currency,
            "email": email,
            "callback_url": callback_url,
            "metadata": metadata or {},
        },
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )
    body = response.json()
    if not response.ok or not body.get("status"):
        raise RuntimeError(f"Paystack initialize failed: {body.get('message', response.text)}")

    data = body["data"]
    return {
        "external_reference": data["reference"],
        "checkout_url": data["authorization_url"],
        "provider_status": "initialized",
    }


def verify(*, reference, external_reference):
    lookup_reference = external_reference or reference
    response = requests.get(
        f"{PAYSTACK_BASE_URL}/transaction/verify/{lookup_reference}",
        headers=_headers(),
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )
    body = response.json()
    if not response.ok or not body.get("status"):
        raise RuntimeError(f"Paystack verify failed: {body.get('message', response.text)}")

    # response.status is whether the API CALL succeeded; the actual
    # transaction status is response.data.status ("success" / "failed" /
    # "abandoned") - these are deliberately not the same thing.
    provider_status = body["data"]["status"]
    normalized_status = provider_status if provider_status in {"success", "failed", "abandoned"} else "pending"
    return {"status": normalized_status, "provider_status": provider_status}

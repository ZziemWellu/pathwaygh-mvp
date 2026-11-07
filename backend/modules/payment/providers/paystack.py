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


# A Paystack business takes payments in the currency of the country it's
# registered in, so each country has its own business and secret key. Ghana's
# may also use the original variable name. Nigeria has no fallback: sending
# naira to a Ghanaian business would only fail at checkout.
_KEY_VARIABLES = {
    "GHS": ("PAYSTACK_SECRET_KEY_GHS", "PAYSTACK_SECRET_KEY"),
    "NGN": ("PAYSTACK_SECRET_KEY_NGN",),
}


def secret_key_for(currency: str):
    for variable in _KEY_VARIABLES.get(currency, ()):
        key = os.getenv(variable)
        if key:
            return key
    return None


def all_secret_keys() -> list:
    """Every configured key. A webhook is signed with one of them."""
    keys = {secret_key_for(currency) for currency in _KEY_VARIABLES}
    return sorted(key for key in keys if key)


def is_configured(currency: str) -> bool:
    return secret_key_for(currency) is not None


def _headers(currency: str) -> dict:
    key = secret_key_for(currency)
    if not key:
        raise RuntimeError(f"No Paystack key is set for {currency}")
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def initialize(*, reference, amount_minor_units, currency, email, callback_url, metadata):
    if currency not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Paystack does not support {currency} - supported currencies: {sorted(SUPPORTED_CURRENCIES)}")

    response = requests.post(
        f"{PAYSTACK_BASE_URL}/transaction/initialize",
        headers=_headers(currency),
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


def verify(*, reference, external_reference, currency="GHS"):
    lookup_reference = external_reference or reference
    response = requests.get(
        f"{PAYSTACK_BASE_URL}/transaction/verify/{lookup_reference}",
        headers=_headers(currency),
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )
    body = response.json()
    if not response.ok or not body.get("status"):
        raise RuntimeError(f"Paystack verify failed: {body.get('message', response.text)}")

    # response.status is whether the API CALL succeeded; the actual
    # transaction status is response.data.status ("success" / "failed" /
    # "abandoned") - these are deliberately not the same thing.
    data = body["data"]
    provider_status = data["status"]
    normalized_status = provider_status if provider_status in {"success", "failed", "abandoned"} else "pending"
    # Amount and currency as Paystack actually charged them - the router
    # compares these against what was quoted before granting anything.
    return {
        "status": normalized_status,
        "provider_status": provider_status,
        "amount_minor_units": data.get("amount"),
        "currency": data.get("currency"),
    }

"""
Payment-provider registry. No single gateway covers Ghana, Nigeria,
Sierra Leone, Liberia, and The Gambia well (see the Sept 2026 cross-
continent research this was built from) - this registry is what lets
modules/payment/router.py stay provider-agnostic rather than hard-wiring
one gateway's API into the endpoint logic.

Every entry exposes the same two-function shape:
    initialize(*, reference, amount_minor_units, currency, email,
               callback_url, metadata) -> {"external_reference", "checkout_url", "provider_status"}
    verify(*, reference, external_reference) -> {"status", "provider_status"}
      where status is one of "success" | "failed" | "abandoned" | "pending"

Only Paystack is actually wired up today. Flutterwave and MTN MoMo
(direct) are registered so the router and its Literal validation already
know about them, but calling either raises ProviderNotIntegrated rather
than faking success - same honesty principle already applied to every
stub module elsewhere in this app (see modules/activity, /analytics,
etc. from the September 2026 audit).
"""

from modules.payment.providers import paystack


class ProviderNotIntegrated(Exception):
    pass


def _unavailable_initialize(provider_display_name: str, **_kwargs):
    raise ProviderNotIntegrated(f"{provider_display_name} is not yet integrated - only Paystack is currently wired up.")


def _unavailable_verify(provider_display_name: str, **_kwargs):
    raise ProviderNotIntegrated(f"{provider_display_name} is not yet integrated - only Paystack is currently wired up.")


PROVIDERS = {
    "paystack": {
        "initialize": paystack.initialize,
        "verify": paystack.verify,
        "supported_currencies": paystack.SUPPORTED_CURRENCIES,
    },
    # supported_currencies here is provisional (what these providers would
    # plausibly support once wired up, not independently verified the way
    # Paystack's was) - deliberately non-empty so a currency check doesn't
    # mask the real reason for failure: it's the ProviderNotIntegrated 503
    # below that should fire, not a misleading "wrong currency" 400.
    "flutterwave": {
        "initialize": lambda **kw: _unavailable_initialize("Flutterwave", **kw),
        "verify": lambda **kw: _unavailable_verify("Flutterwave", **kw),
        "supported_currencies": {"GHS", "NGN"},
    },
    "mtn_momo": {
        "initialize": lambda **kw: _unavailable_initialize("MTN MoMo (direct)", **kw),
        "verify": lambda **kw: _unavailable_verify("MTN MoMo (direct)", **kw),
        "supported_currencies": {"GHS", "NGN"},
    },
}


def get_provider(name: str) -> dict:
    provider = PROVIDERS.get(name)
    if provider is None:
        raise ValueError(f"Unknown payment provider: {name}")
    return provider

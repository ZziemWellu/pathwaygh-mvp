"""
SMS-provider-by-country registry. Unlike modules/payment/providers/,
where the caller (school admin) picks a provider, here the ability to
send SMS at all is inherent to the recipient's country - Africa's
Talking covers Ghana, Nigeria, and The Gambia; Sierra Leone and Liberia
are not covered by it or any other confirmed-available provider yet
(see the Sept 2026 feature-phone-fallback scoping doc). Registering
them here as honest ProviderNotIntegrated stubs, rather than omitting
them, keeps the gap visible in code instead of silently unhandled.
"""

from modules.practice_sms.providers import africas_talking


class ProviderNotIntegrated(Exception):
    pass


def _unavailable_send(country_display_name: str, **_kwargs):
    raise ProviderNotIntegrated(
        f"SMS delivery for {country_display_name} is not yet integrated - no provider with confirmed "
        "coverage there is wired up yet. See the feature-phone-fallback scoping doc."
    )


PROVIDERS_BY_COUNTRY = {
    "GH": {"send": africas_talking.send_sms},
    "NG": {"send": africas_talking.send_sms},
    "GM": {"send": africas_talking.send_sms},
    "SL": {"send": lambda **kw: _unavailable_send("Sierra Leone", **kw)},
    "LR": {"send": lambda **kw: _unavailable_send("Liberia", **kw)},
}


def get_provider_for_country(country: str) -> dict:
    provider = PROVIDERS_BY_COUNTRY.get(country)
    if provider is None:
        raise ValueError(f"Unsupported country: {country}")
    return provider

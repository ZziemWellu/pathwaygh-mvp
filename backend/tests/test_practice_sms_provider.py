import logging

import pytest

from modules.practice_sms.providers import ProviderNotIntegrated, get_provider_for_country
from modules.practice_sms.providers.africas_talking import send_sms


def test_dev_fallback_logs_instead_of_sending(caplog, monkeypatch):
    monkeypatch.delenv("AFRICAS_TALKING_USERNAME", raising=False)
    monkeypatch.delenv("AFRICAS_TALKING_API_KEY", raising=False)
    caplog.set_level(logging.INFO)

    result = send_sms(to="+233241234567", message="Hello student")

    assert result is True
    assert "not sent (Africa's Talking not configured)" in caplog.text
    assert "Hello student" in caplog.text


def test_sends_via_africas_talking_when_configured(monkeypatch):
    monkeypatch.setenv("AFRICAS_TALKING_USERNAME", "sandbox")
    monkeypatch.setenv("AFRICAS_TALKING_API_KEY", "fakekey")

    captured = {}

    class _FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"SMSMessageData": {"Recipients": [{"status": "Success", "number": "+233241234567"}]}}

    def _fake_post(url, data=None, headers=None, timeout=None):
        captured["url"] = url
        captured["data"] = data
        captured["headers"] = headers
        return _FakeResponse()

    monkeypatch.setattr("modules.practice_sms.providers.africas_talking.requests.post", _fake_post)

    result = send_sms(to="+233241234567", message="Hello")

    assert result is True
    assert captured["url"] == "https://api.africastalking.com/version1/messaging"
    assert captured["data"]["username"] == "sandbox"
    assert captured["data"]["to"] == "+233241234567"
    assert captured["data"]["message"] == "Hello"
    assert captured["headers"]["apiKey"] == "fakekey"


def test_a_per_recipient_failure_inside_a_200_response_is_reported_as_failure(monkeypatch):
    """Africa's Talking can return HTTP 200 while still reporting a
    per-recipient failure (bad number, insufficient balance) inside the
    Recipients array - a naive raise_for_status()-only check would
    misreport this as success."""
    monkeypatch.setenv("AFRICAS_TALKING_USERNAME", "sandbox")
    monkeypatch.setenv("AFRICAS_TALKING_API_KEY", "fakekey")

    class _FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"SMSMessageData": {"Recipients": [{"status": "InvalidPhoneNumber"}]}}

    monkeypatch.setattr("modules.practice_sms.providers.africas_talking.requests.post", lambda *a, **kw: _FakeResponse())

    assert send_sms(to="+233241234567", message="Hello") is False


def test_returns_false_on_send_failure(monkeypatch):
    monkeypatch.setenv("AFRICAS_TALKING_USERNAME", "sandbox")
    monkeypatch.setenv("AFRICAS_TALKING_API_KEY", "fakekey")

    def _fake_post(*args, **kwargs):
        raise ConnectionError("boom")

    monkeypatch.setattr("modules.practice_sms.providers.africas_talking.requests.post", _fake_post)

    assert send_sms(to="+233241234567", message="Hello") is False


def test_provider_registry_covers_africas_talking_countries():
    for country in ("GH", "NG", "GM"):
        provider = get_provider_for_country(country)
        assert provider["send"] is send_sms


def test_provider_registry_is_honest_about_unintegrated_countries():
    for country in ("SL", "LR"):
        provider = get_provider_for_country(country)
        with pytest.raises(ProviderNotIntegrated):
            provider["send"](to="+23276000000", message="hi")

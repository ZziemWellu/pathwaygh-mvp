import logging

import pytest

from core.whatsapp import send_whatsapp_message


def test_dev_fallback_logs_instead_of_sending(caplog, monkeypatch):
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    monkeypatch.delenv("TWILIO_WHATSAPP_FROM", raising=False)
    caplog.set_level(logging.INFO)

    result = send_whatsapp_message(to="+233241234567", body="Hello guardian")

    assert result is True
    assert "not sent (Twilio not configured)" in caplog.text
    assert "Hello guardian" in caplog.text


def test_requires_body_or_content_sid():
    with pytest.raises(ValueError):
        send_whatsapp_message(to="+233241234567")


def test_body_alone_is_sufficient(caplog, monkeypatch):
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    caplog.set_level(logging.INFO)
    assert send_whatsapp_message(to="+233241234567", body="hi") is True


def test_content_sid_alone_is_sufficient(caplog, monkeypatch):
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    caplog.set_level(logging.INFO)
    assert send_whatsapp_message(to="+233241234567", content_sid="HXfake") is True


def test_sends_via_twilio_api_when_configured(monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "ACfake")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "tokenfake")
    monkeypatch.setenv("TWILIO_WHATSAPP_FROM", "+14155238886")

    captured = {}

    class _FakeResponse:
        def raise_for_status(self):
            pass

    def _fake_post(url, data=None, auth=None, timeout=None):
        captured["url"] = url
        captured["data"] = data
        captured["auth"] = auth
        return _FakeResponse()

    monkeypatch.setattr("core.whatsapp.requests.post", _fake_post)

    result = send_whatsapp_message(to="+233241234567", body="Hello")

    assert result is True
    assert captured["url"] == "https://api.twilio.com/2010-04-01/Accounts/ACfake/Messages.json"
    assert captured["data"]["From"] == "whatsapp:+14155238886"
    assert captured["data"]["To"] == "whatsapp:+233241234567"
    assert captured["data"]["Body"] == "Hello"
    assert captured["auth"] == ("ACfake", "tokenfake")


def test_returns_false_on_send_failure(monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "ACfake")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "tokenfake")
    monkeypatch.setenv("TWILIO_WHATSAPP_FROM", "+14155238886")

    def _fake_post(*args, **kwargs):
        raise ConnectionError("boom")

    monkeypatch.setattr("core.whatsapp.requests.post", _fake_post)

    assert send_whatsapp_message(to="+233241234567", body="Hello") is False

from core.frontend_urls import DEFAULT_FRONTEND_URL, frontend_urls, primary_frontend_url


def test_default_when_unset(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    assert frontend_urls() == [DEFAULT_FRONTEND_URL]
    assert primary_frontend_url() == DEFAULT_FRONTEND_URL


def test_single_address(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://www.learninghotspot.africa/")
    assert frontend_urls() == ["https://www.learninghotspot.africa"]


def test_several_addresses_first_is_primary(monkeypatch):
    monkeypatch.setenv(
        "FRONTEND_URL",
        " https://www.learninghotspot.africa, https://learninghotspot.africa ,"
        "https://pathwaygh-frontend.onrender.com,,https://learninghotspot.africa",
    )
    assert frontend_urls() == [
        "https://www.learninghotspot.africa",
        "https://learninghotspot.africa",
        "https://pathwaygh-frontend.onrender.com",
    ]
    assert primary_frontend_url() == "https://www.learninghotspot.africa"


def test_blank_falls_back_to_default(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", " , ")
    assert frontend_urls() == [DEFAULT_FRONTEND_URL]

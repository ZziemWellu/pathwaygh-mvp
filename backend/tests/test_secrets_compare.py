from core.secrets_compare import secrets_match


def test_secrets_match():
    assert secrets_match("s3cret", "s3cret")
    assert not secrets_match("s3cret", "s3creT")
    assert not secrets_match("", "s3cret")
    assert not secrets_match(None, "s3cret")
    assert not secrets_match("s3cret", None)
    assert not secrets_match("s3cret", "")


def test_digest_trigger_rejects_wrong_secret(client, monkeypatch):
    monkeypatch.setenv("DIGEST_TRIGGER_SECRET", "right-secret")
    response = client.post("/api/parent/send-digests", headers={"X-Digest-Secret": "wrong-secret"})
    assert response.status_code == 401

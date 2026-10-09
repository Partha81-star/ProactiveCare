from types import SimpleNamespace

from app.voice import transcription


def test_transcribes_browser_recording(client, monkeypatch):
    monkeypatch.setattr(
        transcription,
        "get_settings",
        lambda: SimpleNamespace(GEMINI_API_KEY="test-key", GEMINI_MODEL="test-model"),
    )
    monkeypatch.setattr(
        transcription.genai,
        "Client",
        lambda **kwargs: SimpleNamespace(
            models=SimpleNamespace(
                generate_content=lambda **kwargs: SimpleNamespace(text="  Rahul Sharma  ")
            )
        ),
    )

    response = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("answer.webm", b"recorded speech", "audio/webm")},
    )

    assert response.status_code == 200
    assert response.json() == {"text": "Rahul Sharma"}


def test_rejects_empty_recording(client, monkeypatch):
    monkeypatch.setattr(
        transcription,
        "get_settings",
        lambda: SimpleNamespace(GEMINI_API_KEY="test-key", GEMINI_MODEL="test-model"),
    )
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("answer.webm", b"", "audio/webm")},
    )
    assert response.status_code == 400


def test_requires_transcription_configuration(client, monkeypatch):
    monkeypatch.setattr(
        transcription,
        "get_settings",
        lambda: SimpleNamespace(GEMINI_API_KEY="", GEMINI_MODEL="test-model"),
    )
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("answer.webm", b"recorded speech", "audio/webm")},
    )
    assert response.status_code == 503

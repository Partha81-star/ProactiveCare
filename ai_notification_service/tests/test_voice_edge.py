"""The public tunnel must never expose simulator or notification endpoints."""
import importlib.util
from pathlib import Path
import httpx
from fastapi.testclient import TestClient

spec = importlib.util.spec_from_file_location('voice_edge', Path(__file__).resolve().parents[2] / 'scripts/voice_edge.py')
edge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(edge)


def test_private_routes_are_not_published():
    client = TestClient(edge.app)
    for path in ['/docs', '/api/v1/notify', '/api/v1/voice/local/simulate', '/api/patients/', '/api/v1/voice/webhook']:
        assert client.post(path, json={}).status_code == 404


def test_signed_callback_and_query_forwarded(monkeypatch):
    async_client = httpx.AsyncClient
    def upstream(request):
        assert str(request.url) == 'http://127.0.0.1:8001/api/v1/voice/process?step=4'
        assert request.headers['X-Twilio-Signature'] == 'signature'
        assert b'CallSid=CA-test-call' in request.content
        return httpx.Response(200, text='<Response><Gather/></Response>', headers={'Content-Type': 'application/xml'})
    monkeypatch.setattr(edge.httpx, 'AsyncClient', lambda **kwargs: async_client(transport=httpx.MockTransport(upstream), **kwargs))
    response = TestClient(edge.app).post('/api/v1/voice/process?step=4',
        data={'CallSid': 'CA-test-call'}, headers={'X-Twilio-Signature': 'signature'})
    assert response.status_code == 200
    assert '<Gather/>' in response.text


def test_upstream_signature_rejection_preserved(monkeypatch):
    async_client = httpx.AsyncClient
    monkeypatch.setattr(edge.httpx, 'AsyncClient', lambda **kwargs: async_client(
        transport=httpx.MockTransport(lambda request: httpx.Response(403, json={'detail': 'Invalid Twilio signature'})), **kwargs))
    response = TestClient(edge.app).post('/api/v1/voice/incoming', data={})
    assert response.status_code == 403

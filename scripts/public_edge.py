"""One public HTTPS origin for the built portal and the protected local APIs.

Run this only behind an HTTPS tunnel. The database and service ports remain
bound to 127.0.0.1; this edge exposes selected staff and Twilio routes.
"""

from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, Response


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'mediconnect-ai' / 'dist'
BACKEND = 'http://127.0.0.1:8010'
VOICE = 'http://127.0.0.1:8001'
STAFF_ROUTES = {'auth', 'doctors', 'patients', 'appointments', 'notifications'}
VOICE_ROUTES = {'incoming', 'process', 'status-callback', 'local/simulate', 'transcribe'}
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


async def forward(request: Request, upstream: str) -> Response:
    path = request.url.path
    if request.url.query:
        path += '?' + request.url.query
    headers = {}
    for name in ('content-type', 'authorization', 'x-twilio-signature'):
        if value := request.headers.get(name):
            headers[name] = value
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            result = await client.request(
                request.method, upstream + path,
                content=await request.body(), headers=headers,
            )
    except httpx.HTTPError:
        return Response('Service temporarily unavailable', status_code=503)
    return Response(
        result.content, status_code=result.status_code,
        headers={'content-type': result.headers.get('content-type', 'application/octet-stream')},
    )


@app.api_route('/api/v1/voice/{operation:path}', methods=['POST'])
async def voice(operation: str, request: Request):
    if operation not in VOICE_ROUTES:
        raise HTTPException(404)
    return await forward(request, VOICE)


@app.api_route('/api/{operation:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
async def staff(operation: str, request: Request):
    if operation.split('/', 1)[0] not in STAFF_ROUTES:
        raise HTTPException(404)
    return await forward(request, BACKEND)


@app.get('/health')
async def health():
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            backend = await client.get(BACKEND + '/health/ready')
            voice = await client.get(VOICE + '/api/v1/health')
        except httpx.HTTPError:
            raise HTTPException(503, 'Local services unavailable')
    if backend.status_code != 200 or voice.status_code != 200:
        raise HTTPException(503, 'Local services unavailable')
    return {'status': 'ready'}


@app.get('/{asset_path:path}')
async def portal(asset_path: str):
    if not (DIST / 'index.html').is_file():
        raise HTTPException(503, 'Build the frontend before starting the public edge')
    target = (DIST / asset_path).resolve()
    if target.is_relative_to(DIST.resolve()) and target.is_file():
        return FileResponse(target)
    if '.' in Path(asset_path).name:
        raise HTTPException(404)
    return FileResponse(DIST / 'index.html')

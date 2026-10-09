"""Public tunnel entry point: exposes Twilio callbacks only, never patient APIs."""
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
ALLOWED = {'incoming', 'process', 'status-callback'}


@app.post('/api/v1/voice/{operation}')
async def forward(operation: str, request: Request):
    if operation not in ALLOWED:
        raise HTTPException(404)
    path = request.url.path
    if request.url.query:
        path += '?' + request.url.query
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            upstream = await client.post('http://127.0.0.1:8001' + path,
                content=await request.body(), headers={
                    'Content-Type': request.headers.get('Content-Type', ''),
                    'X-Twilio-Signature': request.headers.get('X-Twilio-Signature', ''),
                })
        return Response(upstream.content, status_code=upstream.status_code,
                        media_type=upstream.headers.get('Content-Type', 'application/xml'))
    except httpx.HTTPError:
        return Response('<Response><Say>The reception service is temporarily unavailable. Please try again.</Say></Response>',
                        media_type='application/xml')

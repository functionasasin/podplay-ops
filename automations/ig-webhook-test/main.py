import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response

app = FastAPI()

VERIFY_TOKEN = os.environ.get("IG_WEBHOOK_VERIFY_TOKEN", "cheerful-test-verify")
APP_SECRET = os.environ.get("IG_APP_SECRET", "")


@app.get("/")
async def health():
    return {"status": "ok", "service": "ig-webhook-test"}


@app.get("/webhooks/instagram")
async def verify_webhook(request: Request):
    """Meta webhook verification — responds to the challenge."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print(f"[{now()}] Webhook verified successfully")
        return Response(content=challenge, media_type="text/plain")

    print(f"[{now()}] Webhook verification failed: mode={mode}, token={token}")
    return Response(content="Forbidden", status_code=403)


@app.post("/webhooks/instagram")
async def receive_webhook(request: Request):
    """Receive and log Instagram webhook events."""
    body = await request.body()

    # Verify signature if app secret is set
    if APP_SECRET:
        signature = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            APP_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            print(f"[{now()}] BAD SIGNATURE: {signature}")
            return Response(content="Bad signature", status_code=403)

    payload = json.loads(body)
    print(f"\n{'='*60}")
    print(f"[{now()}] WEBHOOK EVENT RECEIVED")
    print(f"{'='*60}")
    print(json.dumps(payload, indent=2))
    print(f"{'='*60}\n")

    # Extract message details if present
    for entry in payload.get("entry", []):
        for messaging in entry.get("messaging", []):
            sender = messaging.get("sender", {}).get("id")
            message = messaging.get("message", {})
            text = message.get("text", "")
            mid = message.get("mid", "")
            print(f"  From: {sender}")
            print(f"  Text: {text}")
            print(f"  MID:  {mid}")

    return Response(content="OK", status_code=200)


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

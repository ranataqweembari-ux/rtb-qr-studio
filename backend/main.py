"""FastAPI app exposing POST /api/generate-qr."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from qr_service import InvalidInput, generate_qr_png

load_dotenv()
origins = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

app = FastAPI(title="RTB QR Studio API")
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_methods=["POST", "GET"], allow_headers=["*"])


class QRRequest(BaseModel):
    url: str
    size: int = 256
    foreground: str = "#000000"
    background: str = "#ffffff"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/generate-qr")
def generate_qr(req: QRRequest):
    try:
        png = generate_qr_png(req.url, req.size, req.foreground, req.background)
    except InvalidInput as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return Response(content=png, media_type="image/png")

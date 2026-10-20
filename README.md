# RTB QR Studio

A clean QR code generator. Frontend: HTML/CSS/JS (+ Lucide icons). Backend: FastAPI + `qrcode` + Pillow.

## Folder structure
```
rtb-qr-studio/
├── README.md
├── .gitignore
├── backend/
│   ├── main.py           # FastAPI app, POST /api/generate-qr
│   ├── qr_service.py     # URL validation + QR image generation
│   ├── requirements.txt
│   └── .env.example      # copy to .env to configure CORS origins
└── frontend/
    ├── index.html
    ├── styles.css
    ├── app.js            # UI logic + API calls
    └── config.js         # API base URL
```

## Setup (VS Code, Windows PowerShell)
Open the `rtb-qr-studio` folder in VS Code, then open two terminals (Terminal > New Terminal).

**Terminal 1 – backend**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```
If activation is blocked, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**Terminal 2 – frontend**
```powershell
cd frontend
python -m http.server 5173
```
Open http://localhost:5173.

## Usage
1. Enter a URL (with or without `https://`) and select **Generate QR Code**.
2. Change size or colors; the preview updates automatically.
3. **Download PNG** saves the exact image the backend generated. **Copy URL** copies the link.
4. **Reset to Default** restores 256px, black on white.

## Configuration
- Backend: `ALLOWED_ORIGINS` in `backend/.env` (comma-separated) must include the frontend origin.
- Frontend: `API_BASE_URL` in `frontend/config.js`.
- API docs: http://127.0.0.1:8000/docs

## API
`POST /api/generate-qr` with JSON `{ "url", "size": 128|256|512, "foreground": "#000000", "background": "#ffffff" }`
returns `image/png`. Invalid input returns HTTP 422 with `{ "detail": "message" }`.

Note: the frontend loads Inter and Lucide from CDNs, so it needs an internet connection for fonts and icons.

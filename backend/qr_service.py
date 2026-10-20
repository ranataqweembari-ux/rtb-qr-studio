"""QR generation + input validation (kept separate from the web layer)."""
import io
import re
from urllib.parse import urlparse

import qrcode
from qrcode.constants import ERROR_CORRECT_M

ALLOWED_SIZES = (128, 256, 512)
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


class InvalidInput(ValueError):
    """Raised with a user-friendly message."""


def normalize_url(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        raise InvalidInput("Enter a URL to generate a QR code.")
    if re.search(r"\s", value):
        raise InvalidInput("URLs can't contain spaces.")
    if "://" not in value:
        value = "https://" + value
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https"):
        raise InvalidInput("Only http:// and https:// links are supported.")
    host = parsed.hostname or ""
    if not host or not (host == "localhost" or "." in host):
        raise InvalidInput("That doesn't look like a valid URL. Try https://example.com")
    return value


def generate_qr_png(url: str, size: int, fg: str, bg: str) -> bytes:
    if size not in ALLOWED_SIZES:
        raise InvalidInput("Size must be 128, 256, or 512 pixels.")
    if not (HEX_COLOR.match(fg) and HEX_COLOR.match(bg)):
        raise InvalidInput("Colors must be hex values like #000000.")
    if fg.lower() == bg.lower():
        raise InvalidInput("Foreground and background colors must differ.")

    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(normalize_url(url))
    qr.make(fit=True)
    img = qr.make_image(fill_color=fg, back_color=bg).convert("RGB")
    # NEAREST keeps modules crisp when scaling to the exact requested size.
    img = img.resize((size, size), resample=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

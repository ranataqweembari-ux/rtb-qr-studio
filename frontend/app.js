const API = (window.APP_CONFIG?.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const $ = (id) => document.getElementById(id);
const els = {
  url: $("url"), err: $("url-error"), gen: $("generate"), fg: $("fg"), bg: $("bg"),
  fgHex: $("fg-hex"), bgHex: $("bg-hex"), reset: $("reset"), img: $("qr"), empty: $("empty"),
  spinner: $("spinner"), shown: $("shown-url"), dl: $("download"), copy: $("copy"),
  toast: $("toast"), theme: $("theme-toggle"),
};
const DEFAULTS = { size: "256", fg: "#000000", bg: "#ffffff" };
let current = { url: "", blobUrl: null }, toastTimer, requestId = 0;

if (window.lucide) lucide.createIcons();

/* ---------- helpers ---------- */
function normalizeUrl(raw) {
  let v = raw.trim();
  if (!v) throw new Error("Enter a URL to generate a QR code.");
  if (/\s/.test(v)) throw new Error("URLs can't contain spaces.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = "https://" + v;
  let u;
  try { u = new URL(v); } catch { throw new Error("That doesn't look like a valid URL. Try https://example.com"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http:// and https:// links are supported.");
  if (u.hostname !== "localhost" && !u.hostname.includes(".")) throw new Error("That doesn't look like a valid URL. Try https://example.com");
  return v;
}
const selectedSize = () => Number(document.querySelector('input[name="size"]:checked').value);
function showError(msg) {
  els.err.textContent = msg || ""; els.err.hidden = !msg;
  els.url.setAttribute("aria-invalid", msg ? "true" : "false");
}
function toast(msg) {
  els.toast.textContent = msg; els.toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (els.toast.hidden = true), 2200);
}
function setLoading(on) {
  els.gen.disabled = on; els.spinner.hidden = !on;
  if (on) { els.img.hidden = true; els.empty.hidden = true; }
}

/* ---------- generate ---------- */
async function generate() {
  let url;
  try { url = normalizeUrl(els.url.value); } catch (e) { showError(e.message); els.url.focus(); return; }
  if (els.fg.value.toLowerCase() === els.bg.value.toLowerCase()) {
    showError("Foreground and background colors must differ."); return;
  }
  showError("");
  const id = ++requestId;
  setLoading(true);
  try {
    const res = await fetch(`${API}/api/generate-qr`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, size: selectedSize(), foreground: els.fg.value, background: els.bg.value }),
    });
    if (!res.ok) {
      let detail = "Something went wrong. Please try again.";
      try { const d = (await res.json()).detail; if (typeof d === "string") detail = d; } catch {}
      throw new Error(detail);
    }
    const blob = await res.blob();
    if (id !== requestId) return; // a newer request superseded this one
    if (current.blobUrl) URL.revokeObjectURL(current.blobUrl);
    current = { url, blobUrl: URL.createObjectURL(blob) };
    els.img.src = current.blobUrl; els.img.width = selectedSize(); els.img.hidden = false;
    els.shown.textContent = url; els.shown.hidden = false;
    els.dl.disabled = els.copy.disabled = false;
    toast("QR code generated");
  } catch (e) {
    if (id !== requestId) return;
    const offline = e instanceof TypeError;
    showError(offline ? `Can't reach the server at ${API}. Is the backend running?` : e.message);
    if (!current.blobUrl) els.empty.hidden = false; else els.img.hidden = false;
  } finally {
    if (id === requestId) setLoading(false);
  }
}

/* ---------- events ---------- */
els.gen.addEventListener("click", generate);
els.url.addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });
els.url.addEventListener("input", () => showError(""));

// Once a code exists, changing options updates it automatically.
function onCustomize() {
  els.fgHex.textContent = els.fg.value; els.bgHex.textContent = els.bg.value;
  if (current.blobUrl) generate();
}
els.fg.addEventListener("change", onCustomize);
els.bg.addEventListener("change", onCustomize);
els.fg.addEventListener("input", () => (els.fgHex.textContent = els.fg.value));
els.bg.addEventListener("input", () => (els.bgHex.textContent = els.bg.value));
document.querySelectorAll('input[name="size"]').forEach((r) => r.addEventListener("change", onCustomize));

els.reset.addEventListener("click", () => {
  document.querySelector(`input[name="size"][value="${DEFAULTS.size}"]`).checked = true;
  els.fg.value = DEFAULTS.fg; els.bg.value = DEFAULTS.bg;
  onCustomize(); toast("Settings reset");
});

els.dl.addEventListener("click", () => {
  if (!current.blobUrl) return;
  const host = new URL(current.url).hostname.replace(/^www\./, "");
  const a = document.createElement("a");
  a.href = current.blobUrl; a.download = `qr-${host}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  toast("PNG downloaded");
});

els.copy.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(current.url); toast("URL copied"); }
  catch { toast("Couldn't copy. Select the URL and copy it manually."); }
});

function syncThemeLabel() {
  const dark = document.documentElement.dataset.theme === "dark";
  els.theme.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
els.theme.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next; localStorage.setItem("theme", next); syncThemeLabel();
});
syncThemeLabel();

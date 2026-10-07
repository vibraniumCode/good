from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from rembg import new_session, remove

app = FastAPI(title="GOOD product image processor")
session = None


@app.on_event("startup")
def load_model():
    global session
    # U2-Net weights are fetched once into rembg's local model cache.
    session = new_session("u2net")


@app.get("/health")
def health():
    return {"ok": session is not None}


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Usá una imagen PNG, JPG o WebP.")
    raw = await file.read(12 * 1024 * 1024 + 1)
    if len(raw) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="La imagen no puede superar 12 MB.")
    try:
        image = Image.open(BytesIO(raw)).convert("RGB")
        if image.width * image.height > 36_000_000:
            raise HTTPException(status_code=413, detail="La imagen tiene demasiados píxeles.")
        result = remove(
            image,
            session=session,
            alpha_matting=True,
            alpha_matting_foreground_threshold=230,
            alpha_matting_background_threshold=10,
            post_process_mask=True,
        )
        if result.mode != "RGBA":
            result = result.convert("RGBA")
        alpha = result.getchannel("A")
        bounds = alpha.getbbox()
        if bounds:
            result = result.crop(bounds)
        out = BytesIO()
        result.save(out, format="PNG", optimize=True)
        return Response(content=out.getvalue(), media_type="image/png", headers={"Cache-Control": "no-store"})
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="No se pudo leer ese archivo como imagen.") from exc

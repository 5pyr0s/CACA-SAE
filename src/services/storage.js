export async function toWebpDataUrl(file, maxSide = 720, quality = 0.65) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement("canvas"), {
    width: Math.round(bmp.width * scale),
    height: Math.round(bmp.height * scale),
  });
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/webp", quality);
}

export async function uploadListingPhotos(_uid, _listingId, files, onProgress) {
  const uploaded = [];
  let totalChars = 0;
  const MAX_TOTAL_CHARS = 700_000;

  for (let i = 0; i < files.length; i++) {
    const dataUrl = await toWebpDataUrl(files[i]);
    totalChars += dataUrl.length;

    if (totalChars > MAX_TOTAL_CHARS) {
      throw new Error("Photos are too large combined. Use fewer images (max 3–4).");
    }

    uploaded.push({ path: "", url: dataUrl });
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  return uploaded;
}

export async function deleteStoragePaths() {
  // No-op: photos are stored inline on the Firestore listing document
}
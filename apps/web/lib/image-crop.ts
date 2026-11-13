const MAX_SIDE = 512;
const MAX_BYTES = 2 * 1024 * 1024;

/** Client-side only: center-crops to a square, resizes, and compresses under the size cap. */
export async function cropToSquareAndCompress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = MAX_SIDE;
  canvas.height = MAX_SIDE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process the image in this browser.');
  }
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, MAX_SIDE, MAX_SIDE);
  bitmap.close();

  let quality = 0.9;
  let blob = await encode(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.3) {
    quality -= 0.15;
    blob = await encode(canvas, quality);
  }
  if (blob.size > MAX_BYTES) {
    throw new Error('Could not compress the crest under 2 MB. Try a smaller image.');
  }
  return blob;
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/webp',
      quality,
    );
  });
}

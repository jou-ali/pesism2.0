const SAMPLE_SIZE = 32;
const BUCKET = 32; // quantize each channel to reduce near-duplicate colors

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) => n.toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Client-side only: samples the two most common non-background colors in an image. */
export async function sampleDominantColors(file: File | Blob): Promise<[string, string]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return ['#DED002', '#9938D4'];
  }
  ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const counts = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    // Skip near-white and near-black — usually transparent/background padding, not the crest itself.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 235 && min > 215) continue;
    if (max < 25) continue;

    const key = `${Math.round(r / BUCKET)}-${Math.round(g / BUCKET)}-${Math.round(b / BUCKET)}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { count: 1, r, g, b });
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
  if (!sorted.length) {
    return ['#DED002', '#9938D4'];
  }
  const primary = sorted[0];
  const secondary = sorted.find((c) => Math.abs(c.r - primary.r) + Math.abs(c.g - primary.g) + Math.abs(c.b - primary.b) > 80) ?? sorted[1] ?? primary;

  return [toHex(primary.r, primary.g, primary.b), toHex(secondary.r, secondary.g, secondary.b)];
}

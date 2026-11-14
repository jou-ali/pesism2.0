function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance (WCAG) — used to decide whether crest/badge text should be light or dark ink. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White text on a dark crest background, dark ink on a light one (e.g. a white/yellow shield). */
export function inkFor(backgroundHex: string): string {
  try {
    return luminance(backgroundHex) > 0.6 ? '#1E0825' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

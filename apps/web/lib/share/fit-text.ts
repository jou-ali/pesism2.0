import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as opentype from 'opentype.js';

// Loaded and parsed once per server process, synchronously — opentype.js can parse a buffer it
// already has in memory without the async fetch path meant for loading fonts from a URL. Every
// caller in this module is a plain synchronous function so components never need to thread a
// loaded-font promise through render trees.
let furoreFont: opentype.Font | null = null;

function getFuroreFont(): opentype.Font {
  if (!furoreFont) {
    const buf = readFileSync(path.join(process.cwd(), 'app/fonts/furore/Furore.otf'));
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    furoreFont = opentype.parse(arrayBuffer);
  }
  return furoreFont;
}

function advanceWidth(text: string, fontSize: number, letterSpacing: number): number {
  const font = getFuroreFont();
  const base = font.getAdvanceWidth(text, fontSize);
  return base + letterSpacing * Math.max(0, text.length - 1);
}

/** Splits `text` into two lines at the space closest to its midpoint. Falls back to the whole
 * string as a single "line" if there's no space to split on (can't wrap a single word). */
function splitNearMiddle(text: string): [string] | [string, string] {
  const spaceIndexes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') spaceIndexes.push(i);
  }
  if (!spaceIndexes.length) return [text];
  const middle = text.length / 2;
  const splitAt = spaceIndexes.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best));
  return [text.slice(0, splitAt).trimEnd(), text.slice(splitAt + 1).trimStart()];
}

export type FitTextResult = {
  size: number;
  /** One entry per line to render — always length 1 unless even `min` didn't fit. */
  lineTexts: [string] | [string, string];
};

/** Finds the largest font size (≤ max, ≥ min) at which `text` fits within `maxWidthPx`, measured
 * against the real Furore glyph metrics — never a guess. Wraps onto two lines (split at the space
 * nearest the middle) only if the text still doesn't fit at `min` on one line. */
export function fitFontSize(
  text: string,
  maxWidthPx: number,
  { max, min, letterSpacing = 0 }: { max: number; min: number; letterSpacing?: number },
): FitTextResult {
  for (let size = max; size >= min; size--) {
    if (advanceWidth(text, size, letterSpacing) <= maxWidthPx) {
      return { size, lineTexts: [text] };
    }
  }
  return { size: min, lineTexts: splitNearMiddle(text) };
}

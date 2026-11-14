import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type ShareFont = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700 | 800;
  style: 'normal';
};

let fontsPromise: Promise<ShareFont[]> | null = null;

/** Furore (display) + Onest 400-800 (body), loaded once per server process and reused by every poster route. */
export function loadShareFonts(): Promise<ShareFont[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const [furore, w400, w500, w600, w700, w800] = await Promise.all([
        readFile(path.join(process.cwd(), 'app/fonts/furore/Furore.otf')),
        readFile(path.join(process.cwd(), 'app/fonts/onest/Onest-400.ttf')),
        readFile(path.join(process.cwd(), 'app/fonts/onest/Onest-500.ttf')),
        readFile(path.join(process.cwd(), 'app/fonts/onest/Onest-600.ttf')),
        readFile(path.join(process.cwd(), 'app/fonts/onest/Onest-700.ttf')),
        readFile(path.join(process.cwd(), 'app/fonts/onest/Onest-800.ttf')),
      ]);
      return [
        { name: 'Furore', data: furore, weight: 400, style: 'normal' },
        { name: 'Onest', data: w400, weight: 400, style: 'normal' },
        { name: 'Onest', data: w500, weight: 500, style: 'normal' },
        { name: 'Onest', data: w600, weight: 600, style: 'normal' },
        { name: 'Onest', data: w700, weight: 700, style: 'normal' },
        { name: 'Onest', data: w800, weight: 800, style: 'normal' },
      ];
    })();
  }
  return fontsPromise;
}

let trophyPromise: Promise<string> | null = null;

/** The trophy watermark/hero image as a data URI — no network fetch needed inside the renderer. */
export function loadTrophyDataUri(): Promise<string> {
  if (!trophyPromise) {
    trophyPromise = readFile(path.join(process.cwd(), 'public/hero/trophy.png')).then(
      (buf) => `data:image/png;base64,${buf.toString('base64')}`,
    );
  }
  return trophyPromise;
}

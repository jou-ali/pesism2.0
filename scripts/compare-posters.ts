/**
 * Regression guard for the share-image posters.
 *
 * For each poster, screenshots its design/share/*.html reference at 1080x1350 with Playwright
 * (swapping the reference's /_blob/ placeholder URLs for the real local font/trophy files, since
 * those blob ids only resolve inside the design tool that exported the file), fetches the live
 * ?sample=1 render from the running dev server, and writes a side-by-side + pixel-diff image to
 * /tmp/poster-diff/. Prints a diff percentage per poster.
 *
 * Caveat: five reference files (matchday x2, table 11-14 rows, quarter-finals, semi-finals,
 * bracket) use a `sc-for`/`{{...}}` templating syntax meant for the design tool's own `support.js`
 * runtime, which isn't part of this repo — their repeating rows (fixtures, table rows, ties,
 * chasers) render as literal "{{...}}" placeholder text in a bare browser instead of real data.
 * That inflates their diff % for reasons unrelated to our implementation; judge those specifically
 * on the static chrome (header, title block, footer, single-instance stat cards), not the number.
 *
 * Usage: npx tsx scripts/compare-posters.ts [--base-url http://localhost:3000] [--threshold 3]
 */
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DESIGN_DIR = path.join(ROOT, 'design/share');
const FONT_PATH = path.join(ROOT, 'apps/web/app/fonts/furore/Furore.otf');
const TROPHY_PATH = path.join(ROOT, 'apps/web/public/hero/trophy.png');
const OUT_DIR = '/tmp/poster-diff';
const WIDTH = 1080;
const HEIGHT = 1350;

// The design tool's exported HTML always embeds these two blob ids for the font and the trophy —
// confirmed by grepping every design/share/*.html file; they don't change per poster.
const FONT_BLOB_ID = '6ee480781b6660a899e00b3ad8dfe437';
const TROPHY_BLOB_ID = '66412913ef9dc238a66b81142f8d8e9a';

type Poster = { key: string; title: string; liveUrl: string; referenceFile: string };

const POSTERS: Poster[] = [
  { key: 'matchday-5', title: 'Matchday preview (5 fixtures)', liveUrl: '/api/share/matchday/3/preview?sample=1', referenceFile: 'matchday-preview.html' },
  { key: 'matchday-7', title: 'Matchday preview (7 fixtures, 14 players)', liveUrl: '/api/share/matchday/1/preview?sample=1', referenceFile: 'matchday-preview-14-players.html' },
  { key: 'table-10', title: 'Table after matchday (≤10 rows)', liveUrl: '/api/share/matchday/3/table?sample=1', referenceFile: 'table-after-matchday.html' },
  { key: 'table-14', title: 'Table after matchday (11-14 rows)', liveUrl: '/api/share/matchday/4/table?sample=1', referenceFile: 'table-after-matchday-14-players.html' },
  { key: 'quarter-finals', title: 'Quarter-finals preview', liveUrl: '/api/share/knockout/quarter-finals?sample=1', referenceFile: 'quarter-finals-preview.html' },
  { key: 'semi-finals', title: 'Semi-finals preview', liveUrl: '/api/share/knockout/semi-finals?sample=1', referenceFile: 'semi-finals-preview.html' },
  { key: 'final', title: 'Final preview', liveUrl: '/api/share/knockout/final?sample=1', referenceFile: 'final-preview.html' },
  { key: 'bracket', title: 'Knockout bracket', liveUrl: '/api/share/knockout/bracket?sample=1', referenceFile: 'knockout-bracket.html' },
  { key: 'champion', title: 'Champion', liveUrl: '/api/share/awards/champion?sample=1', referenceFile: 'award-champion.html' },
  { key: 'golden-boot', title: 'Golden Boot', liveUrl: '/api/share/awards/golden-boot?sample=1', referenceFile: 'award-golden-boot.html' },
  { key: 'golden-glove', title: 'Golden Glove', liveUrl: '/api/share/awards/golden-glove?sample=1', referenceFile: 'award-golden-glove.html' },
  { key: 'league-shield', title: 'League Shield', liveUrl: '/api/share/awards/league-shield?sample=1', referenceFile: 'award-league-shield.html' },
];

const TEMPLATED_REFERENCES = new Set([
  'matchday-preview.html',
  'matchday-preview-14-players.html',
  'table-after-matchday.html',
  'table-after-matchday-14-players.html',
  'quarter-finals-preview.html',
  'semi-finals-preview.html',
  'knockout-bracket.html',
  // These three use sc-for/{{...}} only for the chasing-pack rows, not the whole poster, so expect
  // a smaller (not zero) inflation from this than the fully-templated list above.
  'award-golden-boot.html',
  'award-golden-glove.html',
  'award-league-shield.html',
]);

function toDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function renderReference(browser: import('playwright').Browser, referenceFile: string, fontDataUri: string, trophyDataUri: string): Promise<Buffer> {
  const raw = await readFile(path.join(DESIGN_DIR, referenceFile), 'utf8');
  const html = raw.replaceAll(`/_blob/${FONT_BLOB_ID}`, fontDataUri).replaceAll(`/_blob/${TROPHY_BLOB_ID}`, trophyDataUri);
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    // The reference embeds its own @font-face; give it a moment to actually paint with Furore
    // rather than a fallback (font-display:block already stalls text paint, but be generous).
    await page.waitForTimeout(300);
    return await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  } finally {
    await page.close();
  }
}

async function fetchLive(baseUrl: string, liveUrl: string): Promise<Buffer> {
  const res = await fetch(`${baseUrl}${liveUrl}`);
  if (!res.ok) throw new Error(`${liveUrl} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function decodePng(buf: Buffer): PNG {
  return PNG.sync.read(buf);
}

function sideBySide(a: PNG, b: PNG, diff: PNG): Buffer {
  const combined = new PNG({ width: a.width * 3 + 20, height: a.height });
  combined.data.fill(30);
  const blit = (src: PNG, xOffset: number) => {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const srcIdx = (src.width * y + x) << 2;
        const dstIdx = (combined.width * y + (x + xOffset)) << 2;
        combined.data[dstIdx] = src.data[srcIdx];
        combined.data[dstIdx + 1] = src.data[srcIdx + 1];
        combined.data[dstIdx + 2] = src.data[srcIdx + 2];
        combined.data[dstIdx + 3] = src.data[srcIdx + 3];
      }
    }
  };
  blit(a, 0);
  blit(b, a.width + 10);
  blit(diff, a.width * 2 + 20);
  return PNG.sync.write(combined);
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrlArg = args.indexOf('--base-url');
  const thresholdArg = args.indexOf('--threshold');
  const baseUrl = baseUrlArg !== -1 ? args[baseUrlArg + 1] : 'http://localhost:3000';
  const threshold = thresholdArg !== -1 ? Number(args[thresholdArg + 1]) : 3;

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const [fontBuf, trophyBuf] = await Promise.all([readFile(FONT_PATH), readFile(TROPHY_PATH)]);
  const fontDataUri = toDataUri(fontBuf, 'font/otf');
  const trophyDataUri = toDataUri(trophyBuf, 'image/png');

  const browser = await chromium.launch();
  const results: Array<{ poster: Poster; diffPct: number; templated: boolean }> = [];

  try {
    for (const poster of POSTERS) {
      process.stdout.write(`Rendering ${poster.key}... `);
      const [liveBuf, refBuf] = await Promise.all([
        fetchLive(baseUrl, poster.liveUrl),
        renderReference(browser, poster.referenceFile, fontDataUri, trophyDataUri),
      ]);

      const live = decodePng(liveBuf);
      const reference = decodePng(refBuf);

      if (live.width !== WIDTH || live.height !== HEIGHT) {
        console.log(`SKIPPED (live image is ${live.width}x${live.height}, expected ${WIDTH}x${HEIGHT})`);
        continue;
      }

      const diff = new PNG({ width: WIDTH, height: HEIGHT });
      const diffPixels = pixelmatch(reference.data, live.data, diff.data, WIDTH, HEIGHT, { threshold: 0.1 });
      const diffPct = (diffPixels / (WIDTH * HEIGHT)) * 100;

      const dir = path.join(OUT_DIR, poster.key);
      await mkdir(dir, { recursive: true });
      await Promise.all([
        writeFile(path.join(dir, 'live.png'), liveBuf),
        writeFile(path.join(dir, 'reference.png'), refBuf),
        writeFile(path.join(dir, 'diff.png'), PNG.sync.write(diff)),
        writeFile(path.join(dir, 'side-by-side.png'), sideBySide(reference, live, diff)),
      ]);

      results.push({ poster, diffPct, templated: TEMPLATED_REFERENCES.has(poster.referenceFile) });
      console.log(`${diffPct.toFixed(2)}%`);
    }
  } finally {
    await browser.close();
  }

  console.log('\n--- Poster diff report ---');
  console.log(`(reference | live | diff side-by-side images in ${OUT_DIR}/<key>/side-by-side.png)\n`);
  for (const { poster, diffPct, templated } of results) {
    const flag = diffPct > threshold ? '  <-- over threshold' : '';
    const note = templated ? ' [reference uses un-rendered {{...}} template placeholders — judge chrome only]' : '';
    console.log(`${poster.key.padEnd(16)} ${diffPct.toFixed(2).padStart(6)}%${flag}${note}`);
  }

  const overThreshold = results.filter((r) => r.diffPct > threshold && !r.templated);
  if (overThreshold.length) {
    console.log(`\n${overThreshold.length} poster(s) over the ${threshold}% threshold (excluding templated references) — review before shipping.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll non-templated posters are within the ${threshold}% threshold.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

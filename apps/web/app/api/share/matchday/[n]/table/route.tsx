import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, TableHeaderRow, TableRow, CutLine, POSTER_CONTENT_WIDTH } from '@/lib/share/components';
import { getMatchdayTableData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const matchday = Number(n);
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';
  if (!Number.isFinite(matchday) || matchday < 1) {
    return new Response('Not found', { status: 404 });
  }

  const data = await getMatchdayTableData(matchday, useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);
  const dense = data.rows.length > 10;
  const mdStr = String(data.matchday).padStart(2, '0');
  // Card: padding 24 horizontal; each row: padding 8 horizontal (dense and standard both).
  const rowWidthPx = POSTER_CONTENT_WIDTH - 24 * 2 - 8 * 2;

  return new ImageResponse(
    (
      <PosterFrame tag={`MATCHDAY ${mdStr} · DONE`} trophyDataUri={trophy}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>THE</span>
            <span>TABLE</span>
          </div>
          <SubtitleLine>After matchday {mdStr} &middot; Numbers don&rsquo;t do banter</SubtitleLine>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#27092F',
            border: '1px solid rgba(243,240,234,0.12)',
            borderRadius: 24,
            padding: dense ? '8px 24px 10px' : '12px 24px 14px',
          }}
        >
          <TableHeaderRow dense={dense} />
          {data.rows.map((row) => (
            <div key={row.pos} style={{ display: 'flex', flexDirection: 'column' }}>
              {row.cutBefore ? <CutLine small={dense} /> : null}
              <TableRow row={row} dense={dense} rowWidthPx={rowWidthPx} />
            </div>
          ))}
        </div>
      </PosterFrame>
    ),
    {
      width: 1080,
      height: 1350,
      fonts,
      headers: {
        'Cache-Control': searchParams.has('v') ? 'public, s-maxage=31536000, immutable' : 'public, s-maxage=60',
      },
    },
  );
}

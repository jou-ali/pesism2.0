import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, Shield, FitTeamName } from '@/lib/share/components';
import { getBracketData, type BracketBox, type BracketBoxRow } from '@/lib/share/data';

export const runtime = 'nodejs';

// public/hero/trophy.png is 993x1583 — keep this in sync with that file's actual size. Satori
// doesn't reliably infer the missing dimension from a lone width/height, so both are set explicitly
// here rather than relying on it to preserve the ratio itself.
const TROPHY_NATURAL_WIDTH = 993;
const TROPHY_NATURAL_HEIGHT = 1583;
const SMALL_TROPHY_HEIGHT = 110;
const SMALL_TROPHY_WIDTH = Math.round((SMALL_TROPHY_HEIGHT * TROPHY_NATURAL_WIDTH) / TROPHY_NATURAL_HEIGHT);

// Reserved width for the score (+ optional "(pens)") column — not a team name, so it doesn't need
// real glyph measuring, just a safe fixed budget ("10 (12)" at Furore 26 comfortably fits 80px).
const SCORE_RESERVE_PX = 80;
const BOX_PADDING_X = 16;
const BOX_CREST_SIZE = 32;
const BOX_GAP = 12;

function BoxRow({ row, textWidthPx }: { row: BracketBoxRow; textWidthPx: number }) {
  const scoreText = row.pens ? `${row.score} ${row.pens}` : row.score;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: BOX_GAP, opacity: row.won === false ? 0.6 : 1 }}>
      <Shield size={BOX_CREST_SIZE} teamName={row.teamName} crestUrl={row.crestUrl} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <FitTeamName text={row.teamName} maxWidthPx={textWidthPx} max={18} min={13} lineHeight={1.1} />
        <span style={{ fontSize: 14, fontWeight: 500, color: '#CBB8D9' }}>{row.playerName}</span>
      </div>
      <span style={{ fontFamily: 'Furore', fontSize: 26, color: row.won ? '#DED002' : '#F3F0EA' }}>{scoreText}</span>
    </div>
  );
}

function Box({ box, gold, columnWidthPx }: { box: BracketBox; gold?: boolean; columnWidthPx: number }) {
  const textWidthPx = columnWidthPx - BOX_PADDING_X * 2 - BOX_CREST_SIZE - BOX_GAP * 2 - SCORE_RESERVE_PX;
  if (!box.rows.length) {
    return (
      <div
        style={{
          height: 132,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#27092F',
          border: `1px solid ${gold ? 'rgba(222,208,2,0.45)' : 'rgba(243,240,234,0.12)'}`,
          borderRadius: 18,
          padding: `10px ${BOX_PADDING_X}px`,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: '#9E84AE' }}>TBD</span>
      </div>
    );
  }
  return (
    <div
      style={{
        height: 132,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
        background: '#27092F',
        border: `1px solid ${gold ? 'rgba(222,208,2,0.45)' : 'rgba(243,240,234,0.12)'}`,
        borderRadius: 18,
        padding: `10px ${BOX_PADDING_X}px`,
      }}
    >
      {box.rows.map((r, i) => (
        <BoxRow key={i} row={r} textWidthPx={textWidthPx} />
      ))}
    </div>
  );
}

function Connector({ height }: { height: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 300 }}>
      <div style={{ height, border: '2px solid rgba(243,240,234,0.3)', borderLeft: 'none', borderRadius: '0 10px 10px 0' }} />
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getBracketData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);

  return new ImageResponse(
    (
      <PosterFrame tag="QUARTER-FINALS · DONE">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>THE</span>
            <span style={{ color: '#DED002' }}>BRACKET</span>
          </div>
          <SubtitleLine>After the quarter-finals &middot; Four down, four to go</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'row', fontSize: 14, fontWeight: 800, letterSpacing: 3, color: '#9E84AE' }}>
            <span style={{ display: 'flex', width: 360 }}>QUARTER-FINALS</span>
            <span style={{ display: 'flex', width: 28 }} />
            <span style={{ display: 'flex', width: 300 }}>SEMI-FINALS</span>
            <span style={{ display: 'flex', width: 28 }} />
            <span style={{ display: 'flex', width: 220 }}>FINAL</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 40 }}>
              {data.qfGroups.map((g, i) => (
                <div key={i} style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {g.boxes.map((b, j) => (
                    <Box key={j} box={b} columnWidthPx={360} />
                  ))}
                </div>
              ))}
            </div>

            <div style={{ width: 28, display: 'flex', flexDirection: 'column', gap: 40 }}>
              <Connector height={168} />
              <Connector height={168} />
            </div>

            <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 40 }}>
              {data.sf.map((b, i) => (
                <div key={i} style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box box={b} gold columnWidthPx={300} />
                </div>
              ))}
            </div>

            {/* The SF connector bar spans the 340px between the two SF box centres (168 each side of
                its own midpoint, matching the per-group QF→SF connectors) — its right-edge midpoint
                is the exact point the FINAL box must sit on. Both this column and the FINAL column
                are pinned to the shared 640px envelope height so "centred in 640" lands everyone on
                the same line, instead of a shorter trophy+box group centring on its own (smaller) box. */}
            <div style={{ width: 28, height: 640, position: 'relative', display: 'flex', flexDirection: 'row' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 150,
                  left: 0,
                  width: 16,
                  height: 340,
                  border: '2px solid rgba(243,240,234,0.3)',
                  borderLeft: 'none',
                  borderRadius: '0 10px 10px 0',
                }}
              />
              <div style={{ position: 'absolute', top: 319, left: 16, width: 22, height: 2, background: 'rgba(243,240,234,0.3)' }} />
            </div>

            {/* Absolute + left:50%/translateX(-50%) clipped the trophy image in Satori (it rendered
                as a thin sliver) — an in-flow flex column reaches the same y=272 for the FINAL box
                (148 spacer + 110 trophy + 14 spacer = 272) without needing absolute positioning. */}
            <div style={{ width: 220, height: 640, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
              <div style={{ display: 'flex', height: 272 - 14 - SMALL_TROPHY_HEIGHT, flexShrink: 0 }} />
              <div style={{ width: SMALL_TROPHY_WIDTH, height: SMALL_TROPHY_HEIGHT, display: 'flex', flexShrink: 0 }}>
                <img src={trophy} width={SMALL_TROPHY_WIDTH} height={SMALL_TROPHY_HEIGHT} style={{ width: SMALL_TROPHY_WIDTH, height: SMALL_TROPHY_HEIGHT }} />
              </div>
              <div style={{ display: 'flex', height: 14, flexShrink: 0 }} />
              <div
                style={{
                  width: 200,
                  height: 96,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  background: '#DED002',
                  color: '#1E0825',
                  borderRadius: 18,
                  padding: '16px 12px',
                }}
              >
                <span style={{ fontFamily: 'Furore', fontSize: 26, lineHeight: 1 }}>FINAL</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{data.finalDate ?? 'TBD'}</span>
              </div>
            </div>
          </div>
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

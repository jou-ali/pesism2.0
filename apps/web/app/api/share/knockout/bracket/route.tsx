import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, Shield } from '@/lib/share/components';
import { getBracketData, type BracketBox, type BracketBoxRow } from '@/lib/share/data';

export const runtime = 'nodejs';

function BoxRow({ row, pens }: { row: BracketBoxRow; pens?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, opacity: row.won === false ? 0.45 : 1 }}>
      <Shield size={32} short={row.short} c1={row.primaryColor} c2={row.secondaryColor} ink={row.ink} crestUrl={row.crestUrl} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontFamily: 'Furore', fontSize: 18, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.teamName}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#CBB8D9' }}>{row.playerName}</span>
      </div>
      {pens ? <span style={{ fontSize: 14, fontWeight: 700, color: '#9E84AE' }}>{pens}</span> : null}
      <span style={{ fontFamily: 'Furore', fontSize: 26, color: row.won ? '#DED002' : '#F3F0EA' }}>{row.score}</span>
    </div>
  );
}

function Box({ box, gold }: { box: BracketBox; gold?: boolean }) {
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
          padding: '10px 16px',
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
        padding: '10px 16px',
      }}
    >
      {box.rows.map((r, i) => (
        <BoxRow key={i} row={r} pens={r.pens} />
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
      <PosterFrame tag="QUARTER-FINALS · DONE" trophyDataUri={trophy}>
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
                    <Box key={j} box={b} />
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
                  <Box box={b} gold />
                </div>
              ))}
            </div>

            <div style={{ width: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ height: 340, border: '2px solid rgba(243,240,234,0.3)', borderLeft: 'none', borderRadius: '0 10px 10px 0' }} />
            </div>

            <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <img src={trophy} width={120} />
              <div
                style={{
                  width: 200,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
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

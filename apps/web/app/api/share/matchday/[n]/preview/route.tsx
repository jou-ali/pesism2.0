import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, FixtureCard, CompactFixtureCard } from '@/lib/share/components';
import { getMatchdayPreviewData } from '@/lib/share/data';
import type { Fixture } from '@/lib/share/types';

export const runtime = 'nodejs';

function ByeRow({ bye, compact }: { bye: NonNullable<Awaited<ReturnType<typeof getMatchdayPreviewData>>>['bye']; compact?: boolean }) {
  if (!bye) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#27092F',
        border: '1px solid rgba(243,240,234,0.12)',
        borderRadius: 24,
        padding: compact ? '16px 24px' : '20px 24px',
        flex: 1,
        width: '100%',
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 600, color: '#9E84AE' }}>
        BYE &middot; {bye.playerName} &middot; {bye.teamName}
      </span>
    </div>
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const matchday = Number(n);
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';
  if (!Number.isFinite(matchday) || matchday < 1) {
    return new Response('Not found', { status: 404 });
  }

  const data = await getMatchdayPreviewData(matchday, useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);
  const compact = data.fixtures.length >= 6;
  const mdStr = String(data.matchday).padStart(2, '0');

  return new ImageResponse(
    (
      <PosterFrame tag="LEAGUE STAGE" trophyDataUri={trophy}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
              <span>MATCH</span>
              <span>DAY</span>
            </div>
            <span style={{ fontFamily: 'Furore', fontSize: 236, lineHeight: 0.78, color: '#DED002', position: 'relative', top: -20 }}>
              {mdStr}
            </span>
          </div>
          <SubtitleLine>{data.deadline}</SubtitleLine>
        </div>

        {compact ? (
          (() => {
            const callout = (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 10,
                  flex: 1,
                  border: '2px dashed rgba(222,208,2,0.55)',
                  borderRadius: 24,
                  padding: '16px 24px',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: '#DED002' }}>AFTER YOUR MATCH</span>
                <span style={{ fontFamily: 'Furore', fontSize: 24, lineHeight: 1.15 }}>Post the score on tournax.auradev.in</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#CBB8D9' }}>Add the full-time screenshot. Both players confirm it.</span>
              </div>
            );
            const cells: React.ReactNode[] = [
              ...data.fixtures.map((f: Fixture, i: number) => <CompactFixtureCard key={`f${i}`} fixture={f} />),
              ...(data.bye ? [<ByeRow key="bye" bye={data.bye} compact />] : []),
              <div key="callout" style={{ display: 'flex', width: '100%' }}>
                {callout}
              </div>,
            ];
            const rows: React.ReactNode[][] = [];
            for (let i = 0; i < cells.length; i += 2) rows.push(cells.slice(i, i + 2));

            return (
              <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rows.map((rowCells, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 14 }}>
                    {rowCells.map((cell, j) => (
                      <div key={j} style={{ display: 'flex', flex: 1 }}>
                        {cell}
                      </div>
                    ))}
                    {rowCells.length === 1 ? <div style={{ display: 'flex', flex: 1 }} /> : null}
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            {data.fixtures.map((f: Fixture, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flex: 1,
                  alignItems: 'center',
                  background: '#27092F',
                  border: '1px solid rgba(243,240,234,0.12)',
                  borderRadius: 24,
                  padding: '20px 24px',
                }}
              >
                <FixtureCard fixture={f} />
              </div>
            ))}
            <ByeRow bye={data.bye} />
          </div>
        )}
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

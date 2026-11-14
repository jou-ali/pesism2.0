import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, HomeAwayLegendLine, FixtureCard, CompactFixtureCard, POSTER_CONTENT_WIDTH } from '@/lib/share/components';
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
        padding: '16px 24px',
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
  // Fixture card: padding '16px 24px', so 24px off each side of the poster's own content width.
  const cardWidthPx = POSTER_CONTENT_WIDTH - 24 * 2;

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

        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? 12 : 16,
            justifyContent: 'center',
          }}
        >
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
                padding: '16px 24px',
              }}
            >
              {compact ? (
                <CompactFixtureCard fixture={f} cardWidthPx={cardWidthPx} />
              ) : (
                <FixtureCard fixture={f} cardWidthPx={cardWidthPx} />
              )}
            </div>
          ))}
          <ByeRow bye={data.bye} compact={compact} />
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

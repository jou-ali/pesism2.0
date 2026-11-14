import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, HomeAwayLegendLine, FixtureCard, POSTER_CONTENT_WIDTH } from '@/lib/share/components';
import { getQuarterFinalsData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getQuarterFinalsData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);
  // Tie card: padding 24, so 24px off each side of the poster's own content width.
  const cardWidthPx = POSTER_CONTENT_WIDTH - 24 * 2;

  return new ImageResponse(
    (
      <PosterFrame tag="KNOCKOUTS" trophyDataUri={trophy}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>QUARTER</span>
            <span style={{ color: '#DED002' }}>FINALS</span>
          </div>
          <HomeAwayLegendLine />
          <SubtitleLine>{data.deadline}</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          {data.ties.map((tie, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 12,
                background: '#27092F',
                border: '1px solid rgba(243,240,234,0.12)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 3, color: '#9E84AE' }}>{tie.label}</span>
              <FixtureCard fixture={tie} cardWidthPx={cardWidthPx} vsSize={68} />
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

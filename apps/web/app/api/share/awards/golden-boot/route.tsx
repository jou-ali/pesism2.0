import { ImageResponse } from 'next/og';
import { loadShareFonts } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, AwardHeroPanel, StatCard, ChasingPackCard } from '@/lib/share/components';
import { getGoldenBootData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getGoldenBootData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const fonts = await loadShareFonts();
  // Furore has no U+2212 glyph — use the ASCII hyphen here; the true minus stays in Onest text (the table's GD column).
  const gd = data.goalDiff >= 0 ? `+${data.goalDiff}` : `-${Math.abs(data.goalDiff)}`;

  return new ImageResponse(
    (
      <PosterFrame tag="SEASON AWARD" glow="awardGold">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>GOLDEN</span>
            <span style={{ color: '#DED002' }}>BOOT</span>
          </div>
          <SubtitleLine>Most goals scored this season</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'row', gap: 16 }}>
          <AwardHeroPanel side={data.leader} tint="rgba(218,41,28,0.45)" />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 24, background: '#DED002', color: '#1E0825', borderRadius: 24, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>GOALS</span>
                <span style={{ fontFamily: 'Furore', fontSize: 96, lineHeight: 0.95 }}>{data.goals}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, paddingLeft: 24, borderLeft: '2px solid rgba(30,8,37,0.18)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>+{data.clearOfSecond}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>clear of 2nd place</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>{data.goalsPerMatch.toFixed(2)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>goals per match</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="MATCHES" value={String(data.matches)} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="GOAL DIFF" value={gd} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="BIGGEST HAUL" value={data.biggestHaul ? `${data.biggestHaul.goals} v ${data.biggestHaul.opponentShort}` : '—'} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="BLANKS" value={String(data.blanks)} />
                </div>
              </div>
            </div>
            <ChasingPackCard label="CHASING PACK" rows={data.chasers} />
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

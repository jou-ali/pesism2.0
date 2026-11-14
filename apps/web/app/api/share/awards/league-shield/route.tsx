import { ImageResponse } from 'next/og';
import { loadShareFonts } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, AwardHeroPanel, StatCard, ChasingPackCard } from '@/lib/share/components';
import { getLeagueShieldData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getLeagueShieldData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const fonts = await loadShareFonts();

  return new ImageResponse(
    (
      <PosterFrame tag="LEAGUE STAGE · DONE" glow="default">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>LEAGUE</span>
            <span style={{ color: '#DED002' }}>SHIELD</span>
          </div>
          <SubtitleLine>Top of the table after {data.totalMatchdays} matchdays</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'row', gap: 16 }}>
          <AwardHeroPanel side={data.leader} tint="rgba(200,16,46,0.45)" />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 24, background: '#DED002', color: '#1E0825', borderRadius: 24, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>POINTS</span>
                <span style={{ fontFamily: 'Furore', fontSize: 96, lineHeight: 0.95 }}>{data.points}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, paddingLeft: 24, borderLeft: '2px solid rgba(30,8,37,0.18)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>+{data.clearOfSecond}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>clear of 2nd place</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>{data.pointsPerMatch.toFixed(2)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>points per match</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="RECORD" value={`W${data.record.won} D${data.record.drawn} L${data.record.lost}`} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  {/* Furore has no U+2212 glyph — ASCII hyphen here. */}
                  <StatCard label="GOAL DIFF" value={data.goalDiff >= 0 ? `+${data.goalDiff}` : `-${Math.abs(data.goalDiff)}`} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="SCORED" value={String(data.goalsScored)} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="CONCEDED" value={String(data.goalsConceded)} />
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

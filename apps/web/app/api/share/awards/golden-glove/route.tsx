import { ImageResponse } from 'next/og';
import { loadShareFonts } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, AwardHeroPanel, StatCard, ChasingPackCard } from '@/lib/share/components';
import { getGoldenGloveData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getGoldenGloveData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const fonts = await loadShareFonts();

  return new ImageResponse(
    (
      <PosterFrame tag="SEASON AWARD" glow="awardGold">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>GOLDEN</span>
            <span style={{ color: '#DED002' }}>GLOVE</span>
          </div>
          <SubtitleLine>Fewest goals conceded this season</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'row', gap: 16 }}>
          <AwardHeroPanel side={data.leader} tint="rgba(0,178,169,0.42)" />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 24, background: '#DED002', color: '#1E0825', borderRadius: 24, padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>CONCEDED</span>
                <span style={{ fontFamily: 'Furore', fontSize: 96, lineHeight: 0.95 }}>{data.conceded}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, paddingLeft: 24, borderLeft: '2px solid rgba(30,8,37,0.18)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Furore has no U+2212 glyph — ASCII hyphen here, same 34px treatment as the +N posters. */}
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>{`-${data.fewerThanSecond}`}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>fewer than 2nd place</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Furore', fontSize: 34, lineHeight: 1 }}>{data.concededPerMatch.toFixed(2)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>conceded per match</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="CLEAN SHEETS" value={String(data.cleanSheets)} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="WINS" value={String(data.wins)} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, width: '100%' }}>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="LONGEST RUN" value={`${data.longestRun} shutouts`} />
                </div>
                <div style={{ display: 'flex', flex: '1 1 0', minWidth: 0 }}>
                  <StatCard label="MATCHES" value={String(data.matches)} />
                </div>
              </div>
            </div>
            <ChasingPackCard label="NEXT BEST" rows={data.chasers} />
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

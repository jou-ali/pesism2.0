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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#DED002', color: '#1E0825', borderRadius: 24, padding: 24 }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>CONCEDED</span>
              <span style={{ fontFamily: 'Furore', fontSize: 96, lineHeight: 0.95 }}>{data.conceded}</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>In {data.matches} matches. A brick wall.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', width: 242 }}>
                <StatCard label="CLEAN SHEETS" value={String(data.cleanSheets)} />
              </div>
              <div style={{ display: 'flex', width: 242 }}>
                <StatCard label="PER MATCH" value={data.concededPerMatch.toFixed(2)} />
              </div>
              <div style={{ display: 'flex', width: 242 }}>
                <StatCard label="LONGEST RUN" value={`${data.longestRun} shutouts`} />
              </div>
              <div style={{ display: 'flex', width: 242 }}>
                <StatCard label="MATCHES" value={String(data.matches)} />
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

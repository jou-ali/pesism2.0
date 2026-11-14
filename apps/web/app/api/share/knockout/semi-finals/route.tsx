import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, PlayerPhoto, Shield, Chip } from '@/lib/share/components';
import { getSemiFinalsData } from '@/lib/share/data';
import type { Side } from '@/lib/share/types';

export const runtime = 'nodejs';

function SfSide({ side, align }: { side: Side; align: 'left' | 'right' }) {
  const info = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', gap: 10, minWidth: 0 }}>
      <Shield size={52} short={side.short} c1={side.primaryColor} c2={side.secondaryColor} ink={side.ink} crestUrl={side.crestUrl} />
      <span style={{ fontFamily: 'Furore', fontSize: 28, lineHeight: 1.05 }}>{side.teamName}</span>
      <span style={{ fontSize: 20, fontWeight: 600, color: '#CBB8D9' }}>{side.playerName}</span>
    </div>
  );
  const photo = <PlayerPhoto width={176} height={220} photoUrl={side.photoUrl} labelAlign={align} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20, minWidth: 0, flex: 1, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {align === 'left' ? (
        <>
          {photo}
          {info}
        </>
      ) : (
        <>
          {info}
          {photo}
        </>
      )}
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getSemiFinalsData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);

  return new ImageResponse(
    (
      <PosterFrame tag="KNOCKOUTS" trophyDataUri={trophy}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>SEMI</span>
            <span style={{ color: '#DED002' }}>FINALS</span>
          </div>
          <SubtitleLine>{data.deadline}</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.ties.map((tie, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 14,
                background: '#27092F',
                border: '1px solid rgba(243,240,234,0.12)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 3, color: '#9E84AE' }}>{tie.label}</span>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                <SfSide side={tie.home} align="left" />
                <Chip text="VS" shape="circle" size={76} fontSize={26} fontFamily="Furore" />
                <SfSide side={tie.away} align="right" />
              </div>
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

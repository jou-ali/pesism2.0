import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, PlayerPhoto, Shield, Chip, FitTeamName, POSTER_CONTENT_WIDTH } from '@/lib/share/components';
import { getSemiFinalsData } from '@/lib/share/data';
import type { Side } from '@/lib/share/types';

export const runtime = 'nodejs';

const CARD_PADDING = 20;
const ROW_GAP = 16;
const VS_SIZE = 76;
const PHOTO_WIDTH = 176;
const PHOTO_GAP = 20;

// Card content width (936 poster width minus this card's own padding), minus the VS badge and the
// two gaps around it, split across both sides, minus the fixed-size photo and the gap before the
// text column — whatever's left is the text column's own exact, unguessed width.
const SIDE_WIDTH = (POSTER_CONTENT_WIDTH - CARD_PADDING * 2 - ROW_GAP * 2 - VS_SIZE) / 2;
const COLUMN_WIDTH_PX = SIDE_WIDTH - PHOTO_WIDTH - PHOTO_GAP;

function SfSide({ side, align }: { side: Side; align: 'left' | 'right' }) {
  const column = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', gap: 8, minWidth: 0, flex: 1 }}>
      <Shield size={56} teamName={side.teamName} crestUrl={side.crestUrl} />
      <FitTeamName text={side.teamName} maxWidthPx={COLUMN_WIDTH_PX} max={28} min={18} align={align} />
      <span style={{ fontSize: 20, fontWeight: 500, color: '#CBB8D9' }}>{side.playerName}</span>
    </div>
  );
  const photo = <PlayerPhoto width={PHOTO_WIDTH} height={220} photoUrl={side.photoUrl} labelAlign={align} />;
  // Two real branches, not row-reverse — row-reverse on a flex:1 parent with a non-grow child
  // miscomputes its width in Satori, stretching it left into the VS badge.
  const outerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: PHOTO_GAP, minWidth: 0, flex: 1 };
  return align === 'left' ? (
    <div style={outerStyle}>
      {photo}
      {column}
    </div>
  ) : (
    <div style={outerStyle}>
      {column}
      {photo}
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
                padding: 20,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 3, color: '#9E84AE' }}>{tie.label}</span>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' }}>
                <SfSide side={tie.home} align="left" />
                <Chip text="VS" shape="circle" size={76} fontSize={26} fontFamily="Furore" bg="#DED002" color="#1E0825" />
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

import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, Shield, Chip, FitTeamName, POSTER_CONTENT_WIDTH } from '@/lib/share/components';
import { getFinalPreviewData } from '@/lib/share/data';
import { fallbackPaletteFor } from '@/lib/crest';
import type { Side } from '@/lib/share/types';

export const runtime = 'nodejs';

// Trophy column is 200 fixed; the two panels split the rest evenly, each with 24px padding,
// a 56px crest and a 16px gap before the text column starts.
const PANEL_TEXT_WIDTH_PX = (POSTER_CONTENT_WIDTH - 200) / 2 - 24 * 2 - 56 - 16;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function FinalPanel({ side, align }: { side: Side; align: 'left' | 'right' }) {
  const [primaryColor] = fallbackPaletteFor(side.teamName);
  const tint = hexToRgba(primaryColor, align === 'left' ? 0.45 : 0.4);
  const radius = align === 'left' ? '24px 0 0 24px' : '0 24px 24px 0';
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        borderRadius: radius,
        background: `linear-gradient(180deg, #341040 0%, #27092F 55%, ${tint} 100%)`,
        border: '1px solid rgba(243,240,234,0.12)',
      }}
    >
      {side.photoUrl ? (
        <img src={side.photoUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <svg width="100%" height="70%" viewBox="0 0 200 220" style={{ position: 'absolute', bottom: 150, left: 0 }}>
          <circle cx={100} cy={70} r={42} fill="#4A1C58" />
          <path d="M18 220c6-60 40-92 82-92s76 32 82 92z" fill="#4A1C58" />
        </svg>
      )}
      <span
        style={{
          position: 'absolute',
          top: 24,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 2,
          color: '#9E84AE',
          ...(align === 'left' ? { left: 24 } : { right: 24 }),
        }}
      >
        {side.photoUrl ? '' : 'PLAYER PHOTO'}
      </span>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          gap: 16,
          padding: 24,
          textAlign: align === 'right' ? 'right' : 'left',
          background: 'linear-gradient(180deg, rgba(30,8,37,0) 0%, rgba(30,8,37,0.85) 40%)',
        }}
      >
        <Shield size={56} teamName={side.teamName} crestUrl={side.crestUrl} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <FitTeamName text={side.teamName} maxWidthPx={PANEL_TEXT_WIDTH_PX} max={26} min={18} align={align} lineHeight={1} />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#CBB8D9' }}>{side.playerName}</span>
        </div>
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getFinalPreviewData(useSample);
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);

  return new ImageResponse(
    (
      <PosterFrame tag="GRAND FINAL" glow="final">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>THE</span>
            <span style={{ color: '#DED002' }}>FINAL</span>
          </div>
          <SubtitleLine>{data.dateLine}</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 0 }}>
          <FinalPanel side={data.home} align="left" />
          <div
            style={{
              flexShrink: 0,
              width: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: '#1E0825',
              borderTop: '1px solid rgba(243,240,234,0.12)',
              borderBottom: '1px solid rgba(243,240,234,0.12)',
            }}
          >
            <img src={trophy} width={170} />
            <Chip text="VS" shape="circle" size={84} fontSize={30} fontFamily="Furore" bg="#DED002" color="#1E0825" />
          </div>
          <FinalPanel side={data.away} align="right" />
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

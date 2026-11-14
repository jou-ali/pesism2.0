import { ImageResponse } from 'next/og';
import { loadShareFonts, loadTrophyDataUri } from '@/lib/share/assets';
import { PosterFrame, SubtitleLine, Shield, furoreCase } from '@/lib/share/components';
import { getChampionData } from '@/lib/share/data';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const useSample = searchParams.get('sample') === '1';

  const data = await getChampionData(useSample, searchParams.get('case') === 'draw');
  if (!data) return new Response('Not found', { status: 404 });

  const [fonts, trophy] = await Promise.all([loadShareFonts(), loadTrophyDataUri()]);
  const w = data.winner;

  return new ImageResponse(
    (
      <PosterFrame tag="FULL TIME · SEASON OVER" glow="champion">
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 112, lineHeight: 0.9 }}>
            <span>THE</span>
            <span style={{ color: '#DED002' }}>CHAMPION</span>
          </div>
          <SubtitleLine>Talk is over. Bow down.</SubtitleLine>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'row', gap: 16, minHeight: 0 }}>
          <div
            style={{
              position: 'relative',
              flex: 1.15,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              borderRadius: 24,
              background: 'linear-gradient(160deg, #341040 0%, #27092F 50%, rgba(0,178,169,0.4) 100%)',
              border: '1px solid rgba(245,185,59,0.45)',
            }}
          >
            {w.photoUrl ? (
              <img src={w.photoUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="100%" height="78%" viewBox="0 0 200 180" style={{ position: 'absolute', bottom: 0, left: 0 }}>
                <circle cx={100} cy={58} r={38} fill="#4A1C58" />
                <path d="M14 180c6-54 40-82 86-82s80 28 86 82z" fill="#4A1C58" />
              </svg>
            )}
            <span style={{ position: 'absolute', top: 24, left: 24, fontSize: 12, fontWeight: 800, letterSpacing: 2, color: '#9E84AE' }}>
              {w.photoUrl ? '' : 'PLAYER PHOTO'}
            </span>
            <span
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#DED002',
                color: '#1E0825',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2,
                padding: '8px 16px',
                borderRadius: 999,
              }}
            >
              CHAMPION
            </span>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 18,
                padding: 24,
                background: 'linear-gradient(180deg, rgba(30,8,37,0) 0%, rgba(30,8,37,0.9) 45%)',
              }}
            >
              <Shield size={72} teamName={w.teamName} crestUrl={w.crestUrl} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontFamily: 'Furore', fontSize: 56, lineHeight: 0.95 }}>{furoreCase(w.playerName)}</span>
                <span style={{ fontSize: 22, fontWeight: 600, color: '#CBB8D9' }}>{w.teamName}</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'row',
                borderRadius: 24,
                overflow: 'hidden',
                // A radial-gradient here renders as a visible ring in Satori (it bands at the
                // colour stop instead of fading smoothly), so the glow is a plain circle instead.
                background: '#27092F',
                border: '1px solid rgba(245,185,59,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Soft gold glow behind the cup — two stacked circles rather than a radial-gradient
                  (which bands into a ring in Satori). The box-shadow blur softens the inner one;
                  the second, larger, fainter circle extends the falloff further out. */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 520,
                  height: 520,
                  borderRadius: 260,
                  background: 'rgba(245,185,59,0.06)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 300,
                  height: 300,
                  borderRadius: 150,
                  background: 'rgba(245,185,59,0.12)',
                  boxShadow: '0 0 100px 50px rgba(245,185,59,0.12)',
                }}
              />
              {/* A percentage (or calc()) height on this <img> renders invisibly in Satori — only an
                  explicit pixel height works. 350 is sized to sit comfortably inside this flex:1 card
                  with roughly a 24px breath on every side at the sample data's card height. */}
              <img src={trophy} height={350} style={{ filter: 'drop-shadow(0 0 20px rgba(245,185,59,0.2))' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#DED002', color: '#1E0825', borderRadius: 24, padding: 24 }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>THE FINAL</span>
              <span style={{ fontFamily: 'Furore', fontSize: 30, lineHeight: 1.1 }}>{furoreCase(data.scoreLine)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', background: '#27092F', border: '1px solid rgba(243,240,234,0.12)', borderRadius: 24, padding: '8px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(243,240,234,0.12)' }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: '#9E84AE' }}>RECORD</span>
                <span style={{ fontFamily: 'Furore', fontSize: 26 }}>
                  W{data.record.won} D{data.record.drawn} L{data.record.lost}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2, color: '#9E84AE' }}>GOALS</span>
                <span style={{ fontFamily: 'Furore', fontSize: 26 }}>{data.goalsScored} scored</span>
              </div>
            </div>
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

import type { Badge, ChaserRow, Fixture, Movement, Side, TableRowData, Tie } from './types';
import { fitFontSize } from './fit-text';
import { initialsFor, fallbackPaletteFor } from '@/lib/crest';
import { inkFor } from './colors';

const INK = '#F3F0EA';
const MUTED = '#9E84AE';
const MUTED_2 = '#CBB8D9';
const YELLOW = '#DED002';
const YELLOW_INK = '#1E0825';
const WINE = '#830D5C';
const DOWN = '#E0689F';
const CARD_BG = '#27092F';
const LINE = 'rgba(243,240,234,0.12)';

const SHIELD_PATH = 'M36 2 68 12v28c0 20-14 34-32 42C18 74 4 60 4 40V12z';
const SHIELD_BAND = 'M36 2 68 12v8H4v-8z';

/** Furore is caps-only and drops glyphs it doesn't have (missing accents fall back to another
 * font mid-word) — strip diacritics and uppercase before handing text to it. Onest keeps accents. */
export function furoreCase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/** A team name, sized to the real Furore glyph metrics so it always fits `maxWidthPx` without ever
 * truncating \u2014 wraps onto a second line only if it still doesn't fit at `min`. Every caller must
 * compute and pass its own exact available width; this never guesses or clips. */
export function FitTeamName({
  text,
  maxWidthPx,
  max,
  min,
  align = 'left',
  lineHeight = 1.05,
  color = INK,
}: {
  text: string;
  maxWidthPx: number;
  max: number;
  min: number;
  align?: 'left' | 'right';
  lineHeight?: number;
  color?: string;
}) {
  const { size, lineTexts } = fitFontSize(furoreCase(text), maxWidthPx, { max, min });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {lineTexts.map((line, i) => (
        <span key={i} style={{ fontFamily: 'Furore', fontSize: size, lineHeight, color, whiteSpace: 'nowrap' }}>
          {line}
        </span>
      ))}
    </div>
  );
}

/** The team shield shape — generated badge (two-tone fill + short name) or a real uploaded crest
 * image. There's no stored colour anywhere: the generated badge's colours and short code are
 * always derived from the team name's hash (`lib/crest.ts`), the same function the public site's
 * `TeamCrest` uses, so a team looks the same everywhere until it has a real uploaded crest. */
export function Shield({
  size,
  height: heightProp,
  teamName,
  crestUrl,
}: {
  size: number;
  height?: number;
  teamName: string;
  crestUrl?: string | null;
}) {
  const height = heightProp ?? Math.round(size * (84 / 72));
  if (crestUrl) {
    return (
      <img
        src={crestUrl}
        width={size}
        height={height}
        style={{ objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }
  const short = initialsFor(teamName);
  const [c1, c2] = fallbackPaletteFor(teamName);
  const ink = inkFor(c1);
  // Satori doesn't support <text> inside <svg> — draw the shield shape only, then overlay the
  // short name as a native (non-SVG) element so it still renders in Furore.
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative', width: size, height, flexShrink: 0 }}>
      <svg width={size} height={height} viewBox="0 0 72 84" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d={SHIELD_PATH} fill={c1} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
        <path d={SHIELD_BAND} fill={c2} />
      </svg>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '62%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Furore',
          fontSize: Math.round(size * 0.25),
          color: ink,
        }}
      >
        {short}
      </span>
    </div>
  );
}

/** Alias matching the spec's naming — identical to Shield. */
export const Crest = Shield;

function PlayerSilhouette({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 140" style={{ position: 'absolute', bottom: 0 }}>
      <circle cx={60} cy={48} r={28} fill="#4A1C58" />
      <path d="M8 140c4-38 26-58 52-58s48 20 52 58z" fill="#4A1C58" />
    </svg>
  );
}

/** The portrait slot: a real uploaded photo, or the design's silhouette placeholder with a "PLAYER PHOTO" label. */
export function PlayerPhoto({
  width,
  height,
  radius = 20,
  photoUrl,
  labelAlign = 'left',
}: {
  width: number;
  height: number;
  radius?: number;
  photoUrl?: string | null;
  labelAlign?: 'left' | 'right';
}) {
  if (photoUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row', position: 'relative', width, height, borderRadius: radius, overflow: 'hidden' }}>
        <img src={photoUrl} width={width} height={height} style={{ objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #341040, #1E0825)',
        border: `1px solid ${LINE}`,
      }}
    >
      <PlayerSilhouette width={Math.round(width * 0.68)} height={Math.round(height * 0.64)} />
      <span
        style={{
          position: 'absolute',
          top: 14,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          color: MUTED,
          ...(labelAlign === 'left' ? { left: 14 } : { right: 14 }),
        }}
      >
        PLAYER PHOTO
      </span>
    </div>
  );
}

/** A small pill-shaped (or circular) label — the header tag, "CHAMPION" ribbon, VS badges. */
export function Chip({
  text,
  shape = 'pill',
  size,
  bg = WINE,
  color = INK,
  fontSize = 18,
  fontFamily = 'Onest',
  fontWeight = 700,
  letterSpacing = 3,
  padding,
}: {
  text: string;
  shape?: 'pill' | 'circle';
  size?: number;
  bg?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: 'Onest' | 'Furore';
  fontWeight?: number;
  letterSpacing?: number;
  padding?: string;
}) {
  if (shape === 'circle' && size) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          background: bg,
          color,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily,
          fontSize,
        }}
      >
        {text}
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        background: bg,
        color,
        fontFamily,
        fontSize,
        fontWeight,
        letterSpacing,
        padding: padding ?? '12px 22px',
        borderRadius: 999,
      }}
    >
      {text}
    </div>
  );
}

/** One label+value tile in the 2x2 stat grids (RECORD, GOAL DIFF, MATCHES, ...). */
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        boxSizing: 'border-box',
        gap: 4,
        background: CARD_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 20,
        padding: '18px 24px',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: MUTED }}>{label}</span>
      <span style={{ fontFamily: 'Furore', fontSize: 26, color: INK }}>{value}</span>
    </div>
  );
}

/** The "dot + copy" subtitle line under every poster's title block. */
export function SubtitleLine({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, fontSize: 24, fontWeight: 600, color: MUTED_2 }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: 12, height: 12, borderRadius: 6, background: YELLOW, flexShrink: 0 }} />
      <span style={{ display: 'flex' }}>{children}</span>
    </div>
  );
}

/** Matches admin fixtures: home on the left, away on the right. */
export function HomeAwayLegendLine() {
  return <SubtitleLine>Left = Home · Right = Away</SubtitleLine>;
}

function SideRoleTag({ role, align }: { role: 'home' | 'away'; align: 'left' | 'right' }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        color: YELLOW,
        alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {role === 'home' ? 'Home' : 'Away'}
    </span>
  );
}

function SideBlock({
  side,
  align,
  role,
  crestSize = 72,
  fitMax,
  fitMin,
  textWidthPx,
  playerFontSize = 20,
  gap = 18,
}: {
  side: Fixture['home'];
  align: 'left' | 'right';
  role: 'home' | 'away';
  crestSize?: number;
  fitMax: number;
  fitMin: number;
  textWidthPx: number;
  playerFontSize?: number;
  gap?: number;
}) {
  const info = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <SideRoleTag role={role} align={align} />
      <FitTeamName text={side.teamName} maxWidthPx={textWidthPx} max={fitMax} min={fitMin} align={align} />
      <span style={{ fontSize: playerFontSize, fontWeight: 500, color: MUTED_2 }}>{side.playerName}</span>
    </div>
  );
  const shield = (
    <Shield size={crestSize} teamName={side.teamName} crestUrl={side.crestUrl} />
  );
  // Mirrors the reference's CSS grid "minmax(0,1fr)" side columns: flex:1 to fill the row, with
  // minWidth:0 so the ellipsis text block can actually shrink instead of forcing an overflow.
  // [shield, info] are always direct children (no Fragment) — Satori doesn't apply this row's
  // `gap`/`alignItems` to a Fragment's children, only to its own direct children. `row-reverse`
  // flips the visual order for the right side instead of swapping which element renders first.
  // `justifyContent: 'flex-start'` is correct for BOTH directions: row-reverse also reverses which
  // physical edge "flex-start" packs against (the row's own end), so it still hugs the outer edge.
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap,
        minWidth: 0,
        flex: 1,
        justifyContent: 'flex-start',
      }}
    >
      {shield}
      {info}
    </div>
  );
}

/** The single-row fixture / tie card: crest + team + player on both sides, a VS circle between them.
 * `cardWidthPx` is the card's own inner content width (after its padding) — the caller computes it
 * from its own layout rather than this component guessing it, so the team name can be sized to the
 * real remaining space. */
export function FixtureCard({
  fixture,
  cardWidthPx,
  vsSize = 72,
  vsColumnWidth = 96,
}: {
  fixture: Fixture;
  cardWidthPx: number;
  vsSize?: number;
  vsColumnWidth?: number;
}) {
  const crestSize = 72;
  const gap = 18;
  const textWidthPx = (cardWidthPx - vsColumnWidth) / 2 - crestSize - gap;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <SideBlock side={fixture.home} align="left" role="home" crestSize={crestSize} gap={gap} textWidthPx={textWidthPx} fitMax={26} fitMin={18} />
      <div style={{ display: 'flex', flexDirection: 'row', width: vsColumnWidth, flexShrink: 0, justifyContent: 'center' }}>
        <Chip text="VS" shape="circle" size={vsSize} fontSize={Math.round(vsSize * 0.36)} fontFamily="Furore" bg="#DED002" color="#1E0825" />
      </div>
      <SideBlock side={fixture.away} align="right" role="away" crestSize={crestSize} gap={gap} textWidthPx={textWidthPx} fitMax={26} fitMin={18} />
    </div>
  );
}

/** The compact single-row fixture tile used once there are 6-7 fixtures on a matchday. */
export function CompactFixtureCard({ fixture, cardWidthPx }: { fixture: Fixture; cardWidthPx: number }) {
  const crestSize = 48;
  const gap = 14;
  const vsColumnWidth = 72;
  const textWidthPx = (cardWidthPx - vsColumnWidth) / 2 - crestSize - gap;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <SideBlock side={fixture.home} align="left" role="home" crestSize={crestSize} playerFontSize={17} gap={gap} textWidthPx={textWidthPx} fitMax={22} fitMin={16} />
      <div style={{ display: 'flex', flexDirection: 'row', width: vsColumnWidth, flexShrink: 0, justifyContent: 'center' }}>
        <Chip text="VS" fontFamily="Furore" fontSize={16} bg={YELLOW} color={YELLOW_INK} padding="5px 12px" letterSpacing={0} />
      </div>
      <SideBlock side={fixture.away} align="right" role="away" crestSize={crestSize} playerFontSize={17} gap={gap} textWidthPx={textWidthPx} fitMax={22} fitMin={16} />
    </div>
  );
}

function MovementArrow({ movement }: { movement: Movement | null }) {
  if (movement === 'up') {
    return (
      <svg width={16} height={14} viewBox="0 0 18 16">
        <path d="M9 1 17 15H1z" fill={YELLOW} />
      </svg>
    );
  }
  if (movement === 'down') {
    return (
      <svg width={16} height={14} viewBox="0 0 18 16">
        <path d="M9 15 1 1h16z" fill={DOWN} />
      </svg>
    );
  }
  return (
    <svg width={16} height={14} viewBox="0 0 18 16">
      <rect x={3} y={6.5} width={12} height={3} rx={1.5} fill={MUTED} />
    </svg>
  );
}

const fmtGd = (gd: number) => (gd > 0 ? `+${gd}` : gd < 0 ? `−${Math.abs(gd)}` : '0');

/** One league-table row. `dense` is the 11-14 player layout ("team · player" on one line, smaller type). */
/** Reserved width for the "· PlayerName" portion of a dense row's single-line team+player text,
 * so the team name's own fit-width is exact rather than a flex:1 guess shared with a sibling. */
const DENSE_PLAYER_RESERVE_PX = 150;

export function TableRow({ row, dense = false, rowWidthPx }: { row: TableRowData; dense?: boolean; rowWidthPx: number }) {
  const posStr = String(row.pos).padStart(2, '0');
  const posColor = row.qualifies ? YELLOW : MUTED;
  const ptsColor = row.isLeader ? YELLOW : INK;
  const crestSize = dense ? 30 : 40;
  const crestHeight = dense ? 35 : 46;

  const cols = dense
    ? { gap: 10, pad: '3px 8px', radius: 12, pos: 22, stat: 19, pts: 26, colW: [40, 20, 30, 48, 58] }
    : { gap: 10, pad: '6px 8px', radius: 14, pos: 26, stat: 21, pts: 30, colW: [44, 24, 40, 50, 64] };

  // 10 children (pos, movement, crest, text, 5 stat columns, pts) → 9 gaps. rowWidthPx already
  // excludes this row's own horizontal padding (the caller derives it that way).
  const fixedColsWidth = cols.colW[0] + cols.colW[1] + cols.colW[2] + cols.colW[3] * 5 + cols.colW[4];
  const gapsWidth = cols.gap * 9;
  const textAreaWidth = rowWidthPx - fixedColsWidth - gapsWidth;
  const textWidthPx = dense ? textAreaWidth - 8 - DENSE_PLAYER_RESERVE_PX : textAreaWidth;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: cols.gap,
        padding: cols.pad,
        borderRadius: cols.radius,
        width: '100%',
        opacity: row.qualifies ? 1 : 0.6,
        ...(row.isLeader
          ? { background: 'rgba(222,208,2,0.1)', boxShadow: 'inset 0 0 0 1px rgba(222,208,2,0.35)' }
          : {}),
      }}
    >
      <span style={{ display: 'flex', width: cols.colW[0], fontFamily: 'Furore', fontSize: cols.pos, color: posColor }}>{posStr}</span>
      <div style={{ display: 'flex', flexDirection: 'row', width: cols.colW[1], alignItems: 'center', justifyContent: 'center' }}>
        <MovementArrow movement={row.movement} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', width: cols.colW[2] }}>
        <Shield size={crestSize} height={crestHeight} teamName={row.teamName} crestUrl={row.crestUrl} />
      </div>
      {dense ? (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 0, flex: 1 }}>
          <FitTeamName text={row.teamName} maxWidthPx={textWidthPx} max={18} min={14} />
          <span style={{ fontSize: 15, fontWeight: 500, color: MUTED_2, flexShrink: 0 }}>&middot; {row.player}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
          <FitTeamName text={row.teamName} maxWidthPx={textWidthPx} max={21} min={14} />
          <span style={{ fontSize: 16, fontWeight: 500, color: MUTED_2 }}>{row.player}</span>
        </div>
      )}
      <span style={{ display: 'flex', width: cols.colW[3], justifyContent: 'center', fontSize: cols.stat, fontWeight: 600, color: MUTED_2 }}>{row.played}</span>
      <span style={{ display: 'flex', width: cols.colW[3], justifyContent: 'center', fontSize: cols.stat, fontWeight: 600, color: MUTED_2 }}>{row.won}</span>
      <span style={{ display: 'flex', width: cols.colW[3], justifyContent: 'center', fontSize: cols.stat, fontWeight: 600, color: MUTED_2 }}>{row.drawn}</span>
      <span style={{ display: 'flex', width: cols.colW[3], justifyContent: 'center', fontSize: cols.stat, fontWeight: 600, color: MUTED_2 }}>{row.lost}</span>
      <span style={{ display: 'flex', width: cols.colW[3], justifyContent: 'center', fontSize: cols.stat, fontWeight: 600, color: MUTED_2 }}>{fmtGd(row.goalDiff)}</span>
      <span style={{ display: 'flex', width: cols.colW[4], justifyContent: 'flex-end', fontFamily: 'Furore', fontSize: cols.pts, color: ptsColor }}>{row.points}</span>
    </div>
  );
}

export function TableHeaderRow({ dense = false }: { dense?: boolean }) {
  const colW = dense ? [40, 20, 30, 48, 58] : [44, 24, 40, 50, 64];
  const label = (text: string, width: number, align: 'left' | 'center' | 'right' = 'center') => (
    <span style={{ display: 'flex', width, justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
      {text}
    </span>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: dense ? '6px 8px 8px' : '8px 8px 10px',
        fontSize: dense ? 14 : 15,
        fontWeight: 700,
        letterSpacing: 2,
        color: MUTED,
        borderBottom: `1px solid ${LINE}`,
        width: '100%',
      }}
    >
      {label('#', colW[0], 'left')}
      {label('', colW[1])}
      {label('', colW[2])}
      <span style={{ display: 'flex', flex: 1 }}>{dense ? 'TEAM · PLAYER' : 'TEAM'}</span>
      {label('P', colW[3])}
      {label('W', colW[3])}
      {label('D', colW[3])}
      {label('L', colW[3])}
      {label('GD', colW[3])}
      {label('PTS', colW[4], 'right')}
    </div>
  );
}

export function CutLine({ label = 'QUARTER-FINAL LINE', small = false }: { label?: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, padding: small ? '2px 8px' : '4px 8px' }}>
      <div style={{ display: 'flex', flex: 1, height: 0, borderTop: `2px dashed ${YELLOW}` }} />
      <span style={{ fontSize: small ? 12 : 13, fontWeight: 800, letterSpacing: 3, color: YELLOW }}>{label}</span>
      <div style={{ display: 'flex', flex: 1, height: 0, borderTop: `2px dashed ${YELLOW}` }} />
    </div>
  );
}

/** One row in a "chasing pack" / "next best" list — position, crest, name, value. */
export function ChasingPackRow({ row }: { row: ChaserRow }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
      <span style={{ display: 'flex', width: 30, fontFamily: 'Furore', fontSize: 20, color: MUTED }}>{String(row.pos).padStart(2, '0')}</span>
      <Shield size={30} teamName={row.teamName} crestUrl={row.crestUrl} />
      <span
        style={{
          display: 'flex',
          flex: 1,
          fontSize: 18,
          fontWeight: 600,
          color: INK,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.player} &middot;&nbsp;<span style={{ color: MUTED_2 }}>{row.teamName}</span>
      </span>
      <span style={{ fontFamily: 'Furore', fontSize: 22, color: INK }}>{row.value}</span>
    </div>
  );
}

/** The 420px hero panel used by the three stat-award posters (League Shield / Golden Boot / Golden Glove). */
export function AwardHeroPanel({ side, tint }: { side: Side; tint: string }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 420,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        borderRadius: 24,
        background: `linear-gradient(180deg, #341040 0%, #27092F 55%, ${tint} 100%)`,
        border: '1px solid rgba(222,208,2,0.45)',
      }}
    >
      {side.photoUrl ? (
        <img src={side.photoUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <svg width={420} height={420} viewBox="0 0 200 200" style={{ position: 'absolute', bottom: 110, left: 0 }}>
          <circle cx={100} cy={66} r={40} fill="#4A1C58" />
          <path d="M14 200c6-58 40-88 86-88s80 30 86 88z" fill="#4A1C58" />
        </svg>
      )}
      <span style={{ position: 'absolute', top: 24, left: 24, fontSize: 12, fontWeight: 800, letterSpacing: 2, color: MUTED }}>
        {side.photoUrl ? '' : 'PLAYER PHOTO'}
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
        <Shield size={60} teamName={side.teamName} crestUrl={side.crestUrl} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontFamily: 'Furore', fontSize: 40, lineHeight: 1 }}>{furoreCase(side.playerName)}</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: MUTED_2 }}>{side.teamName}</span>
        </div>
      </div>
    </div>
  );
}

/** The "CHASING PACK" / "NEXT BEST" card wrapping a list of ChasingPackRow. */
export function ChasingPackCard({ label, rows }: { label: string; rows: ChaserRow[] }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
        background: CARD_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 24,
        padding: 24,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: MUTED }}>{label}</span>
      {rows.map((row, i) => (
        <ChasingPackRow key={i} row={row} />
      ))}
    </div>
  );
}

// Each variant is wrapped in a single absolutely-positioned div (not a bare Fragment) — Satori's
// flex `gap` otherwise still reserves a gap slot for a Fragment's children even though they're
// position:absolute, pushing the header down by one full gap (40px).
function GlowLayer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'row' }}>
      {children}
    </div>
  );
}

const GLOWS: Record<'default' | 'champion' | 'awardGold' | 'final', React.ReactNode> = {
  default: (
    <GlowLayer>
      <div
        style={{
          position: 'absolute',
          top: -260,
          right: -220,
          width: 900,
          height: 900,
          borderRadius: 450,
          background:
            'radial-gradient(circle, rgba(153,56,212,0.42) 0%, rgba(153,56,212,0.12) 45%, rgba(30,8,37,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          left: -260,
          width: 760,
          height: 760,
          borderRadius: 380,
          background: 'radial-gradient(circle, rgba(222,208,2,0.14) 0%, rgba(30,8,37,0) 65%)',
        }}
      />
    </GlowLayer>
  ),
  // Same violet top-right glow as 'default' — the earlier gold→violet hue mix rendered as a
  // visible ring (Satori's radial-gradient interpolation bands at a colour-stop, not just an
  // opacity stop), and looked like a muddy brown blob.
  champion: (
    <GlowLayer>
      <div
        style={{
          position: 'absolute',
          top: -260,
          right: -220,
          width: 900,
          height: 900,
          borderRadius: 450,
          background:
            'radial-gradient(circle, rgba(153,56,212,0.42) 0%, rgba(153,56,212,0.12) 45%, rgba(30,8,37,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          left: -260,
          width: 760,
          height: 760,
          borderRadius: 380,
          background: 'radial-gradient(circle, rgba(222,208,2,0.14) 0%, rgba(30,8,37,0) 65%)',
        }}
      />
    </GlowLayer>
  ),
  // Same violet top-right glow as 'default' — a gold→violet mix rendered as a muddy brown ring in
  // Satori (it bands at the colour stop instead of fading smoothly).
  awardGold: (
    <GlowLayer>
      <div
        style={{
          position: 'absolute',
          top: -260,
          right: -220,
          width: 900,
          height: 900,
          borderRadius: 450,
          background:
            'radial-gradient(circle, rgba(153,56,212,0.42) 0%, rgba(153,56,212,0.12) 45%, rgba(30,8,37,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          left: -260,
          width: 760,
          height: 760,
          borderRadius: 380,
          background: 'radial-gradient(circle, rgba(222,208,2,0.14) 0%, rgba(30,8,37,0) 65%)',
        }}
      />
    </GlowLayer>
  ),
  final: (
    <GlowLayer>
      <div
        style={{
          position: 'absolute',
          top: -260,
          right: -220,
          width: 900,
          height: 900,
          borderRadius: 450,
          background:
            'radial-gradient(circle, rgba(153,56,212,0.42) 0%, rgba(153,56,212,0.12) 45%, rgba(30,8,37,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: 240,
          width: 600,
          height: 600,
          borderRadius: 300,
          background: 'radial-gradient(circle, rgba(245,185,59,0.32) 0%, rgba(245,185,59,0.08) 45%, rgba(30,8,37,0) 70%)',
        }}
      />
    </GlowLayer>
  ),
};

/** The shared 1080x1350 frame: background glows, optional trophy watermark, brand header, tagline footer. */
/** The poster's inner content width: 1080 minus the frame's 72px left/right padding. Routes use
 * this (minus their own card padding) to compute the exact width available to a team name. */
export const POSTER_CONTENT_WIDTH = 1080 - 72 * 2;

export function PosterFrame({
  tag,
  glow = 'default',
  trophyDataUri,
  children,
}: {
  tag: string;
  glow?: 'default' | 'champion' | 'awardGold' | 'final';
  trophyDataUri?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1350,
        overflow: 'hidden',
        background: '#1E0825',
        color: INK,
        fontFamily: 'Onest',
        paddingTop: 64,
        paddingRight: 72,
        paddingBottom: 56,
        paddingLeft: 72,
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      {GLOWS[glow]}
      {trophyDataUri ? (
        <img src={trophyDataUri} width={360} style={{ position: 'absolute', top: 70, right: -40, opacity: 0.22 }} />
      ) : null}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'Furore', fontSize: 40, letterSpacing: 1 }}>TOURNAX</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 4, color: YELLOW }}>PESISM 2.0</span>
        </div>
        <Chip text={tag} />
      </div>

      {children}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          paddingTop: 24,
          borderTop: `1px solid ${LINE}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Furore', fontSize: 26, lineHeight: 1.15, maxWidth: 560 }}>
          <span>The group chat ends here.</span>
          <span style={{ color: YELLOW }}>The pitch decides.</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 600, color: MUTED }}>tournax.auradev.in</span>
      </div>
    </div>
  );
}

export type { Badge, Tie };

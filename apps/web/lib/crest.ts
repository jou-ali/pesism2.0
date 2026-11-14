/** Real clubs get their familiar short code; anything else falls back to its first 3 letters. */
const KNOWN_CLUBS: Record<string, string> = {
  'manchester united': 'MUN',
  'man utd': 'MUN',
  'man united': 'MUN',
  'ac milan': 'ACM',
  milan: 'ACM',
  napoli: 'NAP',
  'real madrid': 'RMA',
  'paris sg': 'PSG',
  'paris saint-germain': 'PSG',
  psg: 'PSG',
  barcelona: 'BAR',
  inter: 'INT',
  internazionale: 'INT',
  liverpool: 'LIV',
  arsenal: 'ARS',
  bayern: 'FCB',
  'bayern munich': 'FCB',
  juventus: 'JUV',
  chelsea: 'CHE',
  'atletico madrid': 'ATM',
  'atlético madrid': 'ATM',
  atletico: 'ATM',
  atlético: 'ATM',
  dortmund: 'BVB',
  'borussia dortmund': 'BVB',
};

export function initialsFor(teamName: string): string {
  const key = teamName.trim().toLowerCase();
  const known = KNOWN_CLUBS[key];
  if (known) return known;
  const letters = teamName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase().padEnd(3, 'X');
  return (letters || '???').padEnd(3, '?').slice(0, 3);
}

/** A deterministic, varied two-tone palette — so every team without an uploaded crest still looks distinct. */
const FALLBACK_PALETTE: Array<[string, string]> = [
  ['#C8102E', '#111111'],
  ['#0068A8', '#FBE122'],
  ['#004D98', '#A50044'],
  ['#EF0107', '#FFFFFF'],
  ['#00B2A9', '#C8102E'],
  ['#FEBE10', '#1E0825'],
  ['#034694', '#FFFFFF'],
  ['#DC052D', '#0066B2'],
  ['#FDE100', '#111111'],
  ['#12A0D7', '#003C82'],
  ['#CB3524', '#272E61'],
  ['#004170', '#DA291C'],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic fallback colours for a team, purely from its name — there's no stored colour
 * anywhere in the system; every crest placeholder (site and posters alike) derives from this. */
export function fallbackPaletteFor(teamName: string): [string, string] {
  return FALLBACK_PALETTE[hashString(teamName) % FALLBACK_PALETTE.length];
}

/** A generated shield placeholder from the team's name — shown until a real crest is uploaded. */
export function crestSvg(teamName: string): string {
  const [c1, c2] = fallbackPaletteFor(teamName);
  const initials = initialsFor(teamName);
  const id = `crest${teamName.length}${initials.charCodeAt(0)}`;

  return `
  <svg viewBox="0 0 200 220" role="img" aria-label="${teamName} crest">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <path d="M100 8 L186 34 V110 C186 160 148 196 100 212 C52 196 14 160 14 110 V34 Z"
          fill="url(#${id})" stroke="rgba(255,255,255,.25)" stroke-width="3"/>
    <text x="100" y="128" text-anchor="middle" font-family="Onest,sans-serif" font-weight="800"
          font-size="72" fill="rgba(0,0,0,.55)">${initials}</text>
  </svg>`;
}

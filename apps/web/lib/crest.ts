function initialsFor(teamName: string): string {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0] ?? '?').slice(0, 2).toUpperCase();
}

/** A generated shield placeholder from the team's own colours, until a real crest is uploaded. */
export function crestSvg(teamName: string, primaryColor: string | null, secondaryColor: string | null): string {
  const c1 = primaryColor ?? '#DED002';
  const c2 = secondaryColor ?? '#9938D4';
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

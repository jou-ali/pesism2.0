import { readFileSync } from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { AdminPageHead } from '@/components/admin-page-head';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const ROUTES: Array<{ title: string; path: string; reference: string }> = [
  { title: 'Matchday preview (5 fixtures, no bye)', path: '/api/share/matchday/3/preview?sample=1', reference: 'matchday-preview.html' },
  { title: 'Matchday preview (7 fixtures, 14 players, no bye)', path: '/api/share/matchday/1/preview?sample=1', reference: 'matchday-preview-14-players.html' },
  { title: 'Matchday preview (6 fixtures + bye, 13 players)', path: '/api/share/matchday/2/preview?sample=1', reference: 'matchday-preview-14-players.html' },
  { title: 'Table after matchday (≤10 rows)', path: '/api/share/matchday/3/table?sample=1', reference: 'table-after-matchday.html' },
  { title: 'Table after matchday (11-14 rows)', path: '/api/share/matchday/4/table?sample=1', reference: 'table-after-matchday-14-players.html' },
  { title: 'Quarter-finals preview', path: '/api/share/knockout/quarter-finals?sample=1', reference: 'quarter-finals-preview.html' },
  { title: 'Semi-finals preview', path: '/api/share/knockout/semi-finals?sample=1', reference: 'semi-finals-preview.html' },
  { title: 'Final preview', path: '/api/share/knockout/final?sample=1', reference: 'final-preview.html' },
  { title: 'Final preview (draw)', path: '/api/share/knockout/final?sample=1', reference: 'final-preview.html' },
  { title: 'Knockout bracket', path: '/api/share/knockout/bracket?sample=1', reference: 'knockout-bracket.html' },
  { title: 'Champion', path: '/api/share/awards/champion?sample=1', reference: 'award-champion.html' },
  { title: 'Champion (draw in the final)', path: '/api/share/awards/champion?sample=1&case=draw', reference: 'award-champion.html' },
  { title: 'League Shield', path: '/api/share/awards/league-shield?sample=1', reference: 'award-league-shield.html' },
  { title: 'Golden Boot', path: '/api/share/awards/golden-boot?sample=1', reference: 'award-golden-boot.html' },
  { title: 'Golden Glove', path: '/api/share/awards/golden-glove?sample=1', reference: 'award-golden-glove.html' },
];

function readReference(file: string): string | null {
  try {
    return readFileSync(path.join(process.cwd(), '..', '..', 'design', 'share', file), 'utf8');
  } catch {
    return null;
  }
}

const SCALE = 0.32;

export default function AdminSharePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <>
      <AdminPageHead eyebrow="Dev only" title="Share poster preview" />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Every poster rendered from sample data, next to its <code>design/share/*.html</code> reference. The reference
        iframe can&apos;t load the real Furore font or trophy asset (dev-only blob paths), so judge it on layout and
        spacing, not exact type or imagery. Not available in production.
      </p>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {ROUTES.map((r, i) => {
          const refHtml = readReference(r.reference);
          return (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm">{r.title}</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-4 p-4 pt-0">
                <div style={{ width: 1080 * SCALE }}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.path} alt={r.title} width={1080 * SCALE} height={1350 * SCALE} style={{ display: 'block', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ width: 1080 * SCALE }}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference</p>
                  {refHtml ? (
                    <div style={{ width: 1080 * SCALE, height: 1350 * SCALE, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <iframe
                        srcDoc={refHtml}
                        title={`${r.title} reference`}
                        width={1080}
                        height={1350}
                        style={{ border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">design/share/{r.reference} not found</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

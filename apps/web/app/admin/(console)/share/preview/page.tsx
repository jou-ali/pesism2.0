import { notFound } from 'next/navigation';
import { AdminPageHead } from '@/components/admin-page-head';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const ROUTES: Array<{ title: string; path: string }> = [
  { title: 'Matchday preview (≤5 fixtures)', path: '/api/share/matchday/2/preview?sample=1' },
  { title: 'Matchday preview (6-7 fixtures, bye row)', path: '/api/share/matchday/3/preview?sample=1' },
  { title: 'Table after matchday (≤10 rows)', path: '/api/share/matchday/3/table?sample=1' },
  { title: 'Table after matchday (11-14 rows)', path: '/api/share/matchday/4/table?sample=1' },
  { title: 'Quarter-finals preview', path: '/api/share/knockout/quarter-finals?sample=1' },
  { title: 'Semi-finals preview', path: '/api/share/knockout/semi-finals?sample=1' },
  { title: 'Final preview', path: '/api/share/knockout/final?sample=1' },
  { title: 'Final preview (draw)', path: '/api/share/knockout/final?sample=1' },
  { title: 'Knockout bracket', path: '/api/share/knockout/bracket?sample=1' },
  { title: 'Champion', path: '/api/share/awards/champion?sample=1' },
  { title: 'Champion (draw in the final)', path: '/api/share/awards/champion?sample=1&case=draw' },
  { title: 'League Shield', path: '/api/share/awards/league-shield?sample=1' },
  { title: 'Golden Boot', path: '/api/share/awards/golden-boot?sample=1' },
  { title: 'Golden Glove', path: '/api/share/awards/golden-glove?sample=1' },
];

export default function AdminSharePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <>
      <AdminPageHead eyebrow="Dev only" title="Share poster preview" />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        All 10 poster types rendered from sample data (no live tournament data required). Compare against the design
        references directly in <code>design/share/*.html</code>. Not available in production.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTES.map((r, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">{r.title}</CardTitle>
            </CardHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.path} alt={r.title} className="w-full" />
          </Card>
        ))}
      </div>
    </>
  );
}

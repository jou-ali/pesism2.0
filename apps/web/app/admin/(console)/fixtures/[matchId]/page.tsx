import { notFound } from 'next/navigation';
import { AdminApiStatus } from '@/components/admin-api-status';
import { AdminEditMatchForm } from '@/components/admin-edit-match-form';
import { AdminPageHead } from '@/components/admin-page-head';
import { getAdminMatch } from '@/lib/tournax-api';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminEditMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  let match;
  let error: string | null = null;
  try {
    match = await getAdminMatch(matchId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not load match';
  }

  if (error?.includes('not found') || error?.includes('404')) {
    notFound();
  }

  return (
    <>
      <AdminPageHead
        eyebrow="Results / Edit"
        title={match ? `${match.homeName} ${match.homeGoals}–${match.awayGoals} ${match.awayName}` : 'Edit result'}
      />

      {error || !match ? (
        <AdminApiStatus error={error ?? 'Match not found'} />
      ) : (
        <Card>
          <CardContent>
            <AdminEditMatchForm match={match} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

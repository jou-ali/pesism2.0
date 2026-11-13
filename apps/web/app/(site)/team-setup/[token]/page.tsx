import type { Metadata } from 'next';
import { getTeamSetupStatus } from '@/lib/tournax-api';
import { TeamSetupForm } from '@/components/team-setup-form';

export const metadata: Metadata = {
  title: 'Complete your team · TOURNAX Season 3',
};

export const dynamic = 'force-dynamic';

export default async function TeamSetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const status = await getTeamSetupStatus(token).catch(() => ({ valid: false, playerName: null, teamName: null }));

  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      <div className="container" style={{ maxWidth: '32rem' }}>
        <div className="section__head">
          <h2 className="h2">Complete your team.</h2>
          {status.valid ? (
            <p className="lead">
              Hi {status.playerName}. Pick the team name you&rsquo;ll play under all season — you can only set this once
              registration closes, so make it count.
            </p>
          ) : (
            <p className="lead">This link is invalid, expired, or already used. Ask an admin for a new one.</p>
          )}
        </div>
        {status.valid ? (
          <div className="panel" style={{ padding: '1.5rem 1.75rem' }}>
            <TeamSetupForm token={token} initialTeamName={status.teamName} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

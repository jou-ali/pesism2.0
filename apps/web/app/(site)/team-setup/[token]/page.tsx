import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTeamSetupStatus } from '@/lib/tournax-api';
import { TeamSetupForm } from '@/components/team-setup-form';

export const metadata: Metadata = {
  title: 'Complete your team · TOURNAX PESISM 2.0',
};

export const dynamic = 'force-dynamic';

export default async function TeamSetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const status = await getTeamSetupStatus(token).catch(() => ({
    valid: false,
    playerName: null,
    avatarUrl: null,
    teamName: null,
    crestUrl: null,
    primaryColor: null,
    secondaryColor: null,
    locked: false,
  }));

  const firstName = status.playerName?.split(' ')[0] ?? '';

  return (
    <section className="section team-setup" data-page="team-setup">
      <div className="container">
        <div className="team-setup__grid">
          <div>
            <p className="team-setup__eyebrow">PESISM 2.0 &middot; Team setup</p>
            <h2 className="h2 team-setup__heading">
              Complete
              <br />
              your team.
            </h2>
            {status.valid ? (
              <p className="lead team-setup__lead">
                Hi {firstName}. Lock in the club you&rsquo;ll play as all season. You can change it until registration
                closes. After that it&rsquo;s final.
              </p>
            ) : (
              <p className="lead team-setup__lead">This link is invalid, expired, or already used.</p>
            )}
            {status.valid ? (
              <div className="team-setup__registered">
                <span className="team-setup__avatar">
                  {status.avatarUrl ? (
                    <Image src={status.avatarUrl} alt="" width={32} height={32} unoptimized />
                  ) : null}
                </span>
                Registered as {status.playerName}
              </div>
            ) : null}
          </div>

          <div className="card">
            {status.valid ? (
              <TeamSetupForm
                token={token}
                playerName={status.playerName ?? ''}
                initialTeamName={status.teamName}
                initialCrestUrl={status.crestUrl}
                initialPrimaryColor={status.primaryColor}
                initialSecondaryColor={status.secondaryColor}
                locked={status.locked}
              />
            ) : (
              <div className="team-setup__invalid">
                <p>This link has expired or was already used.</p>
                <Link href="/" className="btn--text">
                  Back to home &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

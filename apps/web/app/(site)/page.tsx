import { Cta } from '@/components/cta';
import { RulesCallout } from '@/components/rules-callout';
import { Format } from '@/components/format';
import { GroupDrawSection } from '@/components/group-draw-section';
import { Hero } from '@/components/hero';
import { MatchdaySection } from '@/components/matchday-section';
import { PlayersCarousel } from '@/components/players-carousel';
import { QuoteDivider } from '@/components/quote-divider';
import { StandingsSection } from '@/components/standings-section';
import { fetchSeasonCompetition } from '@/lib/season-competition';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; md?: string }>;
}) {
  const sp = await searchParams;
  const phase = process.env.NODE_ENV !== 'production' ? sp.phase : undefined;
  const md = sp.md ? Number(sp.md) : undefined;

  const competition = await fetchSeasonCompetition();
  const status = phase ?? competition?.status ?? 'draft';
  const registrationOpen = status === 'registration';

  return (
    <>
      <Hero registrationOpen={registrationOpen} />
      <MatchdaySection phase={phase} md={Number.isFinite(md) ? md : undefined} />
      <Format />
      <GroupDrawSection />
      <QuoteDivider text="The table is the only opinion that matters." />
      <StandingsSection />
      <PlayersCarousel />
      {registrationOpen ? <Cta /> : null}
      <RulesCallout />
    </>
  );
}

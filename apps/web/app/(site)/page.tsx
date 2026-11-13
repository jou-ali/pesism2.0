import { Cta } from '@/components/cta';
import { RulesCallout } from '@/components/rules-callout';
import { Format } from '@/components/format';
import { Hero } from '@/components/hero';
import { MatchdaySection } from '@/components/matchday-section';
import { PlayersCarousel } from '@/components/players-carousel';
import { QuoteDivider } from '@/components/quote-divider';
import { StandingsSection } from '@/components/standings-section';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; md?: string }>;
}) {
  const sp = await searchParams;
  const phase = process.env.NODE_ENV !== 'production' ? sp.phase : undefined;
  const md = sp.md ? Number(sp.md) : undefined;

  return (
    <>
      <Hero />
      <MatchdaySection phase={phase} md={Number.isFinite(md) ? md : undefined} />
      <Format />
      <QuoteDivider text="The table is the only opinion that matters." />
      <StandingsSection />
      <PlayersCarousel />
      <Cta />
      <RulesCallout />
    </>
  );
}

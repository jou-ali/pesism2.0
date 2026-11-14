import { fetchSeasonCompetition } from '@/lib/season-competition';
import { SplitHeading } from './split-heading';

export async function Format() {
  const competition = await fetchSeasonCompetition();
  const qualifiers = competition?.knockoutQualifiers ?? 8;

  const STAGES = [
    {
      num: '1',
      title: 'League',
      body: 'Everyone plays everyone. Fixtures follow however many are in the squad — no fixed headcount yet.',
    },
    { num: '2', title: 'Quarter-finals', body: `Finish in the top ${qualifiers} or watch from the sidelines.` },
    { num: '3', title: 'Semi-finals', body: 'One match. Lose and you’re out.' },
    { num: '4', title: 'Final', body: 'Ninety minutes for the crown.' },
  ] as const;

  return (
    <section className="section format" id="format" aria-labelledby="format-title">
      <div className="container">
        <div className="section__head">
          <SplitHeading id="format-title" lines={['How you', 'lift it.']} />
        </div>

        <ol className="format-strip" data-stagger>
          {STAGES.map((stage) => (
            <li className="format-item card card--interactive" data-reveal key={stage.title}>
              <span className="format-item__num" aria-hidden="true">{stage.num}</span>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

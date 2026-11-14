import { fetchSeasonCompetition } from '@/lib/season-competition';
import { isCountedMatch } from '@/lib/matchday-status';
import {
  getMatchdayPreviewData,
  getMatchdayTableData,
  getQuarterFinalsData,
  getSemiFinalsData,
  getFinalPreviewData,
  getBracketData,
  getChampionData,
  getLeagueShieldData,
  getGoldenBootData,
  getGoldenGloveData,
  posterVersion,
} from './data';

export type PosterListing = {
  id: string;
  title: string;
  path: string;
  caption: string;
  available: boolean;
};

function withVersion(path: string, data: unknown): string {
  return `${path}?v=${posterVersion(data)}`;
}

/** Every poster type, its current route (if it has one yet), and whether it's ready to share. */
export async function listPosters(): Promise<PosterListing[]> {
  const comp = await fetchSeasonCompetition();
  const out: PosterListing[] = [];

  const previewMd = comp?.currentMatchday ?? 1;
  const mdPreview = await getMatchdayPreviewData(previewMd, false);
  out.push({
    id: 'matchday-preview',
    title: `Matchday ${previewMd} preview`,
    path: `/api/share/matchday/${previewMd}/preview`,
    caption: `Matchday ${String(previewMd).padStart(2, '0')} is live 🔥 Deadline: ${mdPreview?.deadline.replace('Deadline: ', '').split(' · ')[0] ?? 'the deadline'}. tournax.auradev.in`,
    available: mdPreview !== null,
  });
  if (mdPreview) out[out.length - 1].path = withVersion(out[out.length - 1].path, mdPreview);

  const lastPlayedMd = comp?.matches.filter(isCountedMatch).reduce((max, m) => Math.max(max, m.matchday), 0) ?? 0;
  const tableMd = lastPlayedMd || previewMd;
  const mdTable = await getMatchdayTableData(tableMd, false);
  out.push({
    id: 'matchday-table',
    title: `Table after matchday ${tableMd}`,
    path: `/api/share/matchday/${tableMd}/table`,
    caption: `Table after Matchday ${String(tableMd).padStart(2, '0')}. Numbers don't do banter. tournax.auradev.in/table`,
    available: mdTable !== null,
  });
  if (mdTable) out[out.length - 1].path = withVersion(out[out.length - 1].path, mdTable);

  const qf = await getQuarterFinalsData(false);
  out.push({
    id: 'qf-preview',
    title: 'Quarter-finals preview',
    path: '/api/share/knockout/quarter-finals',
    caption: `The quarter-finals are set. Win or go home. tournax.auradev.in`,
    available: qf !== null,
  });
  if (qf) out[out.length - 1].path = withVersion(out[out.length - 1].path, qf);

  const sf = await getSemiFinalsData(false);
  out.push({
    id: 'sf-preview',
    title: 'Semi-finals preview',
    path: '/api/share/knockout/semi-finals',
    caption: `Four left. Two make the final. tournax.auradev.in`,
    available: sf !== null,
  });
  if (sf) out[out.length - 1].path = withVersion(out[out.length - 1].path, sf);

  const final = await getFinalPreviewData(false);
  out.push({
    id: 'final-preview',
    title: 'Final preview',
    path: '/api/share/knockout/final',
    caption: `One match. One crown. tournax.auradev.in`,
    available: final !== null,
  });
  if (final) out[out.length - 1].path = withVersion(out[out.length - 1].path, final);

  const bracket = await getBracketData(false);
  out.push({
    id: 'bracket',
    title: 'Knockout bracket',
    path: '/api/share/knockout/bracket',
    caption: `The bracket so far. tournax.auradev.in`,
    available: bracket !== null,
  });
  if (bracket) out[out.length - 1].path = withVersion(out[out.length - 1].path, bracket);

  const champion = await getChampionData(false);
  out.push({
    id: 'award-champion',
    title: 'Champion',
    path: '/api/share/awards/champion',
    caption: `Talk is over. Bow down. tournax.auradev.in`,
    available: champion !== null,
  });
  if (champion) out[out.length - 1].path = withVersion(out[out.length - 1].path, champion);

  const shield = await getLeagueShieldData(false);
  out.push({
    id: 'award-league-shield',
    title: 'League Shield',
    path: '/api/share/awards/league-shield',
    caption: `Top of the table, wire to wire. tournax.auradev.in`,
    available: shield !== null,
  });
  if (shield) out[out.length - 1].path = withVersion(out[out.length - 1].path, shield);

  const boot = await getGoldenBootData(false);
  out.push({
    id: 'award-golden-boot',
    title: 'Golden Boot',
    path: '/api/share/awards/golden-boot',
    caption: `Most goals scored this season. tournax.auradev.in`,
    available: boot !== null,
  });
  if (boot) out[out.length - 1].path = withVersion(out[out.length - 1].path, boot);

  const glove = await getGoldenGloveData(false);
  out.push({
    id: 'award-golden-glove',
    title: 'Golden Glove',
    path: '/api/share/awards/golden-glove',
    caption: `Fewest goals conceded this season. tournax.auradev.in`,
    available: glove !== null,
  });
  if (glove) out[out.length - 1].path = withVersion(out[out.length - 1].path, glove);

  return out;
}

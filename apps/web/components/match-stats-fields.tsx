import type { MatchStatsInput } from '@/lib/tournax-api';
import { MATCH_STAT_ROWS } from '@/lib/match-stat-fields';
import { Input } from '@/components/ui/input';

export function MatchStatsFields({
  stats,
  onChange,
  homeLabel = 'Home',
  awayLabel = 'Away',
}: {
  stats: MatchStatsInput;
  onChange: (key: keyof MatchStatsInput, value: string) => void;
  homeLabel?: string;
  awayLabel?: string;
}) {
  return (
    <div className="admin-stats-grid">
      <div className="admin-stats-grid__head">
        <span>{homeLabel}</span>
        <span>Stat</span>
        <span>{awayLabel}</span>
      </div>
      {MATCH_STAT_ROWS.map((row) => (
        <div className="admin-stats-grid__row" key={row.label}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={row.label.includes('%') ? 100 : undefined}
            value={stats[row.key] ?? ''}
            onChange={(e) => onChange(row.key, e.target.value)}
            className="text-center tabular-nums"
          />
          <span>{row.label}</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={row.label.includes('%') ? 100 : undefined}
            value={stats[row.awayKey] ?? ''}
            onChange={(e) => onChange(row.awayKey, e.target.value)}
            className="text-center tabular-nums"
          />
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import type { LichessStats } from '@/lib/types';

interface LichessStatsPanelProps {
  stats: LichessStats | null;
  loading: boolean;
}

/** Displays Lichess master database statistics: win/draw/loss bar and top moves */
export const LichessStatsPanel = React.memo(function LichessStatsPanel({ stats, loading }: LichessStatsPanelProps) {
  if (loading) return <p className="text-slate-400 text-sm animate-pulse">Loading master data...</p>;
  if (!stats) return null;

  const total = stats.white + stats.draws + stats.black;
  if (total === 0) return <p className="text-slate-500 text-sm">No master games in this position</p>;

  const wp = Math.round((stats.white / total) * 100);
  const dp = Math.round((stats.draws / total) * 100);
  const bp = 100 - wp - dp;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-slate-400 text-xs mb-1">{total.toLocaleString()} master games</p>
        <div className="flex h-4 rounded overflow-hidden text-xs font-semibold">
          {wp > 0 && <div className="bg-white text-black flex items-center justify-center" style={{ width: `${wp}%` }}>{wp}%</div>}
          {dp > 0 && <div className="bg-gray-400 text-black flex items-center justify-center" style={{ width: `${dp}%` }}>{dp}%</div>}
          {bp > 0 && <div className="bg-gray-700 text-white flex items-center justify-center" style={{ width: `${bp}%` }}>{bp}%</div>}
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-white">White {wp}%</span>
          <span className="text-gray-400">Draw {dp}%</span>
          <span className="text-gray-300">Black {bp}%</span>
        </div>
      </div>

      {stats.topMoves.length > 0 && (
        <div>
          <p className="text-slate-400 text-xs mb-1">Top moves:</p>
          <div className="space-y-1">
            {stats.topMoves.map(m => (
              <div key={m.san} className="flex justify-between text-sm">
                <span className="text-white font-semibold">{m.san}</span>
                <span className="text-slate-400">{m.total.toLocaleString()} games</span>
                <span className="text-green-400">{m.winRate}% win</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

import React from 'react';

interface MoveHistoryProps {
  history: string[];
}

/** Displays move history in numbered pairs (e.g. "1. d4 d5") */
export const MoveHistory = React.memo(function MoveHistory({ history }: MoveHistoryProps) {
  if (history.length === 0) {
    return <p className="text-slate-500 italic text-sm">No moves yet</p>;
  }

  const pairs: Array<{ num: number; white: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="font-mono text-sm space-y-0.5 max-h-64 overflow-y-auto">
      {pairs.map(p => (
        <div key={p.num} className="flex gap-2">
          <span className="text-slate-500 w-8 text-right">{p.num}.</span>
          <span className="text-white w-16">{p.white}</span>
          <span className="text-slate-300 w-16">{p.black || ''}</span>
        </div>
      ))}
    </div>
  );
});

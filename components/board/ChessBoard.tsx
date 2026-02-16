import React, { useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { SQUARE_SIZE, FILES, RANKS, PIECE_UNICODE } from '@/lib/constants';
import type { LastMove, ArrowHint } from '@/lib/types';

interface ChessBoardProps {
  game: Chess;
  boardKey: number;
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: LastMove | null;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
  showArrow?: ArrowHint | null;
  arrows?: ArrowHint[];
}

/** Get background color for a square based on selection/last-move state */
function getSquareColor(
  square: Square,
  rowIdx: number,
  colIdx: number,
  selectedSquare: Square | null,
  lastMove: LastMove | null
): string {
  const isLight = (rowIdx + colIdx) % 2 === 0;
  const base = isLight ? '#eeeed2' : '#769656';

  if (lastMove && (square === lastMove.from || square === lastMove.to)) {
    return isLight ? '#f6f669' : '#baca2b';
  }
  if (square === selectedSquare) {
    return isLight ? '#f6f669' : '#baca2b';
  }
  return base;
}

/** Convert a square to pixel coordinates for SVG arrow overlay */
function squareToCoords(sq: Square, flipped: boolean): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1]);
  const col = flipped ? 7 - file : file;
  const row = flipped ? 7 - rank : rank;
  return { x: col * SQUARE_SIZE + SQUARE_SIZE / 2, y: row * SQUARE_SIZE + SQUARE_SIZE / 2 };
}

/** SVG arrow overlay for move hints */
function MoveArrow({ from, to, flipped, color = 'rgba(0, 180, 0, 0.7)', id = 'default' }: { from: Square; to: Square; flipped: boolean; color?: string; id?: string }) {
  const f = squareToCoords(from, flipped);
  const t = squareToCoords(to, flipped);
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const headLen = 14;
  const tx = t.x - ux * headLen;
  const ty = t.y - uy * headLen;
  const markerId = `arrowhead-${id}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={SQUARE_SIZE * 8}
      height={SQUARE_SIZE * 8}
      style={{ zIndex: 10 }}
    >
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
          <polygon points="0 0, 10 4, 0 8" fill={color} />
        </marker>
      </defs>
      <line
        x1={f.x} y1={f.y} x2={tx} y2={ty}
        stroke={color} strokeWidth="8" strokeLinecap="round"
        markerEnd={`url(#${markerId})`} opacity="0.8"
      />
    </svg>
  );
}

/**
 * Interactive chess board with piece display, legal move indicators,
 * last-move highlighting, rank/file labels, and optional arrow overlay.
 */
export const ChessBoard = React.memo(function ChessBoard({
  game,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  flipped = false,
  showArrow = null,
  arrows = [],
}: ChessBoardProps) {
  const board = game.board();
  const displayRanks = flipped ? [...RANKS].reverse() : [...RANKS];
  const displayFiles = flipped ? [...FILES].reverse() : [...FILES];
  const boardRows = flipped ? [...board].reverse().map(row => [...row].reverse()) : board;

  const handleClick = useCallback((square: Square) => {
    onSquareClick(square);
  }, [onSquareClick]);

  return (
    <div className="relative inline-block select-none">
      {/* File labels - top */}
      <div className="flex ml-8" style={{ width: SQUARE_SIZE * 8 }}>
        {displayFiles.map(f => (
          <div key={`ft-${f}`} className="text-center text-slate-400 text-xs font-semibold" style={{ width: SQUARE_SIZE }}>{f}</div>
        ))}
      </div>

      <div className="flex">
        {/* Rank labels - left */}
        <div className="flex flex-col justify-around w-8">
          {displayRanks.map(r => (
            <div key={`rl-${r}`} className="text-center text-slate-400 text-xs font-semibold" style={{ height: SQUARE_SIZE }}>{r}</div>
          ))}
        </div>

        {/* Board squares */}
        <div className="relative rounded shadow-2xl overflow-hidden" style={{ border: '3px solid #302e2b', width: SQUARE_SIZE * 8, height: SQUARE_SIZE * 8 }}>
          {boardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((_, colIndex) => {
                const square = (displayFiles[colIndex] + displayRanks[rowIndex]) as Square;
                const piece = game.get(square);
                const bgColor = getSquareColor(square, rowIndex, colIndex, selectedSquare, lastMove);
                const isLegal = legalMoves.includes(square);
                const hasPiece = !!piece;

                return (
                  <div
                    key={square}
                    className="flex items-center justify-center cursor-pointer relative"
                    style={{ width: SQUARE_SIZE, height: SQUARE_SIZE, backgroundColor: bgColor }}
                    onClick={() => handleClick(square)}
                  >
                    {isLegal && !hasPiece && (
                      <div className="absolute rounded-full bg-black opacity-20" style={{ width: SQUARE_SIZE * 0.3, height: SQUARE_SIZE * 0.3 }} />
                    )}
                    {isLegal && hasPiece && (
                      <div className="absolute rounded-full border-4 border-black opacity-20" style={{ width: SQUARE_SIZE * 0.85, height: SQUARE_SIZE * 0.85 }} />
                    )}
                    {piece && (
                      <span
                        className="leading-none select-none"
                        style={{
                          fontSize: SQUARE_SIZE * 0.75,
                          color: piece.color === 'w' ? '#fff' : '#000',
                          textShadow: piece.color === 'w'
                            ? '0 1px 3px rgba(0,0,0,0.5)'
                            : '0 1px 3px rgba(255,255,255,0.3)',
                          zIndex: 5,
                        }}
                      >
                        {PIECE_UNICODE[piece.color][piece.type]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {showArrow && <MoveArrow from={showArrow.from} to={showArrow.to} flipped={flipped} id="hint" />}
          {arrows.map((arrow, i) => (
            <MoveArrow key={i} from={arrow.from} to={arrow.to} flipped={flipped} color={arrow.color} id={`arr-${i}`} />
          ))}
        </div>

        {/* Rank labels - right */}
        <div className="flex flex-col justify-around w-8">
          {displayRanks.map(r => (
            <div key={`rr-${r}`} className="text-center text-slate-400 text-xs font-semibold" style={{ height: SQUARE_SIZE }}>{r}</div>
          ))}
        </div>
      </div>

      {/* File labels - bottom */}
      <div className="flex ml-8" style={{ width: SQUARE_SIZE * 8 }}>
        {displayFiles.map(f => (
          <div key={`fb-${f}`} className="text-center text-slate-400 text-xs font-semibold" style={{ width: SQUARE_SIZE }}>{f}</div>
        ))}
      </div>
    </div>
  );
});

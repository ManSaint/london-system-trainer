/** Square size in pixels for the chess board */
export const SQUARE_SIZE = 72;

/** File labels a-h */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/** Rank labels 8-1 (top to bottom) */
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

/** Unicode chess piece symbols by color and type */
export const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { p: '\u2659', n: '\u2658', b: '\u2657', r: '\u2656', q: '\u2655', k: '\u2654' },
  b: { p: '\u265F', n: '\u265E', b: '\u265D', r: '\u265C', q: '\u265B', k: '\u265A' },
};

/** localStorage key for user progress */
export const STORAGE_KEY = 'london-trainer-progress';

/** Available replay speed options */
export const REPLAY_SPEEDS = [0.5, 1, 2] as const;

/** Base interval in ms for replay at 1x speed */
export const REPLAY_INTERVAL_MS = 1000;

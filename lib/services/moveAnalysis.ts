import { Chess } from 'chess.js';
import { analyzePosition } from '@/lib/api/stockfish';
import type { MoveQuality, MoveClassification } from '@/lib/types';

/** Thresholds for move quality classification (in centipawns) */
const EVAL_THRESHOLDS = {
  good: 25,
  inaccuracy: 50,
  mistake: 100,
  blunder: 200,
};

/** Classify a move based on evaluation drop */
function classifyMove(evalDrop: number): MoveClassification {
  if (evalDrop <= EVAL_THRESHOLDS.good) return 'excellent';
  if (evalDrop <= EVAL_THRESHOLDS.inaccuracy) return 'good';
  if (evalDrop <= EVAL_THRESHOLDS.mistake) return 'inaccuracy';
  if (evalDrop <= EVAL_THRESHOLDS.blunder) return 'mistake';
  return 'blunder';
}

/**
 * Analyze the quality of the last move played.
 * Uses a cloned game to avoid mutating the live game state.
 *
 * @param fen - FEN string BEFORE the move was played
 * @param moveSan - The SAN move that was played
 * @param moveNumber - Move number for display
 * @returns MoveQuality analysis or null if analysis fails
 */
export async function analyzeMoveQuality(
  fen: string,
  moveSan: string,
  moveNumber: number
): Promise<MoveQuality | null> {
  try {
    // Analyze position before the move
    const analysisBefore = await analyzePosition(fen, 12);
    // Chess-API returns eval in pawns (0.25 = 25cp); convert to centipawns
    const evalBefore = analysisBefore.evaluation * 100;
    const bestMoveUci = analysisBefore.bestMove;

    // Play the move on a temporary game to get the FEN after
    const tempGame = new Chess(fen);
    tempGame.move(moveSan);
    const fenAfter = tempGame.fen();

    // Convert best move from UCI to SAN for display, and store squares
    let bestMove = bestMoveUci;
    const bestMoveFrom = bestMoveUci.slice(0, 2);
    const bestMoveTo = bestMoveUci.slice(2, 4);
    try {
      const sanGame = new Chess(fen);
      const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
      const m = sanGame.move({ from: bestMoveFrom, to: bestMoveTo, promotion });
      if (m) bestMove = m.san;
    } catch { /* keep UCI if conversion fails */ }

    // Get from/to squares for the played move
    const moveGame = new Chess(fen);
    const playedMove = moveGame.move(moveSan);
    const moveFrom = playedMove?.from;
    const moveTo = playedMove?.to;

    // Analyze position after the move
    const analysisAfter = await analyzePosition(fenAfter, 12);
    // Convert to centipawns (API always returns from White's perspective)
    const evalAfter = analysisAfter.evaluation * 100;

    // Eval drop from the moving side's perspective
    const evalDrop = evalBefore - evalAfter;
    const classification = classifyMove(Math.max(0, evalDrop));

    return {
      moveNumber,
      move: moveSan,
      evalBefore,
      evalAfter,
      evalDrop: Math.max(0, evalDrop),
      classification,
      bestMove,
      moveFrom,
      moveTo,
      bestMoveFrom,
      bestMoveTo,
    };
  } catch (error) {
    console.warn('Move analysis failed:', error);
    return null;
  }
}

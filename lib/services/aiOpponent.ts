import { Chess, Move } from 'chess.js';
import { fetchLichessExplorer } from '@/lib/api/lichess';
import { analyzePosition } from '@/lib/api/stockfish';
import type { Difficulty } from '@/lib/types';

/**
 * Convert a Chess game's move history to UCI format for Lichess API.
 */
function historyToUci(game: Chess): string[] {
  const moves = game.history({ verbose: true });
  return moves.map((m: Move) => m.from + m.to + (m.promotion || ''));
}

/**
 * Get a computer move based on difficulty setting.
 *
 * - Beginner: Random legal move
 * - Intermediate: Lichess opening book + heuristic scoring (default)
 * - Advanced: Stockfish engine with fallback to intermediate
 */
export async function getComputerMove(
  game: Chess,
  difficulty: Difficulty = 'intermediate'
): Promise<string | null> {
  if (game.isGameOver()) return null;

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // BEGINNER: Random legal move
  if (difficulty === 'beginner') {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove.san;
  }

  // INTERMEDIATE: Lichess book + heuristic (existing logic)
  if (difficulty === 'intermediate') {
    // Try Lichess opening book first
    try {
      const uciMoves = historyToUci(game);
      const data = await fetchLichessExplorer(uciMoves, 0);

      if (data.moves && data.moves.length > 0) {
        const top = data.moves.slice(0, 3);
        const totalGames = top.reduce((s, m) => s + m.white + m.draws + m.black, 0);
        let rand = Math.random() * totalGames;
        let chosen = top[0];
        for (const m of top) {
          rand -= (m.white + m.draws + m.black);
          if (rand <= 0) { chosen = m; break; }
        }
        return chosen.san;
      }
    } catch {
      // Lichess unavailable, fall through to heuristic
    }

    // Heuristic: score moves by captures, checks, center control
    const scored = moves.map((m: Move) => {
      let score = Math.random() * 10;
      if (m.captured) score += 30;
      if (m.san.includes('+')) score += 20;
      if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) score += 15;
      if (['c3', 'c4', 'c5', 'c6', 'f3', 'f4', 'f5', 'f6'].includes(m.to)) score += 5;
      return { move: m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move.san;
  }

  // ADVANCED: Stockfish evaluation with fallback
  if (difficulty === 'advanced') {
    try {
      const analysis = await analyzePosition(game.fen(), 15);

      if (analysis.bestMove) {
        const from = analysis.bestMove.slice(0, 2);
        const to = analysis.bestMove.slice(2, 4);
        const promotion = analysis.bestMove.length > 4 ? analysis.bestMove[4] : undefined;

        try {
          const move = game.move({ from, to, promotion });
          if (move) {
            const san = move.san;
            game.undo();
            return san;
          }
        } catch {
          // Invalid move from Stockfish, fall through
        }
      }
    } catch (error) {
      console.warn('Stockfish failed, falling back to intermediate:', error);
    }

    // Fallback to intermediate if Stockfish fails
    return getComputerMove(game, 'intermediate');
  }

  return null;
}

import { useState, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import type { LastMove } from '@/lib/types';

/**
 * Core chess game state hook. Wraps chess.js with React state management.
 * Uses a boardKey counter to force re-renders after chess.js mutations.
 */
export function useChessGame() {
  const [game] = useState(() => new Chess());
  const [boardKey, setBoardKey] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);

  /** Increment boardKey to force React to re-render after a chess.js mutation */
  const forceUpdate = useCallback(() => setBoardKey(k => k + 1), []);

  /** Attempt a move. Returns the Move object on success, null on failure. */
  const makeMove = useCallback((from: Square, to: Square): Move | null => {
    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (move) {
        setLastMove({ from: move.from, to: move.to });
        setSelectedSquare(null);
        setLegalMoves([]);
        forceUpdate();
        return move;
      }
    } catch {
      /* invalid move */
    }
    return null;
  }, [game, forceUpdate]);

  /** Make a move by SAN notation (e.g. "d4", "Nf3"). Returns the Move or null. */
  const makeMoveSan = useCallback((san: string): Move | null => {
    try {
      const move = game.move(san);
      if (move) {
        setLastMove({ from: move.from, to: move.to });
        forceUpdate();
        return move;
      }
    } catch {
      /* invalid move */
    }
    return null;
  }, [game, forceUpdate]);

  /** Undo the last move */
  const undoMove = useCallback(() => {
    game.undo();
    forceUpdate();
  }, [game, forceUpdate]);

  /** Reset the game to initial position */
  const resetGame = useCallback(() => {
    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    forceUpdate();
  }, [game, forceUpdate]);

  /** Select a square (shows legal moves if it contains a piece of the active color) */
  const selectSquare = useCallback((square: Square) => {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m: Move) => m.to));
    }
  }, [game]);

  /** Clear selection */
  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  /** Convert move history to UCI format (for Lichess API) */
  const historyToUci = useCallback((): string[] => {
    const moves = game.history({ verbose: true });
    return moves.map((m: Move) => m.from + m.to + (m.promotion || ''));
  }, [game]);

  return {
    game,
    boardKey,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves,
    lastMove,
    setLastMove,
    makeMove,
    makeMoveSan,
    undoMove,
    resetGame,
    selectSquare,
    clearSelection,
    forceUpdate,
    historyToUci,
  };
}

export type ChessGameState = ReturnType<typeof useChessGame>;

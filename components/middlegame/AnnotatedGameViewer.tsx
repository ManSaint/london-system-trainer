import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/board/ChessBoard';
import { MoveHistory } from '@/components/board/MoveHistory';
import type { AnnotatedGame, MoveAnnotation } from '@/lib/types';

interface AnnotatedGameViewerProps {
  annotatedGame: AnnotatedGame;
  onComplete: () => void;
  onBack: () => void;
}

/** Viewer for annotated master games with move-by-move explanations */
export function AnnotatedGameViewer({ annotatedGame, onComplete, onBack }: AnnotatedGameViewerProps) {
  // Parse all moves from PGN once
  const allMoves = useMemo(() => {
    const temp = new Chess(annotatedGame.startPosition);
    temp.loadPgn(annotatedGame.pgn);
    return temp.history();
  }, [annotatedGame.pgn, annotatedGame.startPosition]);

  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 = starting position
  const [boardKey, setBoardKey] = useState(0);

  // Build current game state by replaying up to currentMoveIndex
  const game = useMemo(() => {
    const g = new Chess(annotatedGame.startPosition);
    for (let i = 0; i <= currentMoveIndex && i < allMoves.length; i++) {
      g.move(allMoves[i]);
    }
    return g;
  }, [annotatedGame.startPosition, allMoves, currentMoveIndex]);

  // Find annotation for current move (move numbers in annotations are 1-based full moves)
  const currentAnnotation: MoveAnnotation | undefined = useMemo(() => {
    if (currentMoveIndex < 0) return undefined;
    const moveNumber = Math.floor(currentMoveIndex / 2) + 1;
    const moveSan = allMoves[currentMoveIndex];
    return annotatedGame.annotations.find(
      ann => ann.moveNumber === moveNumber && ann.move === moveSan
    );
  }, [currentMoveIndex, allMoves, annotatedGame.annotations]);

  const nextMove = useCallback(() => {
    if (currentMoveIndex < allMoves.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
      setBoardKey(k => k + 1);
    }
  }, [currentMoveIndex, allMoves.length]);

  const prevMove = useCallback(() => {
    if (currentMoveIndex >= 0) {
      setCurrentMoveIndex(prev => prev - 1);
      setBoardKey(k => k + 1);
    }
  }, [currentMoveIndex]);

  const isAtEnd = currentMoveIndex >= allMoves.length - 1;
  const displayMoveNumber = currentMoveIndex >= 0 ? Math.floor(currentMoveIndex / 2) + 1 : 0;
  const totalFullMoves = Math.ceil(allMoves.length / 2);

  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
      {/* Board */}
      <div className="flex flex-col items-center">
        <div className="mb-4 text-center">
          <h3 className="text-white text-xl font-bold">{annotatedGame.title}</h3>
          <p className="text-slate-400 text-sm">{annotatedGame.players} &mdash; {annotatedGame.result}</p>
        </div>

        <ChessBoard
          game={game}
          boardKey={boardKey}
          selectedSquare={null}
          legalMoves={[]}
          lastMove={null}
          onSquareClick={() => {}}
          flipped={false}
        />

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300"
          >
            {'\u2190'} Back
          </button>
          <button
            onClick={prevMove}
            disabled={currentMoveIndex < 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300"
          >
            &larr; Prev
          </button>
          <button
            onClick={isAtEnd ? onComplete : nextMove}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
          >
            {isAtEnd ? 'Start Training \u2192' : 'Next \u2192'}
          </button>
        </div>
      </div>

      {/* Annotation Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Current Move Annotation */}
        {currentAnnotation ? (
          <div className="bg-amber-900/15 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl text-amber-400">{'\u265B'}</span>
              <h4 className="text-amber-400 font-bold uppercase text-sm">
                {currentAnnotation.concept}
              </h4>
            </div>
            <p className="text-white text-sm leading-relaxed">
              {currentAnnotation.explanation}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm text-center">
              {currentMoveIndex < 0
                ? 'Click Next to start playing through the game'
                : 'Play through the moves to see annotations'}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Progress</span>
            <span>Move {displayMoveNumber} of {totalFullMoves}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${allMoves.length > 0 ? ((currentMoveIndex + 1) / allMoves.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Move History */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Moves</h4>
          <MoveHistory history={allMoves.slice(0, currentMoveIndex + 1)} />
        </div>

        {/* Key Takeaways */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">Key Takeaways</h4>
          <ul className="space-y-2">
            {annotatedGame.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-400 mt-0.5">{'\u2713'}</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

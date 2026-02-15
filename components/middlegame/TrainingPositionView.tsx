import React, { useState, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessBoard } from '@/components/board/ChessBoard';
import type { TrainingPosition } from '@/lib/types';

interface TrainingPositionViewProps {
  position: TrainingPosition;
  onComplete: (correct: boolean) => void;
}

/** Interactive training position with multiple-choice or find-move modes */
export function TrainingPositionView({ position, onComplete }: TrainingPositionViewProps) {
  const game = useMemo(() => new Chess(position.fen), [position.fen]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userMove, setUserMove] = useState<string | null>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [hintIndex, setHintIndex] = useState(-1);

  // Handle multiple choice selection
  const handleOptionSelect = useCallback((index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);

    const correct = position.options?.[index]?.isCorrect ?? false;
    setIsCorrect(correct);
    setTimeout(() => onComplete(correct), 3000);
  }, [showFeedback, position.options, onComplete]);

  // Handle board clicks for find-move type
  const handleSquareClick = useCallback((square: Square) => {
    if (position.type === 'multiple-choice' || showFeedback) return;

    const piece = game.get(square);

    if (selectedSquare) {
      try {
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move) {
          setUserMove(move.san);
          setBoardKey(k => k + 1);
          setSelectedSquare(null);
          setLegalMoves([]);

          const correct = position.correctMoves?.includes(move.san) ?? false;
          setIsCorrect(correct);
          setShowFeedback(true);
          setTimeout(() => onComplete(correct), 3000);
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      } catch {
        // Invalid move - deselect
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to as Square));
    }
  }, [selectedSquare, game, position, showFeedback, onComplete]);

  const showNextHint = useCallback(() => {
    setHintIndex(prev => Math.min(prev + 1, (position.hints?.length ?? 0) - 1));
  }, [position.hints]);

  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
      {/* Board */}
      <div className="flex flex-col items-center">
        <ChessBoard
          game={game}
          boardKey={boardKey}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={null}
          onSquareClick={handleSquareClick}
          flipped={position.toMove === 'b'}
        />
      </div>

      {/* Question & Options */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Question */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl text-amber-400">{'\u265B'}</span>
            <h4 className="text-slate-100 font-semibold">{position.question}</h4>
          </div>

          {/* Multiple Choice Options */}
          {position.type === 'multiple-choice' && position.options && (
            <div className="space-y-2">
              {position.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const showResult = showFeedback;

                let buttonStyle = 'bg-slate-700 hover:bg-slate-600';
                if (showResult) {
                  if (option.isCorrect) {
                    buttonStyle = 'bg-green-900/40 border-2 border-green-500/60';
                  } else if (isSelected && !option.isCorrect) {
                    buttonStyle = 'bg-red-900/40 border-2 border-red-500/60';
                  } else {
                    buttonStyle = 'bg-slate-700/50 opacity-60';
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showFeedback}
                    className={`w-full text-left p-3 rounded-lg transition-all ${buttonStyle}`}
                  >
                    <p className="text-white text-sm font-semibold">{option.label}</p>
                    {showResult && (isSelected || option.isCorrect) && (
                      <p className="text-slate-300 text-xs mt-2">{option.explanation}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Find Move / Play Sequence Instructions */}
          {(position.type === 'find-move' || position.type === 'play-sequence') && !showFeedback && (
            <p className="text-slate-400 text-sm">
              Click on the board to play the best move
            </p>
          )}

          {/* User's Move Feedback */}
          {showFeedback && position.type !== 'multiple-choice' && (
            <div className={`mt-3 p-3 rounded-lg ${
              isCorrect
                ? 'bg-green-900/40 border border-green-500/60'
                : 'bg-red-900/40 border border-red-500/60'
            }`}>
              <p className="text-white text-sm font-semibold mb-1">
                {isCorrect ? '\u2713 Correct!' : '\u2717 Not quite'}
                {userMove && <span className="text-slate-300 font-normal"> &mdash; You played {userMove}</span>}
              </p>
              {!isCorrect && position.correctMoves && (
                <p className="text-slate-300 text-xs mb-2">
                  Best move: {position.correctMoves.join(' or ')}
                </p>
              )}
              <p className="text-slate-300 text-xs">{position.explanation}</p>
            </div>
          )}
        </div>

        {/* Hints */}
        {!showFeedback && position.hints && position.hints.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4">
            {hintIndex < 0 ? (
              <button
                onClick={showNextHint}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
              >
                Need a hint?
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-blue-400 text-xs font-semibold uppercase">Hints</p>
                {position.hints.slice(0, hintIndex + 1).map((hint, i) => (
                  <p key={i} className="text-slate-300 text-sm">{'\u2022'} {hint}</p>
                ))}
                {hintIndex < position.hints.length - 1 && (
                  <button
                    onClick={showNextHint}
                    className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                  >
                    Show another hint
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Position Info */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">To Move:</span>
            <span className="text-white font-semibold">
              {position.toMove === 'w' ? 'White' : 'Black'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

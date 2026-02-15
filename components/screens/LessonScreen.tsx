import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { ChessBoard } from '@/components/board/ChessBoard';
import { MoveHistory } from '@/components/board/MoveHistory';
import { lessons } from '@/lib/lessons';
import { getLessonWithStats } from '@/lib/services/lessonService';
import type { ChessGameState } from '@/hooks/useChessGame';
import type { ArrowHint, Lesson } from '@/lib/types';

interface LessonScreenProps {
  lessonId: string;
  chessGame: ChessGameState;
  onComplete: (lessonId: string) => void;
  onBack: () => void;
}

/** Interactive lesson screen — guides user through opening moves step by step */
export function LessonScreen({ lessonId, chessGame, onComplete, onBack }: LessonScreenProps) {
  const { game, boardKey, selectedSquare, legalMoves, lastMove, forceUpdate,
    setSelectedSquare, setLegalMoves, setLastMove } = chessGame;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [showArrow, setShowArrow] = useState<ArrowHint | null>(null);
  const [flipped, setFlipped] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  /** Show arrow hint for a SAN move by looking up its from/to in legal moves */
  const showMoveHint = useCallback((san: string) => {
    const moves = game.moves({ verbose: true });
    const target = moves.find((m: Move) => m.san === san);
    if (target) setShowArrow({ from: target.from, to: target.to });
  }, [game]);

  // Show arrow for the first move once lesson is loaded
  useEffect(() => {
    if (!lesson) return;
    const firstStep = lesson.steps[0];
    if (firstStep.side === 'w') {
      const timer = setTimeout(() => showMoveHint(firstStep.move), 300);
      return () => clearTimeout(timer);
    }
  }, [lesson, showMoveHint]);

  // Cleanup autoplay timeout on unmount
  useEffect(() => {
    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current); };
  }, []);

  // Fetch enriched lesson with master stats on mount
  useEffect(() => {
    let mounted = true;

    async function loadLesson() {
      setLoadingLesson(true);
      setLessonError(null);
      try {
        const enriched = await getLessonWithStats(lessonId);
        if (mounted) {
          setLesson(enriched);
          setLoadingLesson(false);
        }
      } catch (error) {
        console.error('Failed to load lesson:', error);
        if (mounted) {
          setLessonError('Failed to load master data. Using basic lesson.');
          setLesson(lessons[lessonId]);
          setLoadingLesson(false);
        }
      }
    }

    loadLesson();
    return () => { mounted = false; };
  }, [lessonId]);

  /** Mark lesson complete and notify parent */
  const markComplete = useCallback((atStep: number) => {
    setComplete(true);
    setStep(atStep);
    onComplete(lessonId);
  }, [lessonId, onComplete]);

  /** Advance to the next step. Auto-plays Black moves after a delay. */
  const advanceStep = useCallback(() => {
    if (!lesson) return;
    const nextStep = step + 1;

    if (nextStep >= lesson.steps.length) {
      markComplete(nextStep);
      return;
    }

    setStep(nextStep);
    const nextStepData = lesson.steps[nextStep];

    if (nextStepData.side === 'b') {
      // Auto-play Black's response
      setAutoPlaying(true);
      autoPlayRef.current = setTimeout(() => {
        try {
          const move = game.move(nextStepData.move);
          if (move) {
            setLastMove({ from: move.from, to: move.to });
            forceUpdate();
          }
        } catch (e) {
          console.error('Lesson auto-play error:', e);
        }
        setAutoPlaying(false);

        const afterNext = nextStep + 1;
        if (afterNext >= lesson.steps.length) {
          markComplete(afterNext);
        } else {
          setStep(afterNext);
          const upcoming = lesson.steps[afterNext];
          if (upcoming.side === 'w') showMoveHint(upcoming.move);
        }
      }, 800);
    } else {
      showMoveHint(nextStepData.move);
    }
  }, [step, lesson, game, forceUpdate, setLastMove, showMoveHint, markComplete]);

  /** Handle a square click during the lesson (guided moves only) */
  const handleSquareClick = useCallback((square: Square) => {
    if (autoPlaying || complete || !lesson) return;

    const currentStep = lesson.steps[step];
    if (!currentStep || currentStep.side !== 'w') return;

    const piece = game.get(square);

    if (selectedSquare) {
      try {
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move && move.san === currentStep.move) {
          // Correct move
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setLegalMoves([]);
          setShowArrow(null);
          setMessage('');
          forceUpdate();
          advanceStep();
        } else if (move) {
          // Wrong move — undo
          game.undo();
          forceUpdate();
          setMessage(`Not quite! The correct move is ${currentStep.move}. Try again.`);
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      } catch {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    // Select piece
    if (piece && piece.color === 'w') {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m: Move) => m.to));
    }
  }, [autoPlaying, complete, step, lesson, game, selectedSquare,
    setSelectedSquare, setLegalMoves, setLastMove, forceUpdate, advanceStep]);

  if (loadingLesson || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
        <p className="text-white text-lg">Loading lesson from master database...</p>
        <p className="text-slate-400 text-sm mt-2">Fetching real master game data</p>
        <button onClick={onBack} className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
          {'\u2190'} Back to Menu
        </button>
      </div>
    );
  }

  const currentStepData = step < lesson.steps.length ? lesson.steps[step] : null;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {lessonError && (
        <div className="max-w-3xl mx-auto mb-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">{lessonError}</p>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
      {/* Board */}
      <div className="flex flex-col items-center">
        <ChessBoard
          game={game}
          boardKey={boardKey}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
          flipped={flipped}
          showArrow={showArrow}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
            {'\u2190'} Menu
          </button>
          <button onClick={() => setFlipped(f => !f)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
            Flip
          </button>
        </div>
      </div>

      {/* Lesson Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Lesson Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-amber-400">{'\u265B'}</span>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{lesson.name}</h3>
              <p className="text-slate-400 text-xs">{lesson.description}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span>Step {Math.min(step + 1, lesson.steps.length)} of {lesson.steps.length}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min((step / lesson.steps.length) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Current Step / Completion */}
        <div className="bg-slate-800 rounded-xl p-4">
          {complete ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3 text-amber-400">{'\u2654'}</div>
              <h4 className="text-xl font-bold text-amber-400 mb-2">Lesson Complete!</h4>
              <p className="text-slate-300 text-sm mb-4">
                You&apos;ve learned the London System vs {lesson.name.replace('vs ', '')}!
              </p>
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-slate-400">Key Ideas to Remember:</h5>
                {lesson.keyIdeas.map((idea, i) => (
                  <p key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span> {idea}
                  </p>
                ))}
              </div>
              <button onClick={onBack} className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
                {'\u2190'} Back to Menu
              </button>
            </div>
          ) : currentStepData && (
            <div>
              {currentStepData.highlight && (
                <span className="inline-block px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded text-xs font-semibold mb-2">
                  {currentStepData.highlight}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-3 h-3 rounded-full ${currentStepData.side === 'w' ? 'bg-white' : 'bg-gray-800 border border-gray-500'}`} />
                <span className="text-white font-bold text-lg">{currentStepData.move}</span>
                <span className="text-slate-500 text-sm">
                  {currentStepData.side === 'w' ? '(Your move)' : '(Black responds)'}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{currentStepData.explanation}</p>

              {/* Master Stats Display */}
              {currentStepData.masterStats && (
                <div className="mt-3 p-2 bg-slate-700/50 rounded border border-slate-600">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-slate-400 text-xs font-semibold">MASTER GAMES</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Games played:</span>
                      <span className="text-white font-semibold">{currentStepData.masterStats.totalGames.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">White wins:</span>
                      <span className="text-green-400 font-semibold">{currentStepData.masterStats.winRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Draws:</span>
                      <span className="text-slate-300 font-semibold">{currentStepData.masterStats.totalGames > 0 ? Math.round((currentStepData.masterStats.draws / currentStepData.masterStats.totalGames) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Popularity:</span>
                      <span className="text-blue-400 font-semibold">{currentStepData.masterStats.popularity}% of games</span>
                    </div>
                    {/* Win rate bar */}
                    <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden flex mt-1">
                      <div className="bg-green-500 h-full" style={{ width: `${currentStepData.masterStats.winRate}%` }} />
                      <div className="bg-slate-400 h-full" style={{ width: `${currentStepData.masterStats.totalGames > 0 ? Math.round((currentStepData.masterStats.draws / currentStepData.masterStats.totalGames) * 100) : 0}%` }} />
                      <div className="bg-red-500 h-full flex-1" />
                    </div>
                  </div>
                </div>
              )}
              {!currentStepData.masterStats && !loadingLesson && (
                <p className="text-slate-500 text-xs mt-2 italic">Master statistics not available for this position</p>
              )}

              {message && <p className="text-yellow-400 text-sm mt-2 font-semibold">{message}</p>}
              {currentStepData.side === 'w' && !autoPlaying && (
                <p className="text-amber-400/70 text-xs mt-3">Click the piece and make the move shown by the arrow!</p>
              )}
              {autoPlaying && (
                <p className="text-slate-500 text-xs mt-3 animate-pulse">Black is playing...</p>
              )}
            </div>
          )}
        </div>

        {/* Move History */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Moves</h4>
          <MoveHistory history={game.history()} />
        </div>
      </div>
      </div>
    </div>
  );
}

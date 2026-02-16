import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { ChessBoard } from '@/components/board/ChessBoard';
import { MoveHistory } from '@/components/board/MoveHistory';
import { LichessStatsPanel } from '@/components/board/LichessStatsPanel';
import { fetchLichessExplorer } from '@/lib/api/lichess';
import { analyzePosition, getEvaluationLabel } from '@/lib/api/stockfish';
import { getComputerMove } from '@/lib/services/aiOpponent';
import { analyzeMoveQuality } from '@/lib/services/moveAnalysis';
import { saveGame } from '@/lib/services/gameStorage';
import { REPLAY_SPEEDS, REPLAY_INTERVAL_MS } from '@/lib/constants';
import type { ChessGameState } from '@/hooks/useChessGame';
import type { Difficulty, MoveQuality, PracticeResult, LichessStats, PositionEval, UserProgress, RecordedGame, ReplayState, ReplaySpeed, ArrowHint } from '@/lib/types';

interface PracticeScreenProps {
  chessGame: ChessGameState;
  onUpdateProgress: (fn: (p: UserProgress) => UserProgress) => void;
  onBack: () => void;
}

/** Practice mode — play as White against a Lichess-powered AI opponent */
export function PracticeScreen({ chessGame, onUpdateProgress, onBack }: PracticeScreenProps) {
  const { game, boardKey, selectedSquare, legalMoves, lastMove,
    setSelectedSquare, setLegalMoves, setLastMove, forceUpdate, historyToUci } = chessGame;

  const [flipped, setFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [result, setResult] = useState<PracticeResult>({ type: 'playing' });
  const [thinking, setThinking] = useState(false);
  const [lichessStats, setLichessStats] = useState<LichessStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [evaluation, setEvaluation] = useState<PositionEval | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [moveQualities, setMoveQualities] = useState<MoveQuality[]>([]);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);
  const [analyzingMove, setAnalyzingMove] = useState(false);
  const [reviewMoveIndex, setReviewMoveIndex] = useState<number | null>(null);
  const [replayState, setReplayState] = useState<ReplayState>({
    isReplaying: false,
    currentMoveIndex: 0,
    isPlaying: false,
    speed: 1,
    game: null,
  });

  /** Save the completed game to localStorage */
  const saveCompletedGame = useCallback((gameResult: PracticeResult) => {
    if (gameResult.type === 'playing') return;
    try {
      const recordedGame: RecordedGame = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        difficulty,
        result: gameResult,
        pgn: game.pgn(),
        moveHistory: game.history(),
        moveQualities,
        whitePlayer: 'You',
        blackPlayer: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI`,
      };
      saveGame(recordedGame);
    } catch (error) {
      console.warn('Failed to save game:', error);
    }
  }, [difficulty, game, moveQualities]);

  /** Check if the game is over and record the result */
  const checkGameOver = useCallback(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'b' : 'w';
      const gameResult: PracticeResult = { type: 'checkmate', winner };
      setResult(gameResult);
      onUpdateProgress(p => ({
        ...p,
        practiceGames: {
          ...p.practiceGames,
          wins: p.practiceGames.wins + (winner === 'w' ? 1 : 0),
          losses: p.practiceGames.losses + (winner === 'b' ? 1 : 0),
        }
      }));
      setTimeout(() => saveCompletedGame(gameResult), 100);
    } else if (game.isStalemate()) {
      const gameResult: PracticeResult = { type: 'stalemate' };
      setResult(gameResult);
      onUpdateProgress(p => ({ ...p, practiceGames: { ...p.practiceGames, draws: p.practiceGames.draws + 1 } }));
      setTimeout(() => saveCompletedGame(gameResult), 100);
    } else if (game.isDraw()) {
      const gameResult: PracticeResult = { type: 'draw' };
      setResult(gameResult);
      onUpdateProgress(p => ({ ...p, practiceGames: { ...p.practiceGames, draws: p.practiceGames.draws + 1 } }));
      setTimeout(() => saveCompletedGame(gameResult), 100);
    }
  }, [game, onUpdateProgress, saveCompletedGame]);

  /** Trigger the AI to make a move */
  const makeAIMove = useCallback(async () => {
    if (game.isGameOver()) return;
    setThinking(true);
    try {
      const san = await getComputerMove(game, difficulty);
      if (san) {
        const move = game.move(san);
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          forceUpdate();
          checkGameOver();
        }
      }
    } catch {
      /* AI move failed */
    }
    setThinking(false);
  }, [game, difficulty, forceUpdate, setLastMove, checkGameOver]);

  /** Analyze the player's move quality (async, non-blocking) */
  const analyzePlayerMove = useCallback(async (fenBefore: string, moveSan: string) => {
    setAnalyzingMove(true);
    const moveNum = Math.ceil(game.history().length / 2);
    try {
      const quality = await analyzeMoveQuality(fenBefore, moveSan, moveNum);
      if (quality) {
        setMoveQualities(prev => [...prev, quality]);
        setLastMoveQuality(quality);
      }
    } catch {
      /* analysis failed silently */
    }
    setAnalyzingMove(false);
  }, [game]);

  /** Play/pause replay */
  const toggleReplayPlayback = useCallback(() => {
    setReplayState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  /** Go to next move in replay */
  const nextReplayMove = useCallback(() => {
    setReplayState(prev => {
      if (!prev.game || prev.currentMoveIndex >= prev.game.moveHistory.length) {
        return prev;
      }
      return { ...prev, currentMoveIndex: prev.currentMoveIndex + 1 };
    });
  }, []);

  /** Go to previous move in replay */
  const prevReplayMove = useCallback(() => {
    setReplayState(prev => {
      if (prev.currentMoveIndex === 0) return prev;
      return { ...prev, currentMoveIndex: prev.currentMoveIndex - 1 };
    });
  }, []);

  /** Exit replay mode and start a new game */
  const exitReplay = useCallback(() => {
    setReplayState({
      isReplaying: false,
      currentMoveIndex: 0,
      isPlaying: false,
      speed: 1,
      game: null,
    });
    game.reset();
    setResult({ type: 'playing' });
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setEvaluation(null);
    setLichessStats(null);
    setThinking(false);
    setMoveQualities([]);
    setLastMoveQuality(null);
    setAnalyzingMove(false);
    setReviewMoveIndex(null);
    forceUpdate();
  }, [game, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate]);

  /** Change replay speed */
  const setReplaySpeedFn = useCallback((speed: ReplaySpeed) => {
    setReplayState(prev => ({ ...prev, speed }));
  }, []);

  /** Enter replay mode with the current game */
  const startReplay = useCallback(() => {
    const currentGame: RecordedGame = {
      id: `replay_${Date.now()}`,
      timestamp: Date.now(),
      difficulty,
      result,
      pgn: game.pgn(),
      moveHistory: game.history(),
      moveQualities,
      whitePlayer: 'You',
      blackPlayer: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI`,
    };
    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    forceUpdate();
    setReplayState({
      isReplaying: true,
      currentMoveIndex: 0,
      isPlaying: false,
      speed: 1,
      game: currentGame,
    });
  }, [difficulty, result, game, moveQualities, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate]);

  // Auto-play replay
  useEffect(() => {
    if (!replayState.isReplaying || !replayState.isPlaying || !replayState.game) return;
    if (replayState.currentMoveIndex >= replayState.game.moveHistory.length) {
      setReplayState(prev => ({ ...prev, isPlaying: false }));
      return;
    }
    const interval = REPLAY_INTERVAL_MS / replayState.speed;
    const timer = setTimeout(() => nextReplayMove(), interval);
    return () => clearTimeout(timer);
  }, [replayState, nextReplayMove]);

  /** Handle a square click in practice mode */
  const handleSquareClick = useCallback((square: Square) => {
    if (replayState.isReplaying) return;
    // If reviewing past moves during game, clicking the board returns to live position
    if (reviewMoveIndex !== null && result.type === 'playing') {
      setReviewMoveIndex(null);
      return;
    }
    if (game.turn() !== 'w') return;
    if (result.type !== 'playing') return;

    const piece = game.get(square);

    if (selectedSquare) {
      // Re-select own piece
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m: Move) => m.to));
        return;
      }
      // Try move
      try {
        const fenBefore = game.fen();
        setLastMoveQuality(null);
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setLegalMoves([]);
          forceUpdate();
          checkGameOver();

          // Only analyze if game continues — checkmate/stalemate moves are always correct!
          // Skip opening moves (first 10 White moves) — this is a London System trainer,
          // we don't want Stockfish criticizing d4, Bf4, e3 etc. as "mistakes"
          const whiteMovesPlayed = Math.ceil(game.history().length / 2);
          if (!game.isGameOver()) {
            if (whiteMovesPlayed > 10) {
              analyzePlayerMove(fenBefore, move.san);
            }
            setTimeout(() => makeAIMove(), 600);
          } else {
            setLastMoveQuality(null);
          }
        }
      } catch {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m: Move) => m.to));
    }
  }, [replayState.isReplaying, reviewMoveIndex, selectedSquare, result.type, game, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate, checkGameOver, makeAIMove, analyzePlayerMove]);

  /** Fetch Lichess opening stats for current position */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const uciMoves = historyToUci();
      const data = await fetchLichessExplorer(uciMoves, 0);
      const total = data.white + data.draws + data.black;
      const topMoves = data.moves.slice(0, 5).map(m => {
        const mTotal = m.white + m.draws + m.black;
        return { san: m.san, total: mTotal, winRate: mTotal > 0 ? Math.round((m.white / mTotal) * 100) : 0 };
      });
      setLichessStats({ white: data.white, draws: data.draws, black: data.black, topMoves });
    } catch {
      setLichessStats(null);
    }
    setLoadingStats(false);
  }, [historyToUci]);

  // Fetch stats when position changes (first 20 moves)
  useEffect(() => {
    if (game.history().length <= 20) fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  /** Fetch Stockfish evaluation */
  const fetchEvaluation = useCallback(async () => {
    setLoadingEval(true);
    try {
      const res = await analyzePosition(game.fen(), 15);
      setEvaluation({ score: res.evaluation, label: getEvaluationLabel(res.evaluation) });
    } catch {
      setEvaluation(null);
    }
    setLoadingEval(false);
  }, [game]);

  /** London System adherence check (5 criteria) */
  const londonChecks = useCallback(() => {
    const history = game.history();
    if (history.length < 2) return null;
    const whiteMoves = history.filter((_, i) => i % 2 === 0);
    return [
      { name: 'Played d4 first', pass: history.length > 0 && history[0] === 'd4' },
      { name: 'Developed Bf4 early (before move 5)', pass: whiteMoves.slice(0, 4).some(m => m === 'Bf4') },
      { name: 'Played e3 (solid structure)', pass: whiteMoves.some(m => m === 'e3') },
      { name: 'Castled kingside', pass: whiteMoves.some(m => m === 'O-O') },
      { name: 'Played Nbd2 (flexible knight)', pass: whiteMoves.some(m => m === 'Nbd2') },
    ];
  }, [game]);

  /** Exit review mode */
  const exitReviewMode = useCallback(() => {
    setReviewMoveIndex(null);
  }, []);

  /** Go to previous move in review */
  const goToPreviousMove = useCallback(() => {
    setReviewMoveIndex(prev => {
      if (prev === null) return game.history().length - 2;
      return Math.max(-1, prev - 1);
    });
  }, [game]);

  /** Go to next move in review */
  const goToNextMove = useCallback(() => {
    setReviewMoveIndex(prev => {
      if (prev === null) return 0;
      const maxIdx = game.history().length - 1;
      if (prev >= maxIdx) {
        // Already at the end — exit review mode (return to live position)
        return null;
      }
      return prev + 1;
    });
  }, [game]);

  /** Build board state for review mode */
  const reviewGame = useMemo(() => {
    if (reviewMoveIndex === null) return null;
    const reviewG = new Chess();
    const moves = game.history();
    for (let i = 0; i <= reviewMoveIndex && i < moves.length; i++) {
      reviewG.move(moves[i]);
    }
    return reviewG;
  }, [game, reviewMoveIndex]);

  /** Start a new game */
  const newGame = useCallback(() => {
    game.reset();
    setResult({ type: 'playing' });
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setEvaluation(null);
    setLichessStats(null);
    setThinking(false);
    setMoveQualities([]);
    setLastMoveQuality(null);
    setAnalyzingMove(false);
    setReviewMoveIndex(null);
    forceUpdate();
  }, [game, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate]);

  /** Calculate material balance and captured pieces */
  const material = useMemo(() => {
    const board = game.board();
    const pieces = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    board.forEach(row => {
      row.forEach(sq => {
        if (sq && sq.type !== 'k') {
          pieces[sq.color][sq.type as 'p' | 'n' | 'b' | 'r' | 'q']++;
        }
      });
    });
    const starting = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const captured = {
      w: { p: starting.p - pieces.b.p, n: starting.n - pieces.b.n, b: starting.b - pieces.b.b, r: starting.r - pieces.b.r, q: starting.q - pieces.b.q },
      b: { p: starting.p - pieces.w.p, n: starting.n - pieces.w.n, b: starting.b - pieces.w.b, r: starting.r - pieces.w.r, q: starting.q - pieces.w.q },
    };
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const whitePoints = pieces.w.p * values.p + pieces.w.n * values.n + pieces.w.b * values.b + pieces.w.r * values.r + pieces.w.q * values.q;
    const blackPoints = pieces.b.p * values.p + pieces.b.n * values.n + pieces.b.b * values.b + pieces.b.r * values.r + pieces.b.q * values.q;
    return { captured, advantage: whitePoints - blackPoints };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  /** Generate beginner-friendly explanation for a move quality */
  const getMoveExplanation = useCallback((quality: MoveQuality): string => {
    const drop = (quality.evalDrop / 100).toFixed(1);
    if (quality.classification === 'excellent') return 'Great move! This was one of the best options.';
    if (quality.classification === 'good') return 'Solid move. You maintained a good position.';
    if (quality.classification === 'inaccuracy') {
      if (quality.bestMove) return `This gave away ${drop} pawns of advantage. ${quality.bestMove} would have kept the pressure on.`;
      return `A small slip - you lost about ${drop} pawns of advantage.`;
    }
    if (quality.classification === 'mistake') {
      if (quality.bestMove) return `This cost you ${drop} pawns! ${quality.bestMove} was much stronger and would have kept your advantage.`;
      return `This hurt your position significantly, costing ${drop} pawns of advantage.`;
    }
    // blunder
    if (quality.bestMove) return `A serious error costing ${drop} pawns! Your opponent gained a big advantage. ${quality.bestMove} was the right move here.`;
    return `A major mistake that cost ${drop} pawns. Your opponent is now much better.`;
  }, []);

  /** Convert centipawn eval to a beginner-friendly position label */
  const getPositionStatus = useCallback((evalCp: number): { label: string; textClass: string } => {
    const pawns = evalCp / 100;
    if (pawns > 3) return { label: 'Winning', textClass: 'text-emerald-400' };
    if (pawns > 1) return { label: 'Better', textClass: 'text-green-400' };
    if (pawns > -1) return { label: 'Equal', textClass: 'text-slate-300' };
    if (pawns > -3) return { label: 'Worse', textClass: 'text-orange-400' };
    return { label: 'Losing', textClass: 'text-red-400' };
  }, []);

  /** Generate contextual friendly explanation using position status */
  const getContextualExplanation = useCallback((quality: MoveQuality): string => {
    const afterStatus = getPositionStatus(quality.evalAfter);
    const drop = Math.abs(quality.evalDrop / 100);

    if (quality.classification === 'excellent') return 'Great move! You found the best continuation.';
    if (quality.classification === 'good') return 'Solid move keeping your advantage.';
    if (quality.classification === 'inaccuracy') {
      return afterStatus.label === 'Winning' || afterStatus.label === 'Better'
        ? `Still ${afterStatus.label.toLowerCase()}, but a better move was available.`
        : `Small inaccuracy — lost ${drop.toFixed(1)} pawns of advantage.`;
    }
    if (quality.classification === 'mistake') {
      return afterStatus.label === 'Winning' || afterStatus.label === 'Better'
        ? `You're still ${afterStatus.label.toLowerCase()}, but this gave back some advantage.`
        : `This mistake cost you ${drop.toFixed(1)} pawns worth of advantage.`;
    }
    // blunder
    return `Major error! This changed the evaluation by ${drop.toFixed(1)} pawns.`;
  }, [getPositionStatus]);

  /** Compute arrows for the current replay position */
  const replayArrows = useMemo((): ArrowHint[] => {
    if (!replayState.isReplaying || !replayState.game || replayState.currentMoveIndex === 0) return [];
    const moveIndex = replayState.currentMoveIndex - 1;
    if (moveIndex % 2 !== 0) return []; // Only for White's moves
    const moveNum = Math.ceil((moveIndex + 1) / 2);
    const quality = replayState.game.moveQualities.find(q => q.moveNumber === moveNum);
    if (!quality) return [];
    if (quality.classification === 'excellent' || quality.classification === 'good') return [];

    const arrows: ArrowHint[] = [];
    // Red arrow: the move that was played
    if (quality.moveFrom && quality.moveTo) {
      arrows.push({ from: quality.moveFrom as Square, to: quality.moveTo as Square, color: 'rgba(220, 50, 50, 0.7)' });
    }
    // Green arrow: the better move
    if (quality.bestMoveFrom && quality.bestMoveTo && quality.bestMove) {
      arrows.push({ from: quality.bestMoveFrom as Square, to: quality.bestMoveTo as Square, color: 'rgba(50, 200, 80, 0.7)' });
    }
    return arrows;
  }, [replayState]);

  /** Compute arrows for review mode (post-game navigation) */
  const reviewArrows = useMemo((): ArrowHint[] => {
    if (reviewMoveIndex === null || reviewMoveIndex < 0) return [];
    if (reviewMoveIndex % 2 !== 0) return []; // Only for White's moves
    const moveNum = Math.floor(reviewMoveIndex / 2) + 1;
    const quality = moveQualities.find(q => q.moveNumber === moveNum);
    if (!quality) return [];
    if (quality.classification === 'excellent' || quality.classification === 'good') return [];

    const arrows: ArrowHint[] = [];
    if (quality.moveFrom && quality.moveTo) {
      arrows.push({ from: quality.moveFrom as Square, to: quality.moveTo as Square, color: 'rgba(220, 50, 50, 0.7)' });
    }
    if (quality.bestMoveFrom && quality.bestMoveTo && quality.bestMove) {
      arrows.push({ from: quality.bestMoveFrom as Square, to: quality.bestMoveTo as Square, color: 'rgba(50, 200, 80, 0.7)' });
    }
    return arrows;
  }, [reviewMoveIndex, moveQualities]);

  /** Build board state for replay mode (fresh Chess instance at current index) */
  const replayGame = useMemo(() => {
    if (!replayState.isReplaying || !replayState.game) return null;
    const g = new Chess();
    const moves = replayState.game.moveHistory;
    for (let i = 0; i < replayState.currentMoveIndex && i < moves.length; i++) {
      try { g.move(moves[i]); } catch { break; }
    }
    return g;
  }, [replayState.isReplaying, replayState.game, replayState.currentMoveIndex]);

  /** Compute last-move highlight for replay mode */
  const replayLastMove = useMemo(() => {
    if (!replayState.isReplaying || !replayState.game || replayState.currentMoveIndex === 0) return null;
    const g = new Chess();
    const moves = replayState.game.moveHistory;
    let last: { from: Square; to: Square } | null = null;
    for (let i = 0; i < replayState.currentMoveIndex && i < moves.length; i++) {
      try {
        const m = g.move(moves[i]);
        if (m) last = { from: m.from, to: m.to };
      } catch { break; }
    }
    return last;
  }, [replayState.isReplaying, replayState.game, replayState.currentMoveIndex]);

  const checks = londonChecks();
  const passed = checks ? checks.filter(c => c.pass).length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6 items-start justify-center">
      {/* Board */}
      <div className="flex flex-col items-center">
        {/* Replay Controls Bar */}
        {replayState.isReplaying && replayState.game && (
          <div className="w-full mb-4">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Replay Mode</h3>
                <button
                  onClick={exitReplay}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition-all"
                >
                  Exit Replay
                </button>
              </div>

              {/* Progress bar with phase indicator */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>
                    Move {replayState.currentMoveIndex} of {replayState.game.moveHistory.length}
                    {replayState.currentMoveIndex > 0 && (() => {
                      const mi = replayState.currentMoveIndex - 1;
                      const mn = Math.ceil((mi + 1) / 2);
                      return mn <= 10
                        ? <span className="text-blue-400 ml-2">{'\u00B7'} Opening</span>
                        : <span className="text-amber-400 ml-2">{'\u00B7'} Middlegame</span>;
                    })()}
                  </span>
                  <span>{replayState.game.moveHistory.length > 0 ? Math.round((replayState.currentMoveIndex / replayState.game.moveHistory.length) * 100) : 0}%</span>
                </div>
                <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${replayState.game.moveHistory.length > 0 ? (replayState.currentMoveIndex / replayState.game.moveHistory.length) * 100 : 0}%` }}
                  />
                  {/* Opening/Middlegame divider — move 20 (10 White + 10 Black = index 20) */}
                  {replayState.game.moveHistory.length > 20 && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-400/70"
                      style={{ left: `${(20 / replayState.game.moveHistory.length) * 100}%` }}
                      title="Analysis begins (move 11)"
                    />
                  )}
                </div>
                {/* Phase legend */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400/50" />
                    <span>Opening (1-10)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                    <span>Analyzed (11+)</span>
                  </div>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevReplayMove}
                  disabled={replayState.currentMoveIndex === 0}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={toggleReplayPlayback}
                  disabled={replayState.currentMoveIndex >= replayState.game.moveHistory.length}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-slate-900 rounded-lg text-sm font-semibold transition-all duration-300"
                >
                  {replayState.isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={nextReplayMove}
                  disabled={replayState.currentMoveIndex >= replayState.game.moveHistory.length}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-sm font-semibold transition-all"
                >
                  Next
                </button>

                {/* Speed selector */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Speed:</span>
                  {REPLAY_SPEEDS.map(speed => (
                    <button
                      key={speed}
                      onClick={() => setReplaySpeedFn(speed as ReplaySpeed)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        replayState.speed === speed
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <ChessBoard
          game={replayGame ?? reviewGame ?? game}
          boardKey={replayState.isReplaying ? replayState.currentMoveIndex : reviewMoveIndex !== null ? reviewMoveIndex : boardKey}
          selectedSquare={replayState.isReplaying || reviewMoveIndex !== null ? null : selectedSquare}
          legalMoves={replayState.isReplaying || reviewMoveIndex !== null ? [] : legalMoves}
          lastMove={replayState.isReplaying ? replayLastMove : lastMove}
          onSquareClick={handleSquareClick}
          flipped={flipped}
          arrows={replayState.isReplaying ? replayArrows : reviewArrows}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onBack} disabled={replayState.isReplaying} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
            {'\u2190'} Menu
          </button>
          <button onClick={() => setFlipped(f => !f)} disabled={replayState.isReplaying} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300">
            Flip
          </button>
          <button onClick={newGame} disabled={replayState.isReplaying} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-900 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30">
            New Game
          </button>
          <div className="relative group">
            <button
              onClick={fetchEvaluation}
              disabled={loadingEval || analyzingMove || replayState.isReplaying}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300"
            >
              {loadingEval ? '...' : analyzingMove ? 'Analyzing...' : 'Check Position'}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-700 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Ask Stockfish to evaluate this position
            </div>
          </div>
        </div>

        {/* In-game move navigation */}
        {result.type === 'playing' && !replayState.isReplaying && game.history().length > 0 && (
          <div className="w-full mt-2">
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl px-3 py-2">
              <button
                onClick={goToPreviousMove}
                disabled={reviewMoveIndex === -1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
              >
                {'\u2190'}
              </button>
              <span className="flex-1 text-center text-slate-400 text-xs">
                {reviewMoveIndex === null
                  ? 'Live position'
                  : reviewMoveIndex === -1
                  ? 'Starting position'
                  : `Move ${Math.floor(reviewMoveIndex / 2) + 1} ${reviewMoveIndex % 2 === 0 ? '(White)' : '(Black)'}`
                }
              </span>
              <button
                onClick={reviewMoveIndex !== null ? goToNextMove : undefined}
                disabled={reviewMoveIndex === null}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
              >
                {'\u2192'}
              </button>
              {reviewMoveIndex !== null && (
                <button
                  onClick={() => setReviewMoveIndex(null)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-semibold transition-all"
                >
                  Back to game
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Practice Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Difficulty Selector (only during gameplay) */}
        {result.type === 'playing' && <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">AI Difficulty</h4>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'beginner' as Difficulty, label: 'Beginner', desc: 'Random moves' },
              { key: 'intermediate' as Difficulty, label: 'Intermediate', desc: 'Book + tactics' },
              { key: 'advanced' as Difficulty, label: 'Advanced', desc: 'Stockfish' },
            ]).map(d => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                disabled={thinking}
                className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                  difficulty === d.key
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                <div className="font-bold">{d.label}</div>
                <div className="text-xs opacity-75 mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>}

        {/* Material Count */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-400">Material</h4>
            {material.advantage !== 0 && (
              <span className={`text-sm font-bold ${
                material.advantage > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {material.advantage > 0 ? '+' : ''}{material.advantage}
              </span>
            )}
          </div>
          {/* Captured by White (You) */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-500 w-16">You:</span>
            <div className="flex gap-1 text-sm">
              {material.captured.w.q > 0 && <span>{'\u265B'}{'\u00D7'}{material.captured.w.q}</span>}
              {material.captured.w.r > 0 && <span>{'\u265C'}{'\u00D7'}{material.captured.w.r}</span>}
              {material.captured.w.b > 0 && <span>{'\u265D'}{'\u00D7'}{material.captured.w.b}</span>}
              {material.captured.w.n > 0 && <span>{'\u265E'}{'\u00D7'}{material.captured.w.n}</span>}
              {material.captured.w.p > 0 && <span>{'\u265F'}{'\u00D7'}{material.captured.w.p}</span>}
              {material.captured.w.q === 0 && material.captured.w.r === 0 &&
               material.captured.w.b === 0 && material.captured.w.n === 0 &&
               material.captured.w.p === 0 && <span className="text-slate-600">{'\u2014'}</span>}
            </div>
          </div>
          {/* Captured by Black (AI) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-16">AI:</span>
            <div className="flex gap-1 text-sm">
              {material.captured.b.q > 0 && <span>{'\u2655'}{'\u00D7'}{material.captured.b.q}</span>}
              {material.captured.b.r > 0 && <span>{'\u2656'}{'\u00D7'}{material.captured.b.r}</span>}
              {material.captured.b.b > 0 && <span>{'\u2657'}{'\u00D7'}{material.captured.b.b}</span>}
              {material.captured.b.n > 0 && <span>{'\u2658'}{'\u00D7'}{material.captured.b.n}</span>}
              {material.captured.b.p > 0 && <span>{'\u2659'}{'\u00D7'}{material.captured.b.p}</span>}
              {material.captured.b.q === 0 && material.captured.b.r === 0 &&
               material.captured.b.b === 0 && material.captured.b.n === 0 &&
               material.captured.b.p === 0 && <span className="text-slate-600">{'\u2014'}</span>}
            </div>
          </div>
        </div>

        {/* Move Quality Feedback */}
        {lastMoveQuality && lastMoveQuality.classification !== 'excellent' && (
          <div className={`rounded-xl p-4 border ${
            lastMoveQuality.classification === 'good' ? 'bg-blue-900/20 border-blue-500/30' :
            lastMoveQuality.classification === 'inaccuracy' ? 'bg-amber-900/20 border-amber-500/30' :
            lastMoveQuality.classification === 'mistake' ? 'bg-orange-900/20 border-orange-500/30' :
            'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex-1">
              <h4 className={`font-bold text-sm uppercase ${
                lastMoveQuality.classification === 'good' ? 'text-blue-400' :
                lastMoveQuality.classification === 'inaccuracy' ? 'text-amber-400' :
                lastMoveQuality.classification === 'mistake' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {lastMoveQuality.classification}
              </h4>
              <p className="text-slate-300 text-xs mt-1">
                Move: <span className="font-semibold">{lastMoveQuality.move}</span>
              </p>

              {/* Beginner-friendly position status */}
              {(() => {
                const before = getPositionStatus(lastMoveQuality.evalBefore);
                const after = getPositionStatus(lastMoveQuality.evalAfter);
                return (
                  <div className="mt-2 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`${before.textClass} font-semibold`}>{before.label}</span>
                      <span className="text-slate-500">{'\u2192'}</span>
                      <span className={`${after.textClass} font-semibold`}>{after.label}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">
                      {getContextualExplanation(lastMoveQuality)}
                    </p>
                  </div>
                );
              })()}

              {lastMoveQuality.bestMove && lastMoveQuality.classification !== 'good' && (
                <p className="text-slate-400 text-xs">
                  Better: <span className="text-emerald-400 font-semibold">{lastMoveQuality.bestMove}</span>
                </p>
              )}

              {/* Technical details collapsed */}
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical details
                </summary>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <div>Before: {lastMoveQuality.evalBefore > 0 ? '+' : ''}{(lastMoveQuality.evalBefore / 100).toFixed(2)}</div>
                  <div>After: {lastMoveQuality.evalAfter > 0 ? '+' : ''}{(lastMoveQuality.evalAfter / 100).toFixed(2)}</div>
                  <div>Change: {lastMoveQuality.evalDrop > 0 ? '-' : '+'}{Math.abs(lastMoveQuality.evalDrop / 100).toFixed(2)}</div>
                </div>
              </details>
            </div>
          </div>
        )}

        {analyzingMove && (
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-slate-400 text-sm animate-pulse">Analyzing move...</p>
          </div>
        )}

        {/* Game Status */}
        <div className="bg-slate-800 rounded-xl p-4">
          {result.type === 'playing' ? (
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-gray-800 border border-gray-500'}`} />
              <span className="text-white font-semibold">
                {thinking
                  ? `Computer is thinking... (${difficulty})`
                  : game.turn() === 'w'
                    ? 'Your turn (White)'
                    : `Computer thinking... (${difficulty})`
                }
              </span>
              {game.inCheck() && <span className="text-red-400 text-sm font-semibold">Check!</span>}
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="text-5xl mb-3">
                {result.type === 'checkmate' && result.winner === 'w' ? '\u2654' : ''}
                {result.type === 'checkmate' && result.winner === 'b' ? '\u265A' : ''}
                {result.type !== 'checkmate' ? '\u00BD' : ''}
              </div>
              <h4 className={`text-xl font-bold ${
                result.type === 'checkmate' && result.winner === 'w' ? 'text-emerald-400' :
                result.type === 'checkmate' && result.winner === 'b' ? 'text-red-400' :
                'text-slate-300'
              }`}>
                {result.type === 'checkmate' && result.winner === 'w' && 'You win!'}
                {result.type === 'checkmate' && result.winner === 'b' && 'Computer wins'}
                {result.type === 'stalemate' && 'Stalemate'}
                {result.type === 'draw' && 'Draw'}
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                {result.type === 'checkmate' ? 'Checkmate' : result.type === 'stalemate' ? 'No legal moves' : 'Game drawn'} {'\u2014'} vs {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI
              </p>
              <button
                onClick={newGame}
                className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Post-Game Actions — review navigation + replay (immediately after result) */}
        {result.type !== 'playing' && !replayState.isReplaying && (
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            {/* Move Navigation */}
            {game.history().length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">
                    {reviewMoveIndex === null
                      ? 'Final position'
                      : reviewMoveIndex === -1
                      ? 'Starting position'
                      : `Move ${Math.floor(reviewMoveIndex / 2) + 1} ${reviewMoveIndex % 2 === 0 ? '(White)' : '(Black)'}`
                    }
                  </span>
                  {reviewMoveIndex !== null && (
                    <button
                      onClick={exitReviewMode}
                      className="text-amber-400 hover:text-amber-300 text-xs font-semibold"
                    >
                      Back to end
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousMove}
                    disabled={reviewMoveIndex === -1}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    {'\u2190'} Prev
                  </button>
                  <button
                    onClick={goToNextMove}
                    disabled={reviewMoveIndex !== null && reviewMoveIndex >= game.history().length - 1}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Next {'\u2192'}
                  </button>
                </div>
              </div>
            )}

            {/* Replay Button */}
            <button
              onClick={startReplay}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl font-semibold border border-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Replay This Game
            </button>
          </div>
        )}

        {/* Post-game review annotation (when browsing past moves after game ended) */}
        {result.type !== 'playing' && !replayState.isReplaying && reviewMoveIndex !== null && reviewMoveIndex >= 0 && reviewMoveIndex % 2 === 0 && (() => {
          const moveNum = Math.floor(reviewMoveIndex / 2) + 1;
          const isOpeningMove = moveNum <= 10;
          const quality = moveQualities.find(q => q.moveNumber === moveNum);

          if (isOpeningMove) {
            return (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{'\uD83D\uDCD6'}</span>
                  <h5 className="text-blue-400 font-semibold text-sm">Opening Phase</h5>
                  <span className="text-slate-500 text-xs ml-auto">Move {moveNum}</span>
                </div>
                <p className="text-slate-300 text-sm">
                  This move is part of the London System opening setup and is not analyzed.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Analysis begins from move 11.
                </p>
              </div>
            );
          }

          if (!quality) return null;

          const classLabel = quality.classification === 'excellent' ? 'Great move' :
            quality.classification === 'good' ? 'Good move' :
            quality.classification === 'inaccuracy' ? 'Minor mistake' :
            quality.classification === 'mistake' ? 'Clear mistake' : 'Major mistake';

          return (
            <div className={`rounded-xl p-4 border ${
              quality.classification === 'excellent' ? 'bg-green-900/20 border-green-600/30' :
              quality.classification === 'good' ? 'bg-blue-900/20 border-blue-600/30' :
              quality.classification === 'inaccuracy' ? 'bg-yellow-900/20 border-yellow-600/30' :
              quality.classification === 'mistake' ? 'bg-orange-900/20 border-orange-600/30' :
              'bg-red-900/20 border-red-600/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${
                  quality.classification === 'excellent' ? 'text-green-400' :
                  quality.classification === 'good' ? 'text-blue-400' :
                  quality.classification === 'inaccuracy' ? 'text-yellow-400' :
                  quality.classification === 'mistake' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {classLabel}
                </p>
                <span className="text-slate-500 text-xs">Move {quality.moveNumber}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 w-20">You played:</span>
                <span className="text-sm font-semibold text-slate-200 bg-slate-700/50 px-2 py-0.5 rounded">
                  {quality.move}
                </span>
              </div>

              {quality.bestMove && quality.classification !== 'excellent' && quality.classification !== 'good' && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 w-20">Better was:</span>
                  <span className="text-sm font-semibold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
                    {quality.bestMove}
                  </span>
                </div>
              )}

              {/* Beginner-friendly position context */}
              {(() => {
                const before = getPositionStatus(quality.evalBefore);
                const after = getPositionStatus(quality.evalAfter);
                return (
                  <div className="mb-3 pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`${before.textClass} font-semibold`}>{before.label}</span>
                      <span className="text-slate-500">{'\u2192'}</span>
                      <span className={`${after.textClass} font-semibold`}>{after.label}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">
                      {getContextualExplanation(quality)}
                    </p>
                  </div>
                );
              })()}

              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical details
                </summary>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <div>Before: {quality.evalBefore > 0 ? '+' : ''}{(quality.evalBefore / 100).toFixed(2)}</div>
                  <div>After: {quality.evalAfter > 0 ? '+' : ''}{(quality.evalAfter / 100).toFixed(2)}</div>
                  <div>Change: {quality.evalDrop > 0 ? '-' : '+'}{Math.abs(quality.evalDrop / 100).toFixed(2)}</div>
                </div>
              </details>
            </div>
          );
        })()}

        {/* In-game review annotation (when browsing past moves during active play) */}
        {result.type === 'playing' && reviewMoveIndex !== null && reviewMoveIndex >= 0 && reviewMoveIndex % 2 === 0 && (() => {
          const moveNum = Math.floor(reviewMoveIndex / 2) + 1;
          const isOpeningMove = moveNum <= 10;
          const quality = moveQualities.find(q => q.moveNumber === moveNum);

          // Opening phase message
          if (isOpeningMove) {
            return (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{'\uD83D\uDCD6'}</span>
                  <h5 className="text-blue-400 font-semibold text-sm">Opening Phase</h5>
                  <span className="text-slate-500 text-xs ml-auto">Move {moveNum}</span>
                </div>
                <p className="text-slate-300 text-sm">
                  This move is part of the London System opening setup and is not analyzed.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Analysis begins from move 11.
                </p>
              </div>
            );
          }

          if (!quality) return null;

          const classLabel = quality.classification === 'excellent' ? 'Great move' :
            quality.classification === 'good' ? 'Good move' :
            quality.classification === 'inaccuracy' ? 'Minor mistake' :
            quality.classification === 'mistake' ? 'Clear mistake' : 'Major mistake';

          return (
            <div className={`rounded-xl p-4 border ${
              quality.classification === 'excellent' ? 'bg-green-900/20 border-green-600/30' :
              quality.classification === 'good' ? 'bg-blue-900/20 border-blue-600/30' :
              quality.classification === 'inaccuracy' ? 'bg-yellow-900/20 border-yellow-600/30' :
              quality.classification === 'mistake' ? 'bg-orange-900/20 border-orange-600/30' :
              'bg-red-900/20 border-red-600/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${
                  quality.classification === 'excellent' ? 'text-green-400' :
                  quality.classification === 'good' ? 'text-blue-400' :
                  quality.classification === 'inaccuracy' ? 'text-yellow-400' :
                  quality.classification === 'mistake' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {classLabel}
                </p>
                <span className="text-slate-500 text-xs">Move {quality.moveNumber}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 w-20">You played:</span>
                <span className="text-sm font-semibold text-slate-200 bg-slate-700/50 px-2 py-0.5 rounded">
                  {quality.move}
                </span>
                {(quality.classification !== 'excellent' && quality.classification !== 'good') && (
                  <span className="text-red-400 text-xs">{'\u2190'} red arrow</span>
                )}
              </div>

              {quality.bestMove && quality.classification !== 'excellent' && quality.classification !== 'good' && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 w-20">Better was:</span>
                  <span className="text-sm font-semibold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
                    {quality.bestMove}
                  </span>
                  <span className="text-emerald-400 text-xs">{'\u2190'} green arrow</span>
                </div>
              )}

              {/* Beginner-friendly position context */}
              {(() => {
                const before = getPositionStatus(quality.evalBefore);
                const after = getPositionStatus(quality.evalAfter);
                return (
                  <div className="mb-3 pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`${before.textClass} font-semibold`}>{before.label}</span>
                      <span className="text-slate-500">{'\u2192'}</span>
                      <span className={`${after.textClass} font-semibold`}>{after.label}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">
                      {getContextualExplanation(quality)}
                    </p>
                  </div>
                );
              })()}

              {/* Technical details collapsed */}
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical details
                </summary>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <div>Before: {quality.evalBefore > 0 ? '+' : ''}{(quality.evalBefore / 100).toFixed(2)}</div>
                  <div>After: {quality.evalAfter > 0 ? '+' : ''}{(quality.evalAfter / 100).toFixed(2)}</div>
                  <div>Change: {quality.evalDrop > 0 ? '-' : '+'}{Math.abs(quality.evalDrop / 100).toFixed(2)}</div>
                </div>
              </details>
            </div>
          );
        })()}

        {/* Post-Game Move Analysis - Beginner Friendly */}
        {result.type !== 'playing' && moveQualities.length > 0 && (() => {
          const accuracy = Math.round(
            (moveQualities.filter(m => m.classification === 'excellent' || m.classification === 'good').length /
            moveQualities.length) * 100
          );
          return (
            <div className="bg-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">How You Played</h4>

              {/* Performance Summary */}
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Your Performance</span>
                  <span className={`text-2xl font-bold ${
                    accuracy >= 80 ? 'text-emerald-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                    {accuracy}%
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  {accuracy >= 80
                    ? 'Excellent! You played very accurately.'
                    : accuracy >= 60
                    ? 'Good game! Some room for improvement.'
                    : 'Keep practicing! Review your mistakes below.'}
                </p>
              </div>

              {/* Move Quality Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between bg-emerald-900/20 rounded p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">{'\u2713'}</span>
                    <span className="text-slate-300 text-sm">Great moves</span>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    {moveQualities.filter(m => m.classification === 'excellent').length}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-blue-900/20 rounded p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">{'\u2713'}</span>
                    <span className="text-slate-300 text-sm">Good moves</span>
                  </div>
                  <span className="text-blue-400 font-bold">
                    {moveQualities.filter(m => m.classification === 'good').length}
                  </span>
                </div>
                {moveQualities.filter(m => m.classification === 'inaccuracy').length > 0 && (
                  <div className="flex items-center justify-between bg-yellow-900/20 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">{'\u26A0'}</span>
                      <span className="text-slate-300 text-sm">Minor mistakes</span>
                    </div>
                    <span className="text-yellow-400 font-bold">
                      {moveQualities.filter(m => m.classification === 'inaccuracy').length}
                    </span>
                  </div>
                )}
                {moveQualities.filter(m => m.classification === 'mistake').length > 0 && (
                  <div className="flex items-center justify-between bg-orange-900/20 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400">{'\u2717'}</span>
                      <span className="text-slate-300 text-sm">Clear mistakes</span>
                    </div>
                    <span className="text-orange-400 font-bold">
                      {moveQualities.filter(m => m.classification === 'mistake').length}
                    </span>
                  </div>
                )}
                {moveQualities.filter(m => m.classification === 'blunder').length > 0 && (
                  <div className="flex items-center justify-between bg-red-900/20 rounded p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">{'\u2716'}</span>
                      <span className="text-slate-300 text-sm">Major mistakes</span>
                    </div>
                    <span className="text-red-400 font-bold">
                      {moveQualities.filter(m => m.classification === 'blunder').length}
                    </span>
                  </div>
                )}
              </div>

              {/* Mistakes to Review */}
              {moveQualities.some(m => m.classification === 'mistake' || m.classification === 'blunder') && (
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-xs font-semibold mb-2">Review These Moves:</p>
                  <div className="space-y-1">
                    {moveQualities
                      .filter(m => m.classification === 'mistake' || m.classification === 'blunder')
                      .map((m, i) => {
                        const before = getPositionStatus(m.evalBefore);
                        const after = getPositionStatus(m.evalAfter);
                        return (
                          <div key={i} className="text-xs text-slate-300 bg-slate-800/50 rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">Move {m.moveNumber}: {m.move}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                m.classification === 'blunder' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {m.classification === 'blunder' ? 'Major' : 'Mistake'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`${before.textClass}`}>{before.label}</span>
                              <span className="text-slate-600">{'\u2192'}</span>
                              <span className={`${after.textClass}`}>{after.label}</span>
                            </div>
                            {m.bestMove && (
                              <p className="text-slate-400">
                                Better: <span className="text-green-400 font-semibold">{m.bestMove}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Accuracy Bar */}
              <div className="pt-3 border-t border-slate-700">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      accuracy >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                      accuracy >= 60 ? 'bg-gradient-to-r from-yellow-500 to-green-500' :
                      'bg-gradient-to-r from-orange-500 to-yellow-500'
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-3">
                  Tip: Use "Replay This Game" below to step through your moves and learn from mistakes.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Enhanced Move Analysis in Replay */}
        {replayState.isReplaying && replayState.game && replayState.currentMoveIndex > 0 && (() => {
          const moveIndex = replayState.currentMoveIndex - 1;
          if (moveIndex % 2 !== 0) return null; // Only for White's moves
          const moveNum = Math.ceil((moveIndex + 1) / 2);
          const isOpeningMove = moveNum <= 10;
          const quality = replayState.game.moveQualities.find(q => q.moveNumber === moveNum);

          // Opening phase message
          if (isOpeningMove) {
            return (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{'\uD83D\uDCD6'}</span>
                  <h5 className="text-blue-400 font-semibold text-sm">Opening Phase</h5>
                  <span className="text-slate-500 text-xs ml-auto">Move {moveNum}</span>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  This move is part of the London System opening setup.
                </p>
                <p className="text-slate-400 text-xs">
                  Opening moves (1-10) follow your lesson structure and are not engine-analyzed. Analysis begins from move 11 where tactical decisions matter most.
                </p>
              </div>
            );
          }

          if (!quality) {
            return (
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm text-center">No analysis available for this move</p>
              </div>
            );
          }

          const classLabel = quality.classification === 'excellent' ? 'Great move' :
            quality.classification === 'good' ? 'Good move' :
            quality.classification === 'inaccuracy' ? 'Minor mistake' :
            quality.classification === 'mistake' ? 'Clear mistake' : 'Major mistake';

          return (
            <div className={`rounded-xl p-4 border ${
              quality.classification === 'excellent' ? 'bg-green-900/20 border-green-600/30' :
              quality.classification === 'good' ? 'bg-blue-900/20 border-blue-600/30' :
              quality.classification === 'inaccuracy' ? 'bg-yellow-900/20 border-yellow-600/30' :
              quality.classification === 'mistake' ? 'bg-orange-900/20 border-orange-600/30' :
              'bg-red-900/20 border-red-600/30'
            }`}>
              {/* Classification Header */}
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${
                  quality.classification === 'excellent' ? 'text-green-400' :
                  quality.classification === 'good' ? 'text-blue-400' :
                  quality.classification === 'inaccuracy' ? 'text-yellow-400' :
                  quality.classification === 'mistake' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {classLabel}
                </p>
                <span className="text-slate-500 text-xs">Move {quality.moveNumber}</span>
              </div>

              {/* What you played */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 w-20">You played:</span>
                <span className="text-sm font-semibold text-slate-200 bg-slate-700/50 px-2 py-0.5 rounded">
                  {quality.move}
                </span>
                {(quality.classification !== 'excellent' && quality.classification !== 'good') && (
                  <span className="text-red-400 text-xs">{'\u2190'} red arrow</span>
                )}
              </div>

              {/* Better move */}
              {quality.bestMove && quality.classification !== 'excellent' && quality.classification !== 'good' && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500 w-20">Better was:</span>
                  <span className="text-sm font-semibold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded">
                    {quality.bestMove}
                  </span>
                  <span className="text-emerald-400 text-xs">{'\u2190'} green arrow</span>
                </div>
              )}

              {/* Beginner-friendly position context */}
              {(() => {
                const before = getPositionStatus(quality.evalBefore);
                const after = getPositionStatus(quality.evalAfter);
                return (
                  <div className="mb-3 pb-3 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`${before.textClass} font-semibold`}>{before.label}</span>
                      <span className="text-slate-500">{'\u2192'}</span>
                      <span className={`${after.textClass} font-semibold`}>{after.label}</span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1">
                      {getContextualExplanation(quality)}
                    </p>
                  </div>
                );
              })()}

              {/* Technical details collapsed */}
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical details
                </summary>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <div>Before: {quality.evalBefore > 0 ? '+' : ''}{(quality.evalBefore / 100).toFixed(2)}</div>
                  <div>After: {quality.evalAfter > 0 ? '+' : ''}{(quality.evalAfter / 100).toFixed(2)}</div>
                  <div>Change: {quality.evalDrop > 0 ? '-' : '+'}{Math.abs(quality.evalDrop / 100).toFixed(2)}</div>
                </div>
              </details>
            </div>
          );
        })()}

        {/* Evaluation */}
        {evaluation && (() => {
          const posStatus = getPositionStatus(evaluation.score);
          return (
            <div className="bg-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Position Evaluation</h4>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${posStatus.textClass}`}>
                  {posStatus.label}
                </span>
              </div>
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Technical details
                </summary>
                <div className="mt-2 text-xs text-slate-400">
                  Score: {evaluation.score > 0 ? '+' : ''}{(evaluation.score / 100).toFixed(2)} ({evaluation.label})
                </div>
              </details>
            </div>
          );
        })()}

        {/* Move History */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Moves</h4>
          <MoveHistory history={game.history()} />
        </div>

        {/* Lichess Stats (only during gameplay — not relevant post-game) */}
        {result.type === 'playing' && (
          <div className="bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-2">Master Database</h4>
            <LichessStatsPanel stats={lichessStats} loading={loadingStats} />
          </div>
        )}

        {/* London Adherence */}
        {checks && (
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">London System Check ({passed}/{checks.length})</h4>
            <div className="space-y-1">
              {checks.map(c => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className={c.pass ? 'text-green-400' : 'text-slate-500'}>{c.pass ? '\u2713' : '\u25CB'}</span>
                  <span className={c.pass ? 'text-green-300' : 'text-slate-500'}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { Square, Move } from 'chess.js';
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
import type { Difficulty, MoveQuality, PracticeResult, LichessStats, PositionEval, UserProgress, RecordedGame, ReplayState, ReplaySpeed } from '@/lib/types';

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
        setTimeout(() => setLastMoveQuality(null), 5000);
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
      const moveSan = prev.game.moveHistory[prev.currentMoveIndex];
      try {
        const move = game.move(moveSan);
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          forceUpdate();
        }
      } catch (e) {
        console.error('Replay move failed:', e);
      }
      return { ...prev, currentMoveIndex: prev.currentMoveIndex + 1 };
    });
  }, [game, forceUpdate, setLastMove]);

  /** Go to previous move in replay */
  const prevReplayMove = useCallback(() => {
    setReplayState(prev => {
      if (prev.currentMoveIndex === 0) return prev;
      game.undo();
      const hist = game.history({ verbose: true });
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        setLastMove({ from: last.from, to: last.to });
      } else {
        setLastMove(null);
      }
      forceUpdate();
      return { ...prev, currentMoveIndex: prev.currentMoveIndex - 1 };
    });
  }, [game, forceUpdate, setLastMove]);

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
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move) {
          setLastMove({ from: move.from, to: move.to });
          setSelectedSquare(null);
          setLegalMoves([]);
          forceUpdate();
          checkGameOver();

          // Analyze move quality (async, doesn't block gameplay)
          analyzePlayerMove(fenBefore, move.san);

          if (!game.isGameOver()) {
            setTimeout(() => makeAIMove(), 600);
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
  }, [replayState.isReplaying, selectedSquare, result.type, game, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate, checkGameOver, makeAIMove, analyzePlayerMove]);

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
    forceUpdate();
  }, [game, setSelectedSquare, setLegalMoves, setLastMove, forceUpdate]);

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

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Move {replayState.currentMoveIndex} of {replayState.game.moveHistory.length}</span>
                  <span>{replayState.game.moveHistory.length > 0 ? Math.round((replayState.currentMoveIndex / replayState.game.moveHistory.length) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${replayState.game.moveHistory.length > 0 ? (replayState.currentMoveIndex / replayState.game.moveHistory.length) * 100 : 0}%` }}
                  />
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
          game={game}
          boardKey={boardKey}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          lastMove={lastMove}
          onSquareClick={handleSquareClick}
          flipped={flipped}
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
          <button
            onClick={fetchEvaluation}
            disabled={loadingEval || analyzingMove || replayState.isReplaying}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-xl text-sm font-semibold border border-slate-600 transition-all duration-300"
          >
            {loadingEval ? '...' : analyzingMove ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Practice Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        {/* Difficulty Selector */}
        <div className="bg-slate-800 rounded-xl p-4">
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
              <p className="text-slate-400 text-xs mt-0.5">
                Position dropped by {(lastMoveQuality.evalDrop / 100).toFixed(2)} pawns
              </p>
              {lastMoveQuality.bestMove && lastMoveQuality.classification !== 'good' && (
                <p className="text-slate-400 text-xs mt-1">
                  Better: <span className="text-emerald-400 font-semibold">{lastMoveQuality.bestMove}</span>
                </p>
              )}
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
            <div className="text-center py-2">
              <div className="text-4xl mb-2 text-slate-300">
                {result.type === 'checkmate' && result.winner === 'w' ? '\u2654' : ''}
                {result.type === 'checkmate' && result.winner === 'b' ? '\u265A' : ''}
                {result.type !== 'checkmate' ? '\u00BD' : ''}
              </div>
              <h4 className="text-lg font-bold text-white">
                {result.type === 'checkmate' && `Checkmate! ${result.winner === 'w' ? 'You win!' : 'Computer wins.'}`}
                {result.type === 'stalemate' && 'Stalemate \u2014 Draw!'}
                {result.type === 'draw' && 'Draw!'}
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                vs {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI
              </p>
            </div>
          )}
        </div>

        {/* Post-Game Move Analysis */}
        {result.type !== 'playing' && moveQualities.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Move Analysis</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <p className="text-xs text-slate-400">Excellent</p>
                <p className="text-lg font-bold text-green-400">
                  {moveQualities.filter(m => m.classification === 'excellent').length}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <p className="text-xs text-slate-400">Good</p>
                <p className="text-lg font-bold text-blue-400">
                  {moveQualities.filter(m => m.classification === 'good').length}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <p className="text-xs text-slate-400">Inaccuracies</p>
                <p className="text-lg font-bold text-yellow-400">
                  {moveQualities.filter(m => m.classification === 'inaccuracy').length}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <p className="text-xs text-slate-400">Mistakes</p>
                <p className="text-lg font-bold text-orange-400">
                  {moveQualities.filter(m => m.classification === 'mistake' || m.classification === 'blunder').length}
                </p>
              </div>
            </div>

            {moveQualities.some(m => m.classification === 'blunder') && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2 mb-3">
                <p className="text-red-400 text-xs font-semibold mb-1">Blunders:</p>
                <div className="space-y-1">
                  {moveQualities
                    .filter(m => m.classification === 'blunder')
                    .map((m, i) => (
                      <p key={i} className="text-xs text-slate-300">
                        Move {m.moveNumber}: <span className="font-semibold">{m.move}</span>
                        {m.bestMove && <span className="text-green-400 ml-2">({m.bestMove} was better)</span>}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Accuracy</span>
                <span className="text-sm font-bold text-white">
                  {Math.round(
                    (moveQualities.filter(m => m.classification === 'excellent' || m.classification === 'good').length /
                    moveQualities.length) * 100
                  )}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  style={{
                    width: `${(moveQualities.filter(m => m.classification === 'excellent' || m.classification === 'good').length /
                    moveQualities.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Replay This Game Button */}
        {result.type !== 'playing' && !replayState.isReplaying && (
          <div className="bg-slate-800 rounded-xl p-4">
            <button
              onClick={startReplay}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl font-semibold border border-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Replay This Game
            </button>
          </div>
        )}

        {/* Current Move Quality in Replay */}
        {replayState.isReplaying && replayState.game && replayState.currentMoveIndex > 0 && (() => {
          const moveIndex = replayState.currentMoveIndex - 1;
          // Only show for White moves (even indices in moveHistory)
          if (moveIndex % 2 !== 0) return null;
          const moveNum = Math.ceil((moveIndex + 1) / 2);
          const quality = replayState.game.moveQualities.find(q => q.moveNumber === moveNum);
          if (!quality) return null;
          return (
            <div className={`rounded-xl p-3 border ${
              quality.classification === 'excellent' ? 'bg-green-900/20 border-green-600/30' :
              quality.classification === 'good' ? 'bg-blue-900/20 border-blue-600/30' :
              quality.classification === 'inaccuracy' ? 'bg-yellow-900/20 border-yellow-600/30' :
              quality.classification === 'mistake' ? 'bg-orange-900/20 border-orange-600/30' :
              'bg-red-900/20 border-red-600/30'
            }`}>
              <p className={`text-xs font-semibold uppercase ${
                quality.classification === 'excellent' ? 'text-green-400' :
                quality.classification === 'good' ? 'text-blue-400' :
                quality.classification === 'inaccuracy' ? 'text-yellow-400' :
                quality.classification === 'mistake' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {quality.classification}
              </p>
              <p className="text-slate-300 text-xs mt-1">
                {quality.move} (Eval drop: {(quality.evalDrop / 100).toFixed(2)})
              </p>
              {quality.bestMove && quality.classification !== 'excellent' && quality.classification !== 'good' && (
                <p className="text-slate-400 text-xs mt-0.5">
                  Better: <span className="text-green-400 font-semibold">{quality.bestMove}</span>
                </p>
              )}
            </div>
          );
        })()}

        {/* Evaluation */}
        {evaluation && (
          <div className="bg-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-1">Position Evaluation</h4>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${evaluation.score > 25 ? 'text-white' : evaluation.score < -25 ? 'text-gray-400' : 'text-slate-300'}`}>
                {evaluation.score > 0 ? '+' : ''}{(evaluation.score / 100).toFixed(1)}
              </span>
              <span className="text-slate-400 text-sm">{evaluation.label}</span>
            </div>
          </div>
        )}

        {/* Move History */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Moves</h4>
          <MoveHistory history={game.history()} />
        </div>

        {/* Lichess Stats */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Master Database</h4>
          <LichessStatsPanel stats={lichessStats} loading={loadingStats} />
        </div>

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

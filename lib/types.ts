import { Square } from 'chess.js';

/** Application view modes */
export type AppMode = 'menu' | 'lesson' | 'practice' | 'middlegame' | 'middlegame-chapter';

/** Piece color shorthand */
export type PieceColor = 'w' | 'b';

/** AI opponent difficulty levels */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Practice game result state */
export interface PracticeResult {
  type: 'checkmate' | 'stalemate' | 'draw' | 'playing';
  winner?: PieceColor;
}

/** Lichess opening database statistics for a position */
export interface LichessStats {
  white: number;
  draws: number;
  black: number;
  topMoves: Array<{ san: string; total: number; winRate: number }>;
}

/** Persistent user progress stored in localStorage */
export interface UserProgress {
  completedLessons: string[];
  practiceGames: { wins: number; losses: number; draws: number };
}

/** Stockfish position evaluation */
export interface PositionEval {
  score: number;
  label: string;
}

/** Move quality classification based on evaluation drop */
export type MoveClassification = 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/** Analysis of a single move's quality */
export interface MoveQuality {
  moveNumber: number;
  move: string;
  evalBefore: number;
  evalAfter: number;
  evalDrop: number;
  classification: MoveClassification;
  bestMove?: string;
}

/** Arrow overlay for move hints */
export interface ArrowHint {
  from: Square;
  to: Square;
}

/** Last move highlight */
export interface LastMove {
  from: Square;
  to: Square;
}

/** Master game statistics from Lichess database */
export interface MasterStats {
  totalGames: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  winRate: number;
  popularity: number;
}

/** Lesson step definition */
export interface LessonStep {
  move: string;
  side: PieceColor;
  explanation: string;
  highlight?: string;
  masterStats?: MasterStats;
}

/** Lesson definition */
export interface Lesson {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  steps: LessonStep[];
  keyIdeas: string[];
}

/** Annotation for a single move in a master game */
export interface MoveAnnotation {
  moveNumber: number;
  move: string;
  concept: string;
  explanation: string;
  visualHint?: string;
}

/** Annotated master game for study */
export interface AnnotatedGame {
  id: string;
  title: string;
  players: string;
  result: string;
  pgn: string;
  startPosition?: string;
  annotations: MoveAnnotation[];
  keyTakeaways: string[];
}

/** Training position with multiple choice or interactive board */
export interface TrainingPosition {
  id: string;
  fen: string;
  toMove: 'w' | 'b';
  question: string;
  type: 'multiple-choice' | 'find-move' | 'play-sequence';
  options?: { label: string; isCorrect: boolean; explanation: string }[];
  correctMoves?: string[];
  hints?: string[];
  explanation: string;
}

/** Complete chapter with game + positions */
export interface MiddlegameChapter {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  theme: string;
  masterGame: AnnotatedGame;
  trainingPositions: TrainingPosition[];
  estimatedTime: number;
}

/** User progress for middlegame chapters */
export interface MiddlegameProgress {
  completedChapters: string[];
  positionResults: Record<string, boolean>;
  lastStudied?: number;
}

/** Replay speed multiplier */
export type ReplaySpeed = 0.5 | 1 | 2;

/** Recorded game data saved to localStorage */
export interface RecordedGame {
  id: string;
  timestamp: number;
  difficulty: Difficulty;
  result: PracticeResult;
  pgn: string;
  moveHistory: string[];
  moveQualities: MoveQuality[];
  whitePlayer: string;
  blackPlayer: string;
}

/** Replay state for viewing past games */
export interface ReplayState {
  isReplaying: boolean;
  currentMoveIndex: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
  game: RecordedGame | null;
}

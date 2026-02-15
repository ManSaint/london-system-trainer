import { useState, useCallback } from 'react';
import Head from 'next/head';
import { useChessGame } from '@/hooks/useChessGame';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MenuScreen } from '@/components/screens/MenuScreen';
import { LessonScreen } from '@/components/screens/LessonScreen';
import { PracticeScreen } from '@/components/screens/PracticeScreen';
import { MiddlegameMenuScreen } from '@/components/screens/MiddlegameMenuScreen';
import { MiddlegameChapterScreen } from '@/components/screens/MiddlegameChapterScreen';
import { middlegameChapters } from '@/lib/middlegameChapters';
import { STORAGE_KEY } from '@/lib/constants';
import type { AppMode, UserProgress, MiddlegameProgress } from '@/lib/types';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  practiceGames: { wins: 0, losses: 0, draws: 0 },
};

const DEFAULT_MIDDLEGAME_PROGRESS: MiddlegameProgress = {
  completedChapters: [],
  positionResults: {},
};

export default function Home() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [middlegameChapterId, setMiddlegameChapterId] = useState<string | null>(null);
  const [progress, setProgress] = useLocalStorage<UserProgress>(STORAGE_KEY, DEFAULT_PROGRESS);
  const [middlegameProgress, setMiddlegameProgress] = useLocalStorage<MiddlegameProgress>(
    'london-middlegame-progress',
    DEFAULT_MIDDLEGAME_PROGRESS
  );
  const chessGame = useChessGame();

  /** Update progress with a transform function */
  const updateProgress = useCallback((fn: (p: UserProgress) => UserProgress) => {
    setProgress(fn);
  }, [setProgress]);

  /** Start a lesson by ID */
  const startLesson = useCallback((id: string) => {
    chessGame.resetGame();
    setLessonId(id);
    setMode('lesson');
  }, [chessGame]);

  /** Start practice mode */
  const startPractice = useCallback(() => {
    chessGame.resetGame();
    setMode('practice');
  }, [chessGame]);

  /** Start middlegame menu */
  const startMiddlegame = useCallback(() => {
    setMode('middlegame');
  }, []);

  /** Start a specific middlegame chapter */
  const startMiddlegameChapter = useCallback((chapterId: string) => {
    setMiddlegameChapterId(chapterId);
    setMode('middlegame-chapter');
  }, []);

  /** Handle middlegame chapter completion */
  const handleMiddlegameChapterComplete = useCallback((chapterId: string, positionResults: Record<string, boolean>) => {
    setMiddlegameProgress(prev => ({
      completedChapters: prev.completedChapters.includes(chapterId)
        ? prev.completedChapters
        : [...prev.completedChapters, chapterId],
      positionResults: { ...prev.positionResults, ...positionResults },
      lastStudied: Date.now(),
    }));
    setMode('middlegame');
    setMiddlegameChapterId(null);
  }, [setMiddlegameProgress]);

  /** Mark a lesson as complete in progress */
  const handleLessonComplete = useCallback((id: string) => {
    setProgress(p => {
      if (p.completedLessons.includes(id)) return p;
      return { ...p, completedLessons: [...p.completedLessons, id] };
    });
  }, [setProgress]);

  /** Return to main menu and reset game state */
  const goToMenu = useCallback(() => {
    chessGame.resetGame();
    setMode('menu');
    setLessonId(null);
    setMiddlegameChapterId(null);
  }, [chessGame]);

  return (
    <ErrorBoundary>
      <Head>
        <title>London System Trainer &mdash; Master Chess Openings</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-slate-50 tracking-tight">London System Trainer</h1>
          <p className="text-slate-400 text-base mt-2">Master the London with real master game data</p>
        </div>

        {mode === 'menu' && (
          <MenuScreen
            progress={progress}
            onStartLesson={startLesson}
            onStartPractice={startPractice}
            onStartMiddlegame={startMiddlegame}
          />
        )}

        {mode === 'lesson' && lessonId && (
          <LessonScreen
            lessonId={lessonId}
            chessGame={chessGame}
            onComplete={handleLessonComplete}
            onBack={goToMenu}
          />
        )}

        {mode === 'practice' && (
          <PracticeScreen
            chessGame={chessGame}
            onUpdateProgress={updateProgress}
            onBack={goToMenu}
          />
        )}

        {mode === 'middlegame' && (
          <MiddlegameMenuScreen
            progress={middlegameProgress}
            onStartChapter={startMiddlegameChapter}
            onBack={goToMenu}
          />
        )}

        {mode === 'middlegame-chapter' && middlegameChapterId && middlegameChapters[middlegameChapterId] && (
          <MiddlegameChapterScreen
            chapter={middlegameChapters[middlegameChapterId]}
            onComplete={handleMiddlegameChapterComplete}
            onBack={goToMenu}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

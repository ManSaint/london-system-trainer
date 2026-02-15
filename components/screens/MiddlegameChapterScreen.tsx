import React, { useState, useCallback } from 'react';
import { AnnotatedGameViewer } from '@/components/middlegame/AnnotatedGameViewer';
import { TrainingPositionView } from '@/components/middlegame/TrainingPositionView';
import type { MiddlegameChapter } from '@/lib/types';

interface MiddlegameChapterScreenProps {
  chapter: MiddlegameChapter;
  onComplete: (chapterId: string, positionResults: Record<string, boolean>) => void;
  onBack: () => void;
}

type ChapterPhase = 'game' | 'training' | 'complete';

/** Complete chapter flow: annotated game -> training positions -> summary */
export function MiddlegameChapterScreen({ chapter, onComplete, onBack }: MiddlegameChapterScreenProps) {
  const [phase, setPhase] = useState<ChapterPhase>('game');
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [positionResults, setPositionResults] = useState<Record<string, boolean>>({});

  const handleGameComplete = useCallback(() => {
    setPhase('training');
    setCurrentPositionIndex(0);
  }, []);

  const handlePositionComplete = useCallback((correct: boolean) => {
    const positionId = chapter.trainingPositions[currentPositionIndex].id;
    setPositionResults(prev => ({ ...prev, [positionId]: correct }));

    setTimeout(() => {
      if (currentPositionIndex < chapter.trainingPositions.length - 1) {
        setCurrentPositionIndex(prev => prev + 1);
      } else {
        setPhase('complete');
      }
    }, 3200);
  }, [currentPositionIndex, chapter.trainingPositions]);

  const handleChapterComplete = useCallback(() => {
    onComplete(chapter.id, positionResults);
  }, [chapter.id, positionResults, onComplete]);

  // Game Study Phase
  if (phase === 'game') {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-300 text-sm">
              <strong className="text-amber-400">Study Phase:</strong> Watch this master game to understand the {chapter.theme.toLowerCase()} concept
            </p>
          </div>
        </div>
        <AnnotatedGameViewer
          annotatedGame={chapter.masterGame}
          onComplete={handleGameComplete}
          onBack={onBack}
        />
      </div>
    );
  }

  // Training Phase
  if (phase === 'training') {
    const currentPosition = chapter.trainingPositions[currentPositionIndex];

    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <p className="text-slate-300 text-sm">
              <strong className="text-amber-400">Training:</strong> Position {currentPositionIndex + 1} of {chapter.trainingPositions.length}
            </p>
            <div className="flex gap-2">
              {chapter.trainingPositions.map((pos, i) => (
                <div
                  key={pos.id}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i < currentPositionIndex
                      ? positionResults[chapter.trainingPositions[i].id]
                        ? 'bg-emerald-400'
                        : 'bg-red-400'
                      : i === currentPositionIndex
                      ? 'bg-amber-400'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <TrainingPositionView
          key={currentPosition.id}
          position={currentPosition}
          onComplete={handlePositionComplete}
        />
      </div>
    );
  }

  // Complete Phase
  const correctCount = Object.values(positionResults).filter(Boolean).length;
  const totalCount = chapter.trainingPositions.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4 text-slate-300">
        {percentage >= 80 ? '\u2654' : percentage >= 60 ? '\u265B' : '\u265C'}
      </div>
      <h2 className="text-3xl font-bold text-slate-50 mb-2">Chapter Complete</h2>
      <p className="text-slate-400 mb-6">{chapter.title}</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="text-5xl font-bold text-slate-50 mb-2">{percentage}%</div>
        <p className="text-slate-400">Accuracy</p>
        <div className="mt-4 h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-slate-500 text-sm mt-2">
          {correctCount} of {totalCount} positions correct
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleChapterComplete}
          className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
        >
          Back to Middlegame Menu
        </button>
        <button
          onClick={onBack}
          className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold border border-slate-600 transition-all duration-300"
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
}

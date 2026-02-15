import React from 'react';
import { middlegameChapters } from '@/lib/middlegameChapters';
import type { MiddlegameProgress } from '@/lib/types';

interface MiddlegameMenuScreenProps {
  progress: MiddlegameProgress;
  onStartChapter: (chapterId: string) => void;
  onBack: () => void;
}

/** Menu screen showing all available middlegame chapters */
export function MiddlegameMenuScreen({ progress, onStartChapter, onBack }: MiddlegameMenuScreenProps) {
  const chapters = Object.values(middlegameChapters);

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Middlegame Training</h2>
        <p className="text-slate-400 text-sm">Master the London System beyond the opening</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {chapters.map(chapter => {
          const isComplete = progress.completedChapters.includes(chapter.id);

          return (
            <button
              key={chapter.id}
              onClick={() => onStartChapter(chapter.id)}
              className="group relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 text-left transition-all duration-300 hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
            >
              {isComplete && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg">
                  {'\u2713'} Complete
                </div>
              )}

              <div className="text-4xl mb-3 text-slate-300 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
                {'\u2694'}
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">{chapter.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{chapter.description}</p>

              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>{chapter.estimatedTime} min</span>
                <span>{chapter.trainingPositions.length} positions</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold border border-slate-600 transition-all duration-300"
        >
          {'\u2190'} Back to Main Menu
        </button>
      </div>
    </div>
  );
}

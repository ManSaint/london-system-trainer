import React from 'react';
import { lessons } from '@/lib/lessons';
import type { UserProgress } from '@/lib/types';

interface MenuScreenProps {
  progress: UserProgress;
  onStartLesson: (id: string) => void;
  onStartPractice: () => void;
  onStartMiddlegame: () => void;
}

/** Chess piece icons mapped to lesson IDs */
const LESSON_ICONS: Record<string, string> = {
  kid: '\u265C',    // ♜ rook
  qgd: '\u265B',    // ♛ queen
  qid: '\u265F',    // ♟ pawn
  dutch: '\u265E',   // ♞ knight
};

/** Main menu showing lesson cards and practice button */
export const MenuScreen = React.memo(function MenuScreen({ progress, onStartLesson, onStartPractice, onStartMiddlegame }: MenuScreenProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 pb-16">
      {/* Lessons Section */}
      <div className="mb-14">
        <h2 className="text-2xl font-semibold text-slate-200 mb-6">Learn the Variations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(lessons).map(([id, lesson]) => {
            const isComplete = progress.completedLessons.includes(id);

            return (
              <button
                key={id}
                onClick={() => onStartLesson(id)}
                className="group relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 text-left transition-all duration-300 hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
              >
                {isComplete && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {'\u2713'} Complete
                  </div>
                )}

                <div className="text-5xl mb-4 text-slate-300 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
                  {LESSON_ICONS[id] || '\u265A'}
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-2">{lesson.name}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{lesson.description}</p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{lesson.steps.length} moves</span>
                  <span className="text-amber-400/0 group-hover:text-amber-400/100 transition-all duration-300">{'\u2192'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middlegame Section */}
      <div className="mb-14">
        <h2 className="text-2xl font-semibold text-slate-200 mb-6">Beyond the Opening</h2>
        <button
          onClick={onStartMiddlegame}
          className="group w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 text-left transition-all duration-300 hover:bg-slate-800 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
        >
          <div className="flex items-start gap-6">
            <div className="text-6xl text-slate-300 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300">
              {'\u2654'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Middlegame Training</h3>
              <p className="text-slate-400 mb-4">
                Learn what to do after the opening with annotated master games and training positions
              </p>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>{'\u2022'} Master games</span>
                <span>{'\u2022'} Training positions</span>
                <span>{'\u2022'} Strategic concepts</span>
              </div>
            </div>
            <div className="text-purple-400 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center">
              {'\u2192'}
            </div>
          </div>
        </button>
      </div>

      {/* Practice Section */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-200 mb-6">Practice</h2>
        <button
          onClick={onStartPractice}
          className="group w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 text-left transition-all duration-300 hover:bg-slate-800 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
        >
          <div className="flex items-start gap-6">
            <div className="text-6xl text-slate-300 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300">
              {'\u265A'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Practice Mode</h3>
              <p className="text-slate-400 mb-4">
                Play as White against a Lichess-powered opponent
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-xs">
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 text-center">
                  <p className="text-slate-500 text-xs mb-1">Wins</p>
                  <p className="text-emerald-400 text-lg font-bold">{progress.practiceGames.wins}</p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 text-center">
                  <p className="text-slate-500 text-xs mb-1">Draws</p>
                  <p className="text-slate-400 text-lg font-bold">{progress.practiceGames.draws}</p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 text-center">
                  <p className="text-slate-500 text-xs mb-1">Losses</p>
                  <p className="text-red-400 text-lg font-bold">{progress.practiceGames.losses}</p>
                </div>
              </div>
            </div>
            <div className="text-amber-400 text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center">
              {'\u2192'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

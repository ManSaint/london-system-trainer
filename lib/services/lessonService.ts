import { Chess, Move } from 'chess.js';
import { fetchLichessExplorer } from '@/lib/api/lichess';
import { lessons } from '@/lib/lessons';
import type { Lesson, LessonStep, MasterStats } from '@/lib/types';

/**
 * Enriches a lesson with real master game statistics from Lichess.
 * Walks through each position, fetches explorer data, and attaches
 * MasterStats to the corresponding step.
 */
async function fetchLessonWithStats(lessonId: string): Promise<Lesson> {
  const lesson = lessons[lessonId];
  if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

  const enrichedSteps: LessonStep[] = [];
  const uciHistory: string[] = [];
  const tempGame = new Chess();

  for (let i = 0; i < lesson.steps.length; i++) {
    const step = lesson.steps[i];
    let masterStats: MasterStats | undefined;

    try {
      const data = await fetchLichessExplorer(uciHistory, 0);
      const lichessMove = data.moves.find(m => m.san === step.move);

      if (lichessMove) {
        const total = lichessMove.white + lichessMove.draws + lichessMove.black;
        const totalAtPosition = data.white + data.draws + data.black;

        masterStats = {
          totalGames: total,
          whiteWins: lichessMove.white,
          draws: lichessMove.draws,
          blackWins: lichessMove.black,
          winRate: total > 0 ? Math.round((lichessMove.white / total) * 100) : 0,
          popularity: totalAtPosition > 0 ? Math.round((total / totalAtPosition) * 100) : 0,
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch stats for step ${i}:`, error);
    }

    enrichedSteps.push({ ...step, masterStats });

    // Advance the temp game to build UCI history for next position
    const moveObj: Move | null = tempGame.move(step.move);
    if (moveObj) {
      uciHistory.push(moveObj.from + moveObj.to + (moveObj.promotion || ''));
    }

    // Rate-limit: 100ms between requests
    if (i < lesson.steps.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return { ...lesson, steps: enrichedSteps };
}

/** In-memory cache for enriched lessons */
const lessonCache = new Map<string, Lesson>();

/** Get lesson with stats, using cache if available */
export async function getLessonWithStats(lessonId: string): Promise<Lesson> {
  const cached = lessonCache.get(lessonId);
  if (cached) return cached;

  const enriched = await fetchLessonWithStats(lessonId);
  lessonCache.set(lessonId, enriched);
  return enriched;
}

import type { RecordedGame } from '@/lib/types';

const STORAGE_KEY = 'london_recorded_games';
const MAX_GAMES = 10;

/** Save a game to localStorage (keeps last 10 games) */
export function saveGame(game: RecordedGame): void {
  try {
    const stored = getStoredGames();
    const updated = [game, ...stored].slice(0, MAX_GAMES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save game:', error);
  }
}

/** Get all stored games from localStorage */
export function getStoredGames(): RecordedGame[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load games:', error);
    return [];
  }
}

/** Delete a game by ID */
export function deleteGame(gameId: string): void {
  try {
    const stored = getStoredGames();
    const filtered = stored.filter(g => g.id !== gameId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('Failed to delete game:', error);
  }
}

/** Clear all stored games */
export function clearAllGames(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear games:', error);
  }
}

/**
 * Lichess API Integration
 * 
 * Fetches real master games from the Lichess opening database
 * No API key required - completely free!
 */

export interface LichessGame {
  id: string;
  white: string;
  black: string;
  year: number;
  moves: string;
  result: string;
}

export interface LichessExplorerData {
  white: number;
  draws: number;
  black: number;
  moves: Array<{
    uci: string;
    san: string;
    averageRating: number;
    white: number;
    draws: number;
    black: number;
  }>;
  topGames: LichessGame[];
}

/**
 * Fetch opening statistics and master games for a position
 */
export async function fetchLichessExplorer(
  moves: string[],
  topGames: number = 5
): Promise<LichessExplorerData> {
  const moveString = moves.join(',');
  const url = `https://explorer.lichess.ovh/masters?play=${moveString}&topGames=${topGames}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lichess API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching from Lichess:', error);
    throw error;
  }
}

/**
 * Get the most popular continuation in a position
 */
export async function getMostPopularMove(moves: string[]): Promise<{
  uci: string;
  san: string;
  winRate: number;
}> {
  const data = await fetchLichessExplorer(moves, 0);
  
  if (!data.moves || data.moves.length === 0) {
    throw new Error('No moves found in this position');
  }
  
  const mostPopular = data.moves.sort((a, b) => {
    const totalA = a.white + a.draws + a.black;
    const totalB = b.white + b.draws + b.black;
    return totalB - totalA;
  })[0];
  
  const total = mostPopular.white + mostPopular.draws + mostPopular.black;
  const winRate = (mostPopular.white / total) * 100;
  
  return {
    uci: mostPopular.uci,
    san: mostPopular.san,
    winRate: Math.round(winRate)
  };
}

/**
 * Example: Fetch London System vs King's Indian games
 */
export async function fetchLondonVsKID(): Promise<LichessExplorerData> {
  const londonKIDMoves = ['d2d4', 'g8f6', 'c1f4', 'g7g6', 'g1f3', 'f8g7', 'e2e3', 'd7d6'];
  return fetchLichessExplorer(londonKIDMoves, 10);
}

/**
 * Chess-API.com Integration (Stockfish 17)
 * Provides move analysis, position evaluation, and best move suggestions
 */

export interface StockfishAnalysis {
  success: boolean;
  evaluation: number;
  mate?: number;
  bestMove: string;
  continuation: string[];
  depth: number;
}

export async function analyzePosition(
  fen: string,
  depth: number = 15
): Promise<StockfishAnalysis> {
  const url = 'https://chess-api.com/v1';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, depth })
    });
    
    if (!response.ok) {
      throw new Error(`Chess API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      evaluation: data.eval || 0,
      mate: data.mate,
      bestMove: data.move,
      continuation: data.pv || [],
      depth: data.depth
    };
  } catch (error) {
    console.error('Error analyzing position:', error);
    throw error;
  }
}

export function getEvaluationLabel(centipawns: number): string {
  if (centipawns > 300) return 'White is winning';
  if (centipawns > 100) return 'White is better';
  if (centipawns > 25) return 'White is slightly better';
  if (centipawns > -25) return 'Equal position';
  if (centipawns > -100) return 'Black is slightly better';
  if (centipawns > -300) return 'Black is better';
  return 'Black is winning';
}

interface AIConfig {
  apiKey: string;
  modelName: string;
  providerName?: string;
}

interface ChessGame {
  board(): any[][];
  isCheckmate(): boolean;
  turn(): string;
  moves(options?: { verbose?: boolean }): any[];
  move(move: string): any;
  undo(): any;
  isGameOver(): boolean;
  fen(): string;
  history(): string[];
}

class StockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;
  private depth = 15;
  private timeLimit = 5000;

  constructor(depth = 15, timeLimit = 5000) {
    this.depth = depth;
    this.timeLimit = timeLimit;
    this.initStockfish();
  }

  private async initStockfish() {
    try {
      this.worker = new Worker('/stockfish.js-10.0.2/stockfish.js');
      
      this.worker.postMessage('uci');
      
      await new Promise<void>((resolve) => {
        this.worker!.onmessage = (e) => {
          if (e.data === 'uciok') {
            this.isReady = true;
            resolve();
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  }

  async getBestMove(game: ChessGame): Promise<string> {
    if (!this.worker || !this.isReady) {
      const moves = game.moves();
      return moves[Math.floor(Math.random() * moves.length)] || '';
    }

    return new Promise((resolve) => {
      const fen = game.fen();
      let bestMove = '';

      this.worker!.onmessage = (e) => {
        const message = e.data;
        if (typeof message === 'string') {
          if (message.startsWith('bestmove')) {
            const moveMatch = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
            if (moveMatch) {
              bestMove = this.convertUciToSan(moveMatch[1], game);
            }
            resolve(bestMove || game.moves()[0] || '');
          }
        }
      };

      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${this.depth} movetime ${this.timeLimit}`);
    });
  }

  private convertUciToSan(uciMove: string, game: ChessGame): string {
    const moves = game.moves({ verbose: true });
    const move = moves.find((m: any) => {
      const from = m.from;
      const to = m.to;
      const promotion = m.promotion;
      
      let uciString = from + to;
      if (promotion) {
        uciString += promotion;
      }
      
      return uciString === uciMove;
    });
    
    return move ? move.san : '';
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}


class CustomAIEngine {
  constructor(private config: AIConfig) {}

  async getBestMove(
    fen: string,
    legalMoves: string[]
  ): Promise<{ move: string | null; isLimitReached?: boolean; error?: string }> {
    try {
      const { getCustomAIMove } = await import('./aiMoves');
      const result = await getCustomAIMove(this.config, fen, legalMoves);
      console.log("Custom AI move:", result.move);
      
      return {
        move: result.move,
        isLimitReached: result.isLimitReached,
        error: result.error
      };
    } catch (error) {
      console.error("Custom AI error:", error);
      return { move: null, error: (error as Error).message };
    }
  }
}

export class HybridAI {
  private stockfishEngine: StockfishEngine;
  private customAI: CustomAIEngine | null = null;
  private useCustomAI = false;

  constructor() {
    this.stockfishEngine = new StockfishEngine();
  }

  setStockfishMode(depth?: number, timeLimit?: number) {
    this.useCustomAI = false;
    if (depth !== undefined || timeLimit !== undefined) {
      this.stockfishEngine = new StockfishEngine(depth, timeLimit);
    }
  }

  setCustomAIMode(config: AIConfig) {
    this.useCustomAI = true;
    this.customAI = new CustomAIEngine(config);
  }

  async getBestMove(
    fen: string,
    legalMoves: string[],
    game?: ChessGame
  ): Promise<{ move: string | null; isLimitReached?: boolean; shouldFallback?: boolean }> {
    try {
      if (this.useCustomAI && this.customAI) {
        const result = await this.customAI.getBestMove(
          fen,
          legalMoves
        );
        
        // Always check for API limit first
        if (result.isLimitReached) {
          return { move: null, isLimitReached: true };
        }
        
        // If no move returned but no limit reached, it's an error
        if (!result.move) {
          return { move: null, isLimitReached: false };
        }
        
        // Validate the move
        if (legalMoves.includes(result.move.trim())) {
          return { move: result.move };
        }
        
        // Invalid move returned
        return { move: null, isLimitReached: false };
      }

      // Use Stockfish engine (default)
      if (game) {
        const move = await this.stockfishEngine.getBestMove(game);
        return { move };
      }
    } catch (error) {
      console.error("AI engine error:", error);
      return { move: null, isLimitReached: false };
    }
    return { move: null };
  }

  destroy() {
    this.stockfishEngine.destroy();
  }
}

interface AIConfig {
  apiKey: string;
  modelName: string;
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
    moveHistory: string[],
    legalMoves: string[]
  ): Promise<string | null> {
    try {
      const response = await fetch("/api/custom-ai-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen,
          moveHistory,
          legalMoves,
          config: this.config,
        }),
      });

      if (!response.ok) {
        console.warn(
          `Custom AI API error: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.move?.trim() || null;
    } catch (error) {
      console.error("Custom AI error:", error);
      return null;
    }
  }
}

export class HybridAI {
  private stockfishEngine = new StockfishEngine();
  private customAI: CustomAIEngine | null = null;
  private useCustomAI = false;

  setStockfishMode() {
    this.useCustomAI = false;
  }

  setCustomAIMode(config: AIConfig) {
    this.useCustomAI = true;
    this.customAI = new CustomAIEngine(config);
  }

  async getBestMove(
    fen: string,
    moveHistory: string[],
    legalMoves: string[],
    game?: ChessGame
  ): Promise<string | null> {
    try {
      if (this.useCustomAI && this.customAI) {
        const move = await this.customAI.getBestMove(
          fen,
          moveHistory,
          legalMoves
        );
        if (move && legalMoves.includes(move.trim())) {
          return move;
        }
      }

      // Use Stockfish engine (default)
      if (game) {
        return await this.stockfishEngine.getBestMove(game);
      }
    } catch (error) {
      console.error("AI engine error:", error);
      // Fallback to Stockfish engine
      if (game) {
        return await this.stockfishEngine.getBestMove(game);
      }
    }
    return null;
  }

  destroy() {
    this.stockfishEngine.destroy();
  }
}

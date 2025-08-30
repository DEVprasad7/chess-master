interface AIConfig {
  apiKey: string;
  modelName: string;
}

interface ChessGame {
  board(): any[][];
  isCheckmate(): boolean;
  turn(): string;
  moves(): string[];
  move(move: string): any;
  undo(): any;
  isGameOver(): boolean;
  fen(): string;
  history(): string[];
}

// Lightweight Local Chess Engine
class LocalChessEngine {
  private pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  private evaluatePosition(game: ChessGame): number {
    let score = 0;
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value =
            this.pieceValues[piece.type as keyof typeof this.pieceValues] || 0;
          score += piece.color === "w" ? -value : value;

          // Simple positional bonus
          if (piece.type === "p") {
            score += piece.color === "b" ? (6 - i) * 10 : (i - 1) * 10;
          }
        }
      }
    }

    if (game.isCheckmate()) {
      score += game.turn() === "w" ? 100000 : -100000;
    }

    return score;
  }

  private minimax(
    game: ChessGame,
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean
  ): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluatePosition(game);
    }

    const moves = game.moves();

    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        game.move(move);
        const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  async getBestMove(game: ChessGame): Promise<string> {
    const moves = game.moves();
    if (moves.length === 0) return "";

    // Check for immediate checkmate
    for (const move of moves) {
      game.move(move);
      if (game.isCheckmate()) {
        game.undo();
        return move;
      }
      game.undo();
    }

    let bestMove = moves[0];
    let bestScore = -Infinity;

    // Use depth 2 for faster performance
    for (const move of moves) {
      game.move(move);
      const score = this.minimax(game, 2, -Infinity, Infinity, false);
      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
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
  private localEngine = new LocalChessEngine();
  private customAI: CustomAIEngine | null = null;
  private useCustomAI = false;

  setLocalEngineMode() {
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

      // Use local engine (default)
      if (game) {
        return await this.localEngine.getBestMove(game);
      }
    } catch (error) {
      console.error("AI engine error:", error);
      // Fallback to local engine
      if (game) {
        return await this.localEngine.getBestMove(game);
      }
    }
    return null;
  }
}

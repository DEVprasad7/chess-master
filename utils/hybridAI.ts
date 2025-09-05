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

// Enhanced Local Chess Engine with Bot614 optimizations
class LocalChessEngine {
  private pieceValues = { p: 100, n: 330, b: 400, r: 500, q: 900, k: 20000 };
  private transpositionTable = new Map<string, { score: number, depth: number, bestMove: string }>();
  private historyTable = new Map<string, number>();
  private maxTableSize = 70000;

  private evaluatePosition(game: ChessGame): number {
    let score = 0;
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = this.pieceValues[piece.type as keyof typeof this.pieceValues] || 0;
          score += piece.color === "w" ? -value : value;

          // Enhanced positional evaluation
          if (piece.type === "p") {
            score += piece.color === "b" ? (6 - i) * 10 : (i - 1) * 10;
          } else if (piece.type === "n" || piece.type === "b") {
            // Encourage piece development
            score += piece.color === "b" ? (i > 1 ? 20 : 0) : (i < 6 ? 20 : 0);
          }
        }
      }
    }

    if (game.isCheckmate()) {
      score += game.turn() === "w" ? 100000 : -100000;
    }

    return score;
  }

  private orderMoves(moves: string[]): string[] {
    return moves.sort((a, b) => {
      const aHistory = this.historyTable.get(a) || 0;
      const bHistory = this.historyTable.get(b) || 0;
      return bHistory - aHistory;
    });
  }

  private negamax(game: ChessGame, depth: number, alpha: number, beta: number): number {
    const fen = game.fen();
    const ttEntry = this.transpositionTable.get(fen);
    
    // Transposition table lookup
    if (ttEntry && ttEntry.depth >= depth) {
      return ttEntry.score;
    }
    
    if (depth === 0 || game.isGameOver()) {
      const score = this.evaluatePosition(game);
      this.updateTranspositionTable(fen, score, depth, "");
      return score;
    }
    
    const moves = this.orderMoves(game.moves());
    let bestScore = -Infinity;
    let bestMove = "";
    
    for (const move of moves) {
      try {
        game.move(move);
        const score = -this.negamax(game, depth - 1, -beta, -alpha);
        game.undo();
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, score);
        if (alpha >= beta) {
          // Update history table for move ordering
          this.historyTable.set(move, (this.historyTable.get(move) || 0) + depth * depth);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    this.updateTranspositionTable(fen, bestScore, depth, bestMove);
    return bestScore;
  }

  private updateTranspositionTable(fen: string, score: number, depth: number, bestMove: string): void {
    if (this.transpositionTable.size >= this.maxTableSize) {
      // Simple cleanup: remove 15% of entries
      const entries = Array.from(this.transpositionTable.entries());
      entries.slice(0, Math.floor(entries.length * 0.15)).forEach(([key]) => {
        this.transpositionTable.delete(key);
      });
    }
    this.transpositionTable.set(fen, { score, depth, bestMove });
  }

  async getBestMove(game: ChessGame): Promise<string> {
    const moves = game.moves();
    if (moves.length === 0) return "";
    
    // Check transposition table first
    const fen = game.fen();
    const ttEntry = this.transpositionTable.get(fen);
    if (ttEntry && ttEntry.bestMove && moves.includes(ttEntry.bestMove)) {
      return ttEntry.bestMove;
    }
    
    // Check for immediate checkmate
    for (const move of moves) {
      try {
        game.move(move);
        if (game.isCheckmate()) {
          game.undo();
          return move;
        }
        game.undo();
      } catch (error) {
        continue;
      }
    }
    
    // Iterative deepening search
    let bestMove = moves[0];
    const maxDepth = 7;
    const startTime = Date.now();
    const maxTime = 3000;
    
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() - startTime > maxTime) break;
      
      let bestScore = -Infinity;
      const orderedMoves = this.orderMoves(moves);
      
      for (const move of orderedMoves) {
        try {
          game.move(move);
          const score = -this.negamax(game, depth - 1, -Infinity, Infinity);
          game.undo();
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        } catch (error) {
          continue;
        }
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

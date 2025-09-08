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

class LocalChessEngine {
  private pieceValues = { p: 100, n: 330, b: 400, r: 500, q: 900, k: 20000 };

  // Piece-square tables (midgame; small ints for speed). Index [rank][file], rank 0 = white 8th rank
  private pst = {
    p: [
      [  0,  0,  0,  0,  0,  0,  0,  0],
      [ 50, 50, 50, 50, 50, 50, 50, 50],
      [ 10, 10, 20, 30, 30, 20, 10, 10],
      [  5,  5, 10, 25, 25, 10,  5,  5],
      [  0,  0,  0, 20, 20,  0,  0,  0],
      [  5, -5,-10,  0,  0,-10, -5,  5],
      [  5, 10, 10,-20,-20, 10, 10,  5],
      [  0,  0,  0,  0,  0,  0,  0,  0],
    ],
    n: [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-30,  5, 10, 20, 20, 10,  5,-30],
      [-30,  0, 20, 25, 25, 20,  0,-30],
      [-30,  5, 20, 25, 25, 20,  5,-30],
      [-30,  0, 10, 20, 20, 10,  0,-30],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50],
    ],
    b: [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,  5,  0,  0,  0,  0,  5,-10],
      [-10, 10, 10, 10, 10, 10, 10,-10],
      [-10,  0, 10, 10, 10, 10,  0,-10],
      [-10,  5,  5, 10, 10,  5,  5,-10],
      [-10,  0,  5, 10, 10,  5,  0,-10],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20],
    ],
    r: [
      [  0,  0,  0,  5,  5,  0,  0,  0],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [-5,  0,  0,  0,  0,  0,  0, -5],
      [  5, 10, 10, 10, 10, 10, 10,  5],
      [  0,  0,  0,  0,  0,  0,  0,  0],
    ],
    q: [
      [-20,-10,-10, -5, -5,-10,-10,-20],
      [-10,  0,  0,  0,  0,  0,  0,-10],
      [-10,  0,  5,  5,  5,  5,  0,-10],
      [ -5,  0,  5,  5,  5,  5,  0, -5],
      [  0,  0,  5,  5,  5,  5,  0, -5],
      [-10,  5,  5,  5,  5,  5,  0,-10],
      [-10,  0,  5,  0,  0,  0,  0,-10],
      [-20,-10,-10, -5, -5,-10,-10,-20],
    ],
    k: [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [ 20, 20,  0,  0,  0,  0, 20, 20],
      [ 20, 30, 10,  0,  0, 10, 30, 20],
    ],
  };

  // Transposition table keyed by zobrist (stringified BigInt), store bestMove for PV, score, depth, and node type.
  private transpositionTable = new Map<string, { score: number; depth: number; bestMove: string; flag: "EXACT" | "LOWER" | "UPPER" }>();
  private maxTableSize = 70000;

  // History and killer tables
  private historyTable = new Map<string, number>();
  private killerMoves: string[][] = Array.from({ length: 256 }, () => []); // two killers per ply

  // Zobrist random values: pieceKeyMap['wP'][squareIndex] etc. Generate once.
  private zobristPieceKeys: Map<string, bigint> = new Map();
  private zobristSideKey: bigint = 0n;
  private zobristInited = false;

  // Search control
  private startTime = 0;
  private maxTimeMs = 5000; // 5 seconds default; change if needed
  private nodesSearched = 0;
  private stopSearch = false;
  private maxDepthLimit = 20;

  constructor(maxTimeMs = 5000) {
    this.maxTimeMs = maxTimeMs;
    this.initZobrist();
  }

  // ---------- Zobrist initialization & key computation ----------
  private initZobrist() {
    if (this.zobristInited) return;
    const pieces = ["p","n","b","r","q","k"];
    const colors = ["w","b"];
    let seed = 1469598103934665603n; // arbitrary big seed
    const rand64 = () => {
      // simple xorshift-like - NOT crypto - fine for hash distribution
      seed ^= seed << 13n; seed ^= seed >> 7n; seed ^= seed << 17n;
      // mask to 64 bits
      return seed & ((1n << 64n) - 1n);
    };

    for (const c of colors) {
      for (const p of pieces) {
        for (let sq = 0; sq < 64; sq++) {
          const key = `${c}${p}${sq}`;
          this.zobristPieceKeys.set(key, rand64());
        }
      }
    }
    this.zobristSideKey = rand64();
    this.zobristInited = true;
  }

  // Compute Zobrist key by iterating board() — since we only have board(), this is robust.
  private computeZobristKey(board: any[][], sideToMove: "w" | "b"): string {
    let h = 0n;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (!piece) continue;
        const key = `${piece.color}${piece.type}${r * 8 + f}`;
        const v = this.zobristPieceKeys.get(key);
        if (v) h ^= v;
      }
    }
    if (sideToMove === "w") {
      h ^= this.zobristSideKey;
    }
    // Stringify BigInt for Map key
    return h.toString();
  }

  // ---------- Utility helpers ----------
  private isCaptureMove(move: string, boardBefore: any[][]): boolean {
    // try to parse destination square (last [a-h][1-8] occurrence)
    const destMatch = move.match(/([a-h][1-8])(?!.*[a-h][1-8])/);
    if (!destMatch) {
      // if no square found, fallback to seeing if 'x' present or promotion capture like exd5
      return move.includes("x");
    }
    const dest = destMatch[1];
    const file = dest.charCodeAt(0) - 97; // a->0
    const rank = 8 - parseInt(dest[1]); // convert '1' -> rank 7 (board[7][file] is white 1)
    if (rank < 0 || rank > 7 || file < 0 || file > 7) return move.includes("x");
    const pieceOnDest = boardBefore[rank][file];
    return !!(pieceOnDest && !move.startsWith(this.getPieceChar(pieceOnDest)));
  }

  private getPieceChar(piece: any): string {
    // returns piece letter used in SAN, e.g., 'N' for knight for move parsing heuristics.
    if (!piece) return "";
    const m: Record<string,string> = { p: "", n: "N", b: "B", r: "R", q: "Q", k: "K" };
    return m[piece.type] || "";
  }

  private extractDestSquare(move: string): { r: number, f: number } | null {
    const destMatch = move.match(/([a-h][1-8])(?!.*[a-h][1-8])/);
    if (!destMatch) return null;
    const dest = destMatch[1];
    const f = dest.charCodeAt(0) - 97;
    const r = 8 - parseInt(dest[1]);
    return { r, f };
  }

  private pieceValueByChar(type: string): number {
    return this.pieceValues[type as keyof typeof this.pieceValues] || 0;
  }

  // ---------- Evaluation ----------
  private evaluatePosition(game: ChessGame): number {
    let score = 0;
    const board = game.board();

    // Material + PST
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (!piece) continue;
        const base = this.pieceValueByChar(piece.type);
        const pstTab = (this.pst as any)[piece.type];
        // PST arrays assume rank 0 is black's back rank; we want symmetric usage:
        const pstRankIndex = piece.color === "w" ? 7 - r : r;
        const pstBonus = pstTab ? pstTab[pstRankIndex][f] : 0;
        const pieceScore = base + pstBonus;
        score += piece.color === "w" ? -pieceScore : pieceScore;
      }
    }

    // Bishop pair bonus + simple pawn structure (connected pawns) & king shield
    const materialCount: Record<string, number> = { wB: 0, bB: 0 };
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p) continue;
        if (p.type === "b") {
          if (p.color === "w") materialCount.wB++;
          else materialCount.bB++;
        }
      }
    }
    if (materialCount.wB >= 2) score -= 40; // white bishop pair bonus
    if (materialCount.bB >= 2) score += 40; // black bishop pair bonus

    // Simple king safety: penalize missing pawn shield in front of king
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.type !== "k") continue;
        const shieldRow = p.color === "w" ? r + 1 : r - 1;
        let shield = 0;
        if (shieldRow >= 0 && shieldRow < 8) {
          for (let df of [-1, 0, 1]) {
            const ff = f + df;
            if (ff >= 0 && ff < 8) {
              const s = board[shieldRow][ff];
              if (s && s.type === "p" && s.color === p.color) shield++;
            }
          }
        }
        score += p.color === "w" ? -shield * 10 : shield * 10;
      }
    }

    // Checkmate / terminal
    if (game.isCheckmate()) {
      // If it's white to move and checkmate, that's bad for white: big negative from white's perspective
      score += game.turn() === "w" ? 100000 : -100000;
    }

    return score;
  }

  // ---------- Quiescence search (captures & checks) ----------
  private quiescence(game: ChessGame, alpha: number, beta: number): number {
    this.nodesSearched++;
    if ((this.nodesSearched & 255) === 0 && Date.now() - this.startTime > this.maxTimeMs) {
      this.stopSearch = true;
    }
    if (this.stopSearch) return alpha;

    const stand = this.evaluatePosition(game);
    if (stand >= beta) return beta;
    if (alpha < stand) alpha = stand;

    const boardBefore = game.board();
    const moves = game.moves();
    // consider only captures or checks (we heuristically check 'x' or presence of capture destination)
    const captureMoves = moves.filter(m => this.isCaptureMove(m, boardBefore) || m.includes("+") || m.includes("#"));
    // sort captures by MVV-LVA (victim value descending, attacker ascending) quickly
    captureMoves.sort((a, b) => {
      const va = this.mvvLvaScore(a, boardBefore);
      const vb = this.mvvLvaScore(b, boardBefore);
      return vb - va;
    });

    for (const move of captureMoves) {
      if (this.stopSearch) break;
      try {
        game.move(move);
        const score = -this.quiescence(game, -beta, -alpha);
        game.undo();

        if (this.stopSearch) break;
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      } catch (e) {
        // ignore illegal move errors
      }
    }
    return alpha;
  }

  private mvvLvaScore(move: string, boardBefore: any[][]): number {
    // victim value * 100 - attacker value to ensure victims prioritized, lower attacker value preferred
    const dest = this.extractDestSquare(move);
    if (!dest) return 0;
    const victim = boardBefore[dest.r][dest.f];
    // attacker is hard to infer reliably; fallback: if SAN contains piece letter at start use that
    let attackerType = "p";
    const pieceLetterMatch = move.match(/^[NBRQK]/);
    if (pieceLetterMatch) {
      const map: any = { N: "n", B: "b", R: "r", Q: "q", K: "k" };
      attackerType = map[pieceLetterMatch[0]] || "p";
    } else {
      // pawn capture like exd5
      attackerType = "p";
    }
    const victimVal = victim ? this.pieceValueByChar(victim.type) : 0;
    const attackerVal = this.pieceValueByChar(attackerType);
    return victimVal * 100 - attackerVal;
  }

  // ---------- Move ordering ----------
  private orderMoves(moves: string[], ply: number, boardBefore: any[][], ttMove?: string): string[] {
    // Score each move:
    // 1) hash move (ttMove) highest
    // 2) captures by MVV-LVA
    // 3) killer moves
    // 4) history heuristic
    const scores = new Map<string, number>();
    for (const m of moves) scores.set(m, 0);
    if (ttMove && scores.has(ttMove)) scores.set(ttMove, 1000000);

    // captures
    for (const m of moves) {
      if (this.isCaptureMove(m, boardBefore)) {
        scores.set(m, (scores.get(m) || 0) + this.mvvLvaScore(m, boardBefore) + 50000);
      }
    }

    // killer moves
    const killers = this.killerMoves[ply] || [];
    for (let i = 0; i < killers.length; i++) {
      const km = killers[i];
      if (km && scores.has(km)) scores.set(km, (scores.get(km) || 0) + 30000 - i * 100);
    }

    // history table
    for (const m of moves) {
      const h = this.historyTable.get(m) || 0;
      if (h !== 0) scores.set(m, (scores.get(m) || 0) + h);
    }

    // Final sort descending
    return moves.slice().sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
  }

  // ---------- Negamax with alpha-beta, LMR, TT, killer, time checks ----------
  private negamax(game: ChessGame, depth: number, alpha: number, beta: number, ply: number): number {
    this.nodesSearched++;
    if ((this.nodesSearched & 255) === 0 && Date.now() - this.startTime > this.maxTimeMs) {
      this.stopSearch = true;
    }
    if (this.stopSearch) return alpha;

    const boardBefore = game.board();
    const sideToMove = game.turn() as "w" | "b";
    const zobKey = this.computeZobristKey(boardBefore, sideToMove);
    const ttEntry = this.transpositionTable.get(zobKey);
    if (ttEntry && ttEntry.depth >= depth) {
      // use TT entry respecting flags
      if (ttEntry.flag === "EXACT") return ttEntry.score;
      if (ttEntry.flag === "LOWER") alpha = Math.max(alpha, ttEntry.score);
      if (ttEntry.flag === "UPPER") beta = Math.min(beta, ttEntry.score);
      if (alpha >= beta) return ttEntry.score;
    }

    if (depth === 0 || game.isGameOver()) {
      // call quiescence at leaf
      const q = this.quiescence(game, alpha, beta);
      return q;
    }

    let moves = game.moves();
    if (moves.length === 0) {
      return this.evaluatePosition(game);
    }

    // order moves using TT bestmove if present
    const ttBest = ttEntry?.bestMove;
    moves = this.orderMoves(moves, ply, boardBefore, ttBest);

    let bestScore = -Infinity;
    let bestMove = "";
    let moveCount = 0;

    for (const move of moves) {
      if (this.stopSearch) break;
      moveCount++;

      try {
        // Late Move Reduction: for quiet moves after a few moves, reduce depth
        const isCapture = this.isCaptureMove(move, boardBefore);
        const isKiller = (this.killerMoves[ply] || []).includes(move);
        let newDepth = depth - 1;
        let reduced = false;
        if (!isCapture && !isKiller && depth >= 3 && moveCount > 3) {
          // apply a small reduction
          newDepth = depth - 2;
          reduced = true;
        }

        game.move(move);
        // principal variation search: first try a reduced / narrow search
        let score = -this.negamax(game, newDepth, -beta, -alpha, ply + 1);
        // If we reduced and score improves beyond alpha, re-search at full depth
        if (reduced && !this.stopSearch && score > alpha) {
          score = -this.negamax(game, depth - 1, -beta, -alpha, ply + 1);
        }
        game.undo();

        if (this.stopSearch) break;
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }

        alpha = Math.max(alpha, score);
        if (alpha >= beta) {
          // beta cutoff -> update history & killer (if non-capture)
          if (!isCapture) {
            // insert killer move (keep up to 2)
            const km = this.killerMoves[ply];
            if (km[0] !== move) {
              km.splice(1, 0, move); // insert at position 1 (so preference for earlier)
              if (km.length > 2) km.length = 2;
              this.killerMoves[ply] = km;
            }
            // update history (stronger weight for deeper cutoffs)
            this.historyTable.set(move, (this.historyTable.get(move) || 0) + depth * depth);
          }
          // store upper bound in TT
          this.storeTT(zobKey, alpha, depth, move, "LOWER");
          return alpha;
        }
      } catch (e) {
        // ignore illegal move errors
      }
    }

    // store exact or upper bound
    if (bestScore <= alpha) {
      this.storeTT(zobKey, bestScore, depth, bestMove, "UPPER");
    } else {
      this.storeTT(zobKey, bestScore, depth, bestMove, "EXACT");
    }
    return bestScore;
  }

  private storeTT(key: string, score: number, depth: number, bestMove: string, flag: "EXACT"|"LOWER"|"UPPER") {
    // simple replacement: prefer deeper entries; limited size cleanup
    if (this.transpositionTable.size >= this.maxTableSize) {
      // remove small fraction of lowest-depth entries (quick heuristic)
      const entries = Array.from(this.transpositionTable.entries());
      entries.sort((a, b) => a[1].depth - b[1].depth);
      const removeCount = Math.max(1, Math.floor(entries.length * 0.05)); // 5%
      for (let i = 0; i < removeCount; i++) this.transpositionTable.delete(entries[i][0]);
    }
    this.transpositionTable.set(key, { score, depth, bestMove, flag });
  }

  // ---------- Public API: getBestMove with iterative deepening & time control ----------
  async getBestMove(game: ChessGame): Promise<string> {
    const moves = game.moves();
    if (moves.length === 0) return "";

    // Quick TT probe from current position
    const zobKey = this.computeZobristKey(game.board(), game.turn() as "w"|"b");
    const ttEntry = this.transpositionTable.get(zobKey);
    if (ttEntry && ttEntry.bestMove && moves.includes(ttEntry.bestMove)) {
      return ttEntry.bestMove;
    }

    // immediate checkmate detection (fast)
    for (const m of moves) {
      try {
        game.move(m);
        if (game.isCheckmate()) {
          game.undo();
          return m;
        }
        game.undo();
      } catch {}
    }

    let bestMove = moves[0];
    this.startTime = Date.now();
    this.stopSearch = false;
    this.nodesSearched = 0;

    // Iterative deepening
    for (let depth = 1; depth <= this.maxDepthLimit; depth++) {
      if (Date.now() - this.startTime > this.maxTimeMs) break;
      this.stopSearch = false;
      let alpha = -Infinity;
      let beta = Infinity;
      // Use aspiration window around previous score could be added; for simplicity use full window here.
      let bestScore = -Infinity;

      // order root moves using history/tt
      const boardBefore = game.board();
      const rootTT = this.transpositionTable.get(this.computeZobristKey(boardBefore, game.turn() as "w"|"b"));
      let orderedRootMoves = this.orderMoves(moves, 0, boardBefore, rootTT?.bestMove);

      for (const move of orderedRootMoves) {
        if (Date.now() - this.startTime > this.maxTimeMs) {
          this.stopSearch = true;
          break;
        }
        try {
          game.move(move);
          const score = -this.negamax(game, depth - 1, -Infinity, Infinity, 1);
          game.undo();

          if (this.stopSearch) break;
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        } catch {}
      }

      // If time left, accept this depth and continue; else break and return best move found so far
      if (Date.now() - this.startTime > this.maxTimeMs) break;
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

interface AIConfig {
  apiKey: string
  modelName: string
}

// Enhanced Local Chess Engine
class LocalChessEngine {
  private pieceValues = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 }
  private positionCache = new Map<string, number>()
  private killerMoves = new Map<number, string[]>()
  private historyTable = new Map<string, number>()
  private transpositionTable = new Map<string, {score: number, depth: number, flag: string}>()
  
  // Piece-square tables for positional evaluation
  private pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ]
  
  private knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]

  private evaluatePosition(game: any): number {
    const fen = game.fen().split(' ')[0]
    if (this.positionCache.has(fen)) {
      return this.positionCache.get(fen)!
    }
    
    let score = 0
    const board = game.board()
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if (piece) {
          const value = this.pieceValues[piece.type as keyof typeof this.pieceValues] || 0
          const isWhite = piece.color === 'w'
          
          // Material value
          score += isWhite ? -value : value
          
          // Positional bonuses
          let posBonus = 0
          const row = isWhite ? 7 - i : i
          
          if (piece.type === 'p') {
            posBonus = this.pawnTable[row][j]
          } else if (piece.type === 'n') {
            posBonus = this.knightTable[row][j]
          } else if (piece.type === 'b' || piece.type === 'q') {
            // Bishops and queens prefer center
            posBonus = (3 - Math.abs(3.5 - j)) * 5 + (3 - Math.abs(3.5 - i)) * 5
          } else if (piece.type === 'k') {
            // King safety in opening/middlegame
            if (this.isEndgame(board)) {
              posBonus = (3 - Math.abs(3.5 - j)) * 10 + (3 - Math.abs(3.5 - i)) * 10
            } else {
              posBonus = isWhite ? (i > 5 ? 20 : -30) : (i < 2 ? 20 : -30)
            }
          }
          
          score += isWhite ? -posBonus : posBonus
        }
      }
    }
    
    // Game state bonuses
    if (game.isCheckmate()) {
      score += game.turn() === 'w' ? 100000 : -100000
    } else if (game.isCheck()) {
      score += game.turn() === 'w' ? -50 : 50
    }
    
    // Mobility bonus (more moves = better position)
    const mobility = game.moves().length
    score += game.turn() === 'b' ? mobility * 2 : -mobility * 2
    
    // King safety bonus
    if (!this.isEndgame(board)) {
      score += this.evaluateKingSafety(board)
    }
    
    this.positionCache.set(fen, score)
    return score
  }
  
  private isEndgame(board: any[][]): boolean {
    let pieceCount = 0
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] && board[i][j].type !== 'k' && board[i][j].type !== 'p') {
          pieceCount++
        }
      }
    }
    return pieceCount <= 6
  }
  
  private evaluateKingSafety(board: any[][]): number {
    let safety = 0
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if (piece && piece.type === 'k') {
          // Penalty for exposed king
          const isWhite = piece.color === 'w'
          const kingRow = isWhite ? i : 7 - i
          
          if (kingRow < 2) { // King on back ranks is safer
            safety += isWhite ? 30 : -30
          }
          
          // Check pawn shield
          let pawnShield = 0
          for (let col = Math.max(0, j-1); col <= Math.min(7, j+1); col++) {
            const frontRow = isWhite ? i-1 : i+1
            if (frontRow >= 0 && frontRow < 8 && board[frontRow][col] && 
                board[frontRow][col].type === 'p' && board[frontRow][col].color === piece.color) {
              pawnShield++
            }
          }
          safety += isWhite ? pawnShield * 10 : -pawnShield * 10
        }
      }
    }
    
    return safety
  }
  
  private minimax(game: any, depth: number, alpha: number, beta: number, maximizing: boolean, ply: number = 0): number {
    const fen = game.fen().split(' ')[0]
    const ttEntry = this.transpositionTable.get(fen)
    
    // Transposition table lookup
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'exact') return ttEntry.score
      if (ttEntry.flag === 'lowerbound' && ttEntry.score >= beta) return ttEntry.score
      if (ttEntry.flag === 'upperbound' && ttEntry.score <= alpha) return ttEntry.score
    }
    
    if (depth === 0 || game.isGameOver()) {
      return this.quiescenceSearch(game, alpha, beta, maximizing, 3)
    }
    
    // Light null move pruning (only depth 2+)
    if (depth >= 2 && !game.isCheck() && ply > 0) {
      const nullScore = -this.minimax(game, depth - 2, -beta, -beta + 1, !maximizing, ply + 1)
      if (nullScore >= beta) {
        return nullScore
      }
    }
    
    const moves = this.orderMoves(game, game.moves(), ply)
    let bestMove = ''
    
    if (maximizing) {
      let maxEval = -Infinity
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        game.move(move)
        
        let evaluation
        // Light LMR - only for non-critical moves
        if (i >= 3 && depth >= 2 && !move.includes('x') && !game.isCheck()) {
          evaluation = this.minimax(game, depth - 2, alpha, beta, false, ply + 1)
          if (evaluation > alpha) {
            evaluation = this.minimax(game, depth - 1, alpha, beta, false, ply + 1)
          }
        } else {
          evaluation = this.minimax(game, depth - 1, alpha, beta, false, ply + 1)
        }
        
        game.undo()
        
        if (evaluation > maxEval) {
          maxEval = evaluation
          bestMove = move
        }
        
        alpha = Math.max(alpha, evaluation)
        if (beta <= alpha) {
          this.updateKillerMoves(ply, move)
          this.updateHistory(move, depth)
          break
        }
      }
      
      // Store in transposition table
      const flag = maxEval <= alpha ? 'upperbound' : maxEval >= beta ? 'lowerbound' : 'exact'
      this.transpositionTable.set(fen, {score: maxEval, depth, flag})
      
      return maxEval
    } else {
      let minEval = Infinity
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        game.move(move)
        
        let evaluation
        if (i >= 3 && depth >= 2 && !move.includes('x') && !game.isCheck()) {
          evaluation = this.minimax(game, depth - 2, alpha, beta, true, ply + 1)
          if (evaluation < beta) {
            evaluation = this.minimax(game, depth - 1, alpha, beta, true, ply + 1)
          }
        } else {
          evaluation = this.minimax(game, depth - 1, alpha, beta, true, ply + 1)
        }
        
        game.undo()
        
        if (evaluation < minEval) {
          minEval = evaluation
          bestMove = move
        }
        
        beta = Math.min(beta, evaluation)
        if (beta <= alpha) {
          this.updateKillerMoves(ply, move)
          this.updateHistory(move, depth)
          break
        }
      }
      
      // Store in transposition table
      const flag = minEval >= beta ? 'lowerbound' : minEval <= alpha ? 'upperbound' : 'exact'
      this.transpositionTable.set(fen, {score: minEval, depth, flag})
      
      return minEval
    }
  }
  
  private quiescenceSearch(game: any, alpha: number, beta: number, maximizing: boolean, depth: number): number {
    const standPat = this.evaluatePosition(game)
    
    if (depth === 0) return standPat
    
    if (maximizing) {
      if (standPat >= beta) return beta
      alpha = Math.max(alpha, standPat)
    } else {
      if (standPat <= alpha) return alpha
      beta = Math.min(beta, standPat)
    }
    
    // Only search best 3 captures for speed
    const captures = game.moves().filter((move: string) => move.includes('x')).slice(0, 3)
    
    for (const move of captures) {
      game.move(move)
      const score = this.quiescenceSearch(game, alpha, beta, !maximizing, depth - 1)
      game.undo()
      
      if (maximizing) {
        alpha = Math.max(alpha, score)
        if (alpha >= beta) break
      } else {
        beta = Math.min(beta, score)
        if (beta <= alpha) break
      }
    }
    
    return maximizing ? alpha : beta
  }
  
  private givesCheck(game: any, move: string): boolean {
    game.move(move)
    const isCheck = game.isCheck()
    game.undo()
    return isCheck
  }
  
  private updateKillerMoves(ply: number, move: string): void {
    const killers = this.killerMoves.get(ply) || []
    if (!killers.includes(move)) {
      killers.unshift(move)
      if (killers.length > 2) killers.pop()
      this.killerMoves.set(ply, killers)
    }
  }
  
  private updateHistory(move: string, depth: number): void {
    const current = this.historyTable.get(move) || 0
    this.historyTable.set(move, current + depth * depth)
  }
  
  async getBestMove(game: any): Promise<string> {
    const moves = game.moves()
    if (moves.length === 0) return ''
    
    // Immediate tactical checks
    for (const move of moves) {
      game.move(move)
      if (game.isCheckmate()) {
        game.undo()
        return move
      }
      game.undo()
    }
    
    // Opening book (first 3 moves)
    const moveCount = game.history().length
    if (moveCount < 6) {
      const openingMove = this.getOpeningMove(game)
      if (openingMove && moves.includes(openingMove)) {
        return openingMove
      }
    }
    
    // Move ordering for better alpha-beta pruning
    let orderedMoves = this.orderMoves(game, moves)
    
    let bestMove = orderedMoves[0]
    let bestScore = -Infinity
    
    // Adaptive depth for balance of speed and strength
    const depth = moves.length > 35 ? 1 : 2 // Max depth 2
    this.killerMoves.clear()
    
    for (const move of orderedMoves) {
      game.move(move)
      const score = this.minimax(game, depth, -Infinity, Infinity, false, 0)
      game.undo()
      
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }
    
    // Memory management
    if (this.positionCache.size > 1000) {
      this.positionCache.clear()
    }
    if (this.historyTable.size > 10000) {
      this.historyTable.clear()
    }
    if (this.transpositionTable.size > 5000) {
      this.transpositionTable.clear()
    }
    
    return bestMove
  }
  
  private getOpeningMove(game: any): string | null {
    const history = game.history()
    const moveCount = history.length
    const moves = game.moves()
    
    // Enhanced opening book
    if (moveCount === 0) {
      return Math.random() > 0.5 ? 'e4' : 'd4'
    }
    if (moveCount === 1) {
      const lastMove = history[0]
      if (lastMove === 'e4') {
        const responses = ['e5', 'c5', 'e6', 'c6'].filter(m => moves.includes(m))
        return responses[Math.floor(Math.random() * responses.length)] || null
      }
      if (lastMove === 'd4') {
        const responses = ['d5', 'Nf6', 'f5', 'c6'].filter(m => moves.includes(m))
        return responses[Math.floor(Math.random() * responses.length)] || null
      }
    }
    if (moveCount < 6) {
      // Prioritize development
      const devMoves = moves.filter((move: string) => 
        move.includes('N') || move.includes('B') || move === 'O-O'
      )
      if (devMoves.length > 0) {
        return devMoves[Math.floor(Math.random() * devMoves.length)]
      }
    }
    
    return null
  }
  
  private orderMoves(game: any, moves: string[], depth: number = 0): string[] {
    const scored = moves.map(move => {
      let score = 0
      
      // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      if (move.includes('x')) {
        const captured = this.getCapturedPiece(game, move)
        const attacker = this.getMovingPiece(game, move)
        score += (captured * 10) - attacker + 1000
      }
      
      // Killer moves heuristic
      const killers = this.killerMoves.get(depth) || []
      if (killers.includes(move)) score += 900
      
      // History heuristic
      score += this.historyTable.get(move) || 0
      
      // Light tactical bonuses
      game.move(move)
      if (game.isCheck()) score += 500
      if (this.createsFork(game)) score += 200 // Simplified fork detection
      game.undo()
      
      // Positional bonuses
      if (move.includes('e4') || move.includes('e5') || move.includes('d4') || move.includes('d5')) {
        score += 50
      }
      if (move.includes('O-O')) score += 100 // Castling
      
      return { move, score }
    })
    
    return scored.sort((a, b) => b.score - a.score).map(item => item.move)
  }
  
  private getCapturedPiece(game: any, move: string): number {
    const to = move.slice(-2)
    const piece = game.get(to)
    return piece ? this.pieceValues[piece.type as keyof typeof this.pieceValues] || 0 : 0
  }
  
  private getMovingPiece(game: any, move: string): number {
    const from = move.length > 3 ? move.slice(0, 2) : move.slice(0, 2)
    const piece = game.get(from)
    return piece ? this.pieceValues[piece.type as keyof typeof this.pieceValues] || 0 : 0
  }
  
  private createsFork(game: any): boolean {
    // Super fast fork detection - just count available captures
    const captures = game.moves().filter((m: string) => m.includes('x'))
    return captures.length >= 2
  }
  
  private createsPin(game: any): boolean {
    // Simplified pin detection - check if opponent has limited moves
    return game.moves().length < 10
  }
}

class CustomAIEngine {
  constructor(private config: AIConfig) {}

  async getBestMove(fen: string, moveHistory: string[], legalMoves: string[]): Promise<string | null> {
    try {
      const response = await fetch('/api/custom-ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          moveHistory,
          legalMoves,
          config: this.config
        })
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.move?.trim() || null
    } catch (error) {
      console.error('Custom AI error:', error)
      return null
    }
  }
}

export class HybridAI {
  private localEngine = new LocalChessEngine()
  private customAI: CustomAIEngine | null = null
  private useCustomAI = false

  setStockfishMode() {
    this.useCustomAI = false
  }

  setCustomAIMode(config: AIConfig) {
    this.useCustomAI = true
    this.customAI = new CustomAIEngine(config)
  }

  async getBestMove(fen: string, moveHistory: string[], legalMoves: string[], game?: any): Promise<string | null> {
    // Always use local engine for Stockfish mode (faster)
    if (!this.useCustomAI && game) {
      return await this.localEngine.getBestMove(game)
    }
    
    // Custom AI fallback
    try {
      if (this.useCustomAI && this.customAI) {
        const move = await this.customAI.getBestMove(fen, moveHistory, legalMoves)
        if (move && legalMoves.includes(move.trim())) {
          return move.trim()
        }
      }
      
      // Fallback to local engine
      if (game) {
        return await this.localEngine.getBestMove(game)
      }
    } catch (error) {
      console.error('AI engine error:', error)
      if (game) {
        return await this.localEngine.getBestMove(game)
      }
    }
    return null
  }
}
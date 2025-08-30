"use client"

import { useState, useEffect, memo } from "react"
import { ChessGame, useChessGameContext } from "@react-chess-tools/react-chess-game"
import { HybridAI } from "@/utils/hybridAI"

const hybridAI = new HybridAI()

const GameContent = memo(function GameContent({ isAIThinking }: { isAIThinking: boolean }) {
  const { info } = useChessGameContext()
  
  const isDisabled = info.turn === 'b' || isAIThinking || info.isGameOver
  
  return (
    <div className={`transition-all duration-200 ${
      isDisabled 
        ? 'opacity-60 pointer-events-none' 
        : 'opacity-100 pointer-events-auto'
    }`}>
      <ChessGame.Board />
    </div>
  )
})

function AIGameLayout() {
  const { info, game, methods } = useChessGameContext()
  const [isAIThinking, setIsAIThinking] = useState(false)

  
  const humanWon = info.isCheckmate && info.turn === 'b' // Human is white, AI is black
  const aiWon = info.isCheckmate && info.turn === 'w'
  
  // Optimized AI move logic
  useEffect(() => {
    if (info.turn !== 'b' || info.isGameOver || isAIThinking) return
    
    const makeAIMove = async () => {
      setIsAIThinking(true)
      
      try {
        const possibleMoves = game.moves()
        if (possibleMoves.length === 0) {
          setIsAIThinking(false)
          return
        }
        
        // Get AI move with shorter timeout
        const aiMove = await Promise.race([
          hybridAI.getBestMove(game.fen(), game.history(), possibleMoves, game),
          new Promise(resolve => setTimeout(() => resolve(null), 3000)) // 3s timeout
        ])
        
        // Quick move validation and execution
        const moveToPlay = (aiMove && typeof aiMove === 'string' && possibleMoves.includes(aiMove.trim())) 
          ? (aiMove as string).trim() 
          : possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        
        // Reduced delay for better responsiveness
        setTimeout(() => {
          try {
            methods.makeMove(moveToPlay)
          } catch (error) {
            console.error('Move failed:', error)
            // Single fallback
            const fallbackMove = possibleMoves[0]
            methods.makeMove(fallbackMove)
          }
          setIsAIThinking(false)
        }, 800) // Reduced from 1500ms to 800ms
        
      } catch (error) {
        console.error('AI error:', error)
        // Quick fallback
        setTimeout(() => {
          const possibleMoves = game.moves()
          if (possibleMoves.length > 0) {
            methods.makeMove(possibleMoves[0])
          }
          setIsAIThinking(false)
        }, 500)
      }
    }
    
    makeAIMove()
  }, [info.turn, info.isGameOver, game, methods, isAIThinking])
  
  return (
    <>
      <div className="flex items-center justify-center gap-8 mb-8">
        {/* Human Player (Left) */}
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80 transition-all ${
          humanWon 
            ? 'ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse' 
            : info.turn === 'w' && !info.isGameOver 
            ? 'ring-2 ring-green-400' 
            : ''
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Human Player
            </h3>
            <p className="text-gray-600 dark:text-gray-300 opacity-70 mb-2">
              White Pieces
            </p>
            {humanWon && (
              <div className="text-green-500 font-bold text-lg animate-bounce">
                You Won! 🏆
              </div>
            )}
            {info.turn === 'w' && !info.isGameOver && (
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
        </div>

        {/* Chess Game (Middle) */}
        <div className="w-[400px] h-[400px] flex-shrink-0">
          <GameContent isAIThinking={isAIThinking} />
        </div>

        {/* AI Player (Right) */}
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80 transition-all ${
          aiWon 
            ? 'ring-4 ring-red-400 shadow-red-400/50 shadow-2xl animate-pulse' 
            : info.turn === 'b' && !info.isGameOver 
            ? 'ring-2 ring-red-400' 
            : ''
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              AI Opponent
            </h3>
            <p className="text-gray-600 dark:text-gray-300 opacity-70 mb-2">
              Black Pieces
            </p>
            {aiWon && (
              <div className="text-red-500 font-bold text-lg animate-bounce">
                AI Wins! 🤖
              </div>
            )}
            {(info.turn === 'b' || isAIThinking) && !info.isGameOver && (
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
            {(info.turn === 'b' || isAIThinking) && !info.isGameOver && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                AI is thinking...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Game Status */}
      {(info.isCheckmate || info.isStalemate || info.isDraw || info.isCheck) && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className={`rounded-lg p-4 text-center font-semibold ${
            info.isCheckmate 
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : info.isCheck
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}>
            {info.isCheckmate && `Checkmate! ${info.turn === 'w' ? 'AI' : 'Human'} wins!`}
            {info.isStalemate && 'Stalemate! Game is a draw.'}
            {info.isDraw && 'Draw!'}
            {info.isCheck && !info.isCheckmate && `${info.turn === 'w' ? 'Human' : 'AI'} is in check!`}
          </div>
          
          {info.isGameOver && (
            <div className="text-center mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                New AI Game 🤖
              </button>
            </div>
          )}
        </div>
      )}
      
      <MoveHistory />
    </>
  )
}

function MoveHistory() {
  const { game } = useChessGameContext()
  const moves = game.history()
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Move History
        </h3>
        <div className="max-h-32 overflow-y-auto">
          {moves.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
              No moves yet. Human plays first as White.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {moves.map((move, index) => (
                <div key={index} className={`p-2 rounded ${
                  index % 2 === 0 
                    ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100' 
                    : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
                }`}>
                  <span className="font-mono">
                    {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move}
                  </span>
                  <span className="text-xs ml-2 opacity-70">
                    {index % 2 === 0 ? '(Human)' : '(AI)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AIGamePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initialize AI mode
    const mode = localStorage.getItem('aiMode')
    if (mode === 'stockfish') {
      hybridAI.setStockfishMode()
    } else if (mode === 'custom') {
      const config = JSON.parse(localStorage.getItem('aiConfig') || '{}')
      hybridAI.setCustomAIMode(config)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Human vs AI Chess
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Challenge our AI opponent
          </p>
        </div>
        
        {mounted ? (
          <ChessGame.Root>
            <AIGameLayout />
          </ChessGame.Root>
        ) : (
          <>
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80">
                <div className="text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Human Player</h3>
                  <p className="text-gray-600 dark:text-gray-300 opacity-70">White Pieces</p>
                </div>
              </div>
              <div className="w-[400px] h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI Opponent</h3>
                  <p className="text-gray-600 dark:text-gray-300 opacity-70">Black Pieces</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
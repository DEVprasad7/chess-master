"use client"

import { useState, useEffect } from "react"
import { ChessGame, useChessGameContext } from "@react-chess-tools/react-chess-game"

function GameContent() {
  return (
    <ChessGame.Board />
  )
}

function GameLayout() {
  const { info } = useChessGameContext()
  
  const whiteWon = info.isCheckmate && info.turn === 'b'
  const blackWon = info.isCheckmate && info.turn === 'w'
  
  return (
    <>
      <div className="flex items-center justify-center gap-8 mb-8">
        {/* Player 1 */}
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80 transition-all ${
          whiteWon 
            ? 'ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse' 
            : info.turn === 'w' && !info.isGameOver 
            ? 'ring-2 ring-green-400' 
            : ''
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">♔</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Player 1
            </h3>
            <p className="text-gray-600 dark:text-gray-300 opacity-70 mb-2">
              White Pieces
            </p>
            {whiteWon && (
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

        {/* Chess Game */}
        <div className="w-[400px] h-[400px] flex-shrink-0">
          <GameContent />
        </div>

        {/* Player 2 */}
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80 transition-all ${
          blackWon 
            ? 'ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse' 
            : info.turn === 'b' && !info.isGameOver 
            ? 'ring-2 ring-green-400' 
            : ''
        }`}>
          <div className="text-center">
            <div className="text-4xl mb-4">♚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Player 2
            </h3>
            <p className="text-gray-600 dark:text-gray-300 opacity-70 mb-2">
              Black Pieces
            </p>
            {blackWon && (
              <div className="text-green-500 font-bold text-lg animate-bounce">
                You Won! 🏆
              </div>
            )}
            {info.turn === 'b' && !info.isGameOver && (
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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
            {info.isCheckmate && `Checkmate! ${info.turn === 'w' ? 'Black' : 'White'} wins!`}
            {info.isStalemate && 'Stalemate! Game is a draw.'}
            {info.isDraw && 'Draw!'}
            {info.isCheck && !info.isCheckmate && `${info.turn === 'w' ? 'White' : 'Black'} is in check!`}
          </div>
          
          {info.isGameOver && (
            <div className="text-center mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                New Game 🎮
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
              No moves yet. White to play first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {moves.map((move, index) => (
                <div key={index} className={`p-2 rounded ${
                  index % 2 === 0 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                }`}>
                  <span className="font-mono">
                    {Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'} {move}
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

export default function GamePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {mounted ? (
          <ChessGame.Root>
            <GameLayout />
          </ChessGame.Root>
        ) : (
          <>
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80">
                <div className="text-center">
                  <div className="text-4xl mb-4">♔</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Player 1</h3>
                  <p className="text-gray-600 dark:text-gray-300 opacity-70">White Pieces</p>
                </div>
              </div>
              <div className="w-[400px] h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-80">
                <div className="text-center">
                  <div className="text-4xl mb-4">♚</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Player 2</h3>
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
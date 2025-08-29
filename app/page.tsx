"use client"

import { useState } from "react"
import { AISelectionModal } from "@/components/ai-selection-modal"

export default function Home() {
  const [showAIModal, setShowAIModal] = useState(false)

  const handleAIGameClick = () => {
    setShowAIModal(true)
  }

  const handleStockfishSelect = () => {
    localStorage.setItem('aiMode', 'stockfish')
    window.location.href = '/ai-game'
  }

  const handleCustomAISelect = (config: {apiKey: string, modelName: string}) => {
    localStorage.setItem('aiMode', 'custom')
    localStorage.setItem('aiConfig', JSON.stringify(config))
    window.location.href = '/ai-game'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-6 lg:py-8">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to ChessMaster
          </h1>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-300">
            Choose your game mode
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Human vs Human */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 lg:p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">👥</div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Human vs Human
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-4">
                Play against a friend locally
              </p>
              <a href="/game" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center text-sm lg:text-base">
                Start Game
              </a>
            </div>
          </div>

          {/* AI vs Human */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 lg:p-6 hover:shadow-xl transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">🧠</div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI vs Human
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-4">
                Challenge our AI opponent
              </p>
              <button 
                onClick={handleAIGameClick}
                className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center text-sm lg:text-base"
              >
                Challenge AI
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700 opacity-60 sm:col-span-2 lg:col-span-1">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl mb-3 lg:mb-4">⚡</div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI vs AI
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-4">
                Watch AI battle it out
              </p>
              <button className="w-full bg-gray-400 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed text-sm lg:text-base">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>

      <AISelectionModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSelectStockfish={handleStockfishSelect}
        onSelectCustomAI={handleCustomAISelect}
      />
    </div>
  );
}

"use client"

import { useState } from "react"

interface AIConfig {
  apiKey: string
  modelName: string
}

interface AISelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStockfish: () => void
  onSelectCustomAI: (config: AIConfig) => void
}

export function AISelectionModal({ isOpen, onClose, onSelectStockfish, onSelectCustomAI }: AISelectionModalProps) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [config, setConfig] = useState({ apiKey: '', modelName: 'gemini-1.5-flash' })

  if (!isOpen) return null

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (config.apiKey.trim()) {
      onSelectCustomAI(config)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
        {!showCustomForm ? (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose AI Opponent</h3>
            <div className="space-y-3">
              <button
                onClick={onSelectStockfish}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
              >
                🏆 Play Against Stockfish AI
                <div className="text-sm opacity-80">Powerful chess engine (with fallback)</div>
              </button>
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors"
              >
                ⚙️ Configure Custom AI
                <div className="text-sm opacity-80">Use your own AI model</div>
              </button>
            </div>
            <button onClick={onClose} className="w-full mt-4 text-gray-500 hover:text-gray-700">Cancel</button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configure Custom AI</h3>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter your AI API key"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={config.modelName}
                  onChange={(e) => setConfig({...config, modelName: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., gemini-1.5-flash"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                >
                  Save & Start Game
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-4 text-gray-500 hover:text-gray-700"
                >
                  Back
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
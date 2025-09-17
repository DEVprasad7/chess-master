"use client"

import { useState } from "react"
import { providers, verifyApiKey } from "./api-key_verify"
import { useApiKeyMetadata } from "./metadata"

interface AIConfig {
  apiKey: string
  modelName: string
  providerName: string
}

interface AISelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectStockfish: () => void
  onSelectCustomAI: (config: AIConfig) => void
}

export function AISelectionModal({ isOpen, onClose, onSelectStockfish, onSelectCustomAI }: AISelectionModalProps) {
  const { apiKeys } = useApiKeyMetadata()
  const [showExistingAI, setShowExistingAI] = useState(false)
  const [selectedExistingConfig, setSelectedExistingConfig] = useState<string>('')



  if (!isOpen) return null



  const handleExistingAISubmit = () => {
    const apiKeyData = apiKeys.find(k => k.id === selectedExistingConfig)
    if (apiKeyData) {
      onSelectCustomAI({ 
        apiKey: apiKeyData.apiKey, 
        modelName: apiKeyData.model, 
        providerName: apiKeyData.provider 
      })
      onClose()
    }
  }

  const resetForm = () => {
    setShowExistingAI(false)
    setSelectedExistingConfig('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {!showExistingAI ? (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose AI Opponent</h3>
            <div className="space-y-3">
              <button
                onClick={onSelectStockfish}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
              >
                🏆 Play Against Stockfish
                <div className="text-sm opacity-80">Powerful chess engine</div>
              </button>
              {apiKeys.length > 0 ? (
                <button
                  onClick={() => setShowExistingAI(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors"
                >
                  🤖 Use Custom AI
                  <div className="text-sm opacity-80">{apiKeys.length} configured model{apiKeys.length > 1 ? 's' : ''}</div>
                </button>
              ) : (
                <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 p-3 rounded-lg text-center">
                  🤖 No Custom AI Models
                  <div className="text-sm opacity-80">Configure models in the Models page first</div>
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-full mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Cancel</button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select Existing AI</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Saved AI Configurations
                </label>
                <select
                  value={selectedExistingConfig}
                  onChange={(e) => setSelectedExistingConfig(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select a configuration...</option>
                  {apiKeys.map((apiKeyData) => (
                    <option key={apiKeyData.id} value={apiKeyData.id}>
                      {apiKeyData.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleExistingAISubmit}
                  disabled={!selectedExistingConfig}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Game
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
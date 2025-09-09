"use client"

import { useState, useEffect } from "react"
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
  const { apiKeys, addApiKey } = useApiKeyMetadata()
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [showExistingAI, setShowExistingAI] = useState(false)
  const [provider, setProvider] = useState<string>(Object.keys(providers)[0])
  const [apiKey, setApiKey] = useState<string>('')
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [selectedExistingConfig, setSelectedExistingConfig] = useState<string>('')



  if (!isOpen) return null

  const handleVerify = async () => {
    setIsLoading(true)
    setError(null)
    setModels([])
    setIsVerified(false)
    setSelectedModel('')

    const result = await verifyApiKey(provider, apiKey)
    
    if (result.success && result.models) {
      setModels(result.models)
      setIsVerified(true)
      if (result.models.length > 0) {
        setSelectedModel(result.models[0])
      }
    } else {
      setError(result.error || "Invalid API key")
      setIsVerified(false)
    }
    
    setIsLoading(false)
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isVerified && selectedModel) {
      const newApiKey = {
        id: `${provider}-${selectedModel}-${Date.now()}`,
        provider,
        name: `${providers[provider]?.name || provider} - ${selectedModel}`,
        apiKey,
        model: selectedModel
      }
      
      await addApiKey(newApiKey)
      
      onSelectCustomAI({ apiKey, modelName: selectedModel, providerName: provider })
      onClose()
    }
  }

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
    setShowCustomForm(false)
    setShowExistingAI(false)
    setProvider(Object.keys(providers)[0])
    setApiKey('')
    setModels([])
    setSelectedModel('')
    setIsLoading(false)
    setError(null)
    setIsVerified(false)
    setSelectedExistingConfig('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {!showCustomForm && !showExistingAI ? (
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
              {apiKeys.length > 0 && (
                <button
                  onClick={() => setShowExistingAI(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors"
                >
                  🤖 Use Existing AI
                  <div className="text-sm opacity-80">{apiKeys.length} saved configuration{apiKeys.length > 1 ? 's' : ''}</div>
                </button>
              )}
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors"
              >
                ⚙️ Configure Custom AI
                <div className="text-sm opacity-80">Use your own AI model</div>
              </button>
            </div>
            <button onClick={onClose} className="w-full mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Cancel</button>
          </>
        ) : showExistingAI ? (
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
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configure New AI</h3>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value)
                    setApiKey('')
                    setModels([])
                    setSelectedModel('')
                    setError(null)
                    setIsVerified(false)
                  }}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Object.entries(providers).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setError(null)
                      setIsVerified(false)
                      setModels([])
                      setSelectedModel('')
                    }}
                    className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your API key"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isLoading || !apiKey}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : "Verify"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                  Invalid API key
                </div>
              )}

              {isVerified && models.length > 0 && (
                <div className="bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-700 rounded-lg p-3">
                  <div className="text-green-700 dark:text-green-300 text-sm font-medium mb-2">
                    ✅ API key verified! Found {models.length} models
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!isVerified || !selectedModel}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save & Start Game
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
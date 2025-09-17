"use client";

import { useState } from "react";
import { useApiKeyMetadata } from "@/components/metadata"
import { AIvsAIGame } from "@/components/ai-vs-ai-game";

interface CustomAIConfiguration {
  apiKey: string;
  model: string;
  provider: string;
}

interface AIOption {
  id: string;
  name: string;
  type: 'stockfish' | 'custom';
  config?: CustomAIConfiguration;
}

export default function AIvsAIPage() {
  const { apiKeys } = useApiKeyMetadata();
  const [gameStarted, setGameStarted] = useState(false);
  const [whiteAI, setWhiteAI] = useState<AIOption>({ id: 'stockfish', name: 'Stockfish', type: 'stockfish' });
  const [blackAI, setBlackAI] = useState<AIOption>({ id: 'stockfish', name: 'Stockfish', type: 'stockfish' });
  const [whiteDepth, setWhiteDepth] = useState(12);
  const [whiteTime, setWhiteTime] = useState(3);
  const [blackDepth, setBlackDepth] = useState(15);
  const [blackTime, setBlackTime] = useState(5);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleBackToSetup = () => {
    setGameStarted(false);
  };

  const getAvailableAIs = (): AIOption[] => {
    const options: AIOption[] = [
      { id: 'stockfish', name: 'Stockfish', type: 'stockfish' }
    ];
    
    apiKeys.forEach(key => {
      options.push({
        id: key.id,
        name: key.name,
        type: 'custom',
        config: key
      });
    });
    
    return options;
  };

  const availableAIs = getAvailableAIs();

  if (gameStarted) {
    return (
      <AIvsAIGame
        whiteAI={whiteAI}
        blackAI={blackAI}
        whiteConfig={{ depth: whiteDepth, time: whiteTime * 1000 }}
        blackConfig={{ depth: blackDepth, time: blackTime * 1000 }}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI vs AI Battle
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Watch two AI opponents battle it out
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Choose AI Opponents</h3>
            
            {/* White AI Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                White AI
              </label>
              <select
                value={whiteAI.id}
                onChange={(e) => {
                  const selected = availableAIs.find(ai => ai.id === e.target.value);
                  if (selected) setWhiteAI(selected);
                }}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {availableAIs.map((ai) => (
                  <option key={ai.id} value={ai.id}>{ai.name}</option>
                ))}
              </select>
              
              {whiteAI.type === 'stockfish' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Depth: {whiteDepth}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={whiteDepth}
                      onChange={(e) => setWhiteDepth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Thinking Time: {whiteTime}s
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={whiteTime}
                      onChange={(e) => setWhiteTime(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Black AI Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Black AI
              </label>
              <select
                value={blackAI.id}
                onChange={(e) => {
                  const selected = availableAIs.find(ai => ai.id === e.target.value);
                  if (selected) setBlackAI(selected);
                }}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {availableAIs.map((ai) => (
                  <option key={ai.id} value={ai.id}>{ai.name}</option>
                ))}
              </select>
              
              {blackAI.type === 'stockfish' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Depth: {blackDepth}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={blackDepth}
                      onChange={(e) => setBlackDepth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Thinking Time: {blackTime}s
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={blackTime}
                      onChange={(e) => setBlackTime(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleStartGame}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Start AI Battle 🤖⚔️🤖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
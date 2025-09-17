"use client";

import { useState, useEffect } from "react";
import {
  ChessGame,
  useChessGameContext,
} from "@react-chess-tools/react-chess-game";
import { HybridAI } from "@/utils/hybridAI";

interface CustomAIConfiguration {
  apiKey: string;
  model: string;
  provider: string;
}

interface AIOption {
  id: string;
  name: string;
  type: "stockfish" | "custom";
  config?: CustomAIConfiguration;
}

interface AIConfig {
  depth?: number;
  time?: number;
}

interface AIvsAIGameProps {
  whiteAI: AIOption;
  blackAI: AIOption;
  whiteConfig: AIConfig;
  blackConfig: AIConfig;
  onBackToSetup: () => void;
}

function AIvsAIGameContent({
  whiteAI,
  blackAI,
  whiteConfig,
  blackConfig,
  onBackToSetup,
}: AIvsAIGameProps) {
  const { info, game, methods } = useChessGameContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<
    "white" | "black" | null
  >(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitReachedAI, setLimitReachedAI] = useState<
    "white" | "black" | null
  >(null);
  const [whiteAIEngine] = useState(() => new HybridAI());
  const [blackAIEngine] = useState(() => new HybridAI());

  // Initialize AI engines with custom configurations
  useEffect(() => {
    if (whiteAI.type === "stockfish") {
      whiteAIEngine.setStockfishMode(
        whiteConfig.depth || 12,
        whiteConfig.time || 3000
      );
    } else if (whiteAI.config) {
      whiteAIEngine.setCustomAIMode({
        apiKey: whiteAI.config.apiKey,
        modelName: whiteAI.config.model,
        providerName: whiteAI.config.provider,
      });
    }

    if (blackAI.type === "stockfish") {
      blackAIEngine.setStockfishMode(
        blackConfig.depth || 15,
        blackConfig.time || 5000
      );
    } else if (blackAI.config) {
      blackAIEngine.setCustomAIMode({
        apiKey: blackAI.config.apiKey,
        modelName: blackAI.config.model,
        providerName: blackAI.config.provider,
      });
    }
  }, [
    whiteAI,
    blackAI,
    whiteConfig,
    blackConfig,
    whiteAIEngine,
    blackAIEngine,
  ]);

  // AI vs AI game loop
  useEffect(() => {
    if (!isPlaying || info.isGameOver) return;

    const makeAIMove = async () => {
      const currentAI = info.turn === "w" ? whiteAIEngine : blackAIEngine;
      const aiName = info.turn === "w" ? "white" : "black";
      const config = info.turn === "w" ? whiteConfig : blackConfig;

      setCurrentThinking(aiName);

      try {
        const possibleMoves = game.moves();
        if (possibleMoves.length === 0) {
          setCurrentThinking(null);
          return;
        }

        // Get AI move
        const aiResult = await currentAI.getBestMove(
          game.fen(),
          possibleMoves,
          game
        );

        // Handle API limit reached
        if (aiResult.isLimitReached) {
          setCurrentThinking(null);
          setIsPlaying(false);
          setLimitReachedAI(aiName);
          setShowLimitDialog(true);
          return;
        }

        // Handle AI errors
        if (!aiResult.move) {
          setCurrentThinking(null);
          setIsPlaying(false);
          setGameError(
            `${aiName.toUpperCase()} AI failed to generate a move. Game paused.`
          );
          return;
        }

        // Validate move
        if (!possibleMoves.includes(aiResult.move.trim())) {
          setCurrentThinking(null);
          setIsPlaying(false);
          setGameError(
            `${aiName.toUpperCase()} AI generated invalid move: ${
              aiResult.move
            }. Game paused.`
          );
          return;
        }

        // Wait for thinking time
        await new Promise((resolve) =>
          setTimeout(resolve, config.time || 3000)
        );

        methods.makeMove(aiResult.move.trim());
        setCurrentThinking(null);
      } catch (error) {
        console.error("AI move error:", error);
        setCurrentThinking(null);
        setIsPlaying(false);
        setGameError(
          `${aiName.toUpperCase()} AI encountered an error: ${
            (error as Error).message
          }. Game paused.`
        );
      }
    };

    const timer = setTimeout(makeAIMove, 500); // Small delay between moves
    return () => clearTimeout(timer);
  }, [
    info.turn,
    info.isGameOver,
    isPlaying,
    game,
    methods,
    whiteAIEngine,
    blackAIEngine,
    whiteConfig,
    blackConfig,
    showLimitDialog,
  ]);

  const whiteWon = info.isCheckmate && info.turn === "b";
  const blackWon = info.isCheckmate && info.turn === "w";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI vs AI Battle
          </h1>
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={onBackToSetup}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Setup
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isPlaying
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isPlaying ? "Pause" : "Start"}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 mb-8">
          {/* White AI */}
          <div
            className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-4 lg:p-8 w-full max-w-sm lg:w-80 transition-all ${
              whiteWon
                ? "ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse"
                : currentThinking === "white"
                ? "ring-2 ring-blue-400"
                : ""
            }`}
          >
            <div className="text-center">
              <div className="text-2xl lg:text-4xl mb-2 lg:mb-4">🤖</div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3">
                {whiteAI.name}
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 opacity-70 mb-2">
                White Pieces
              </p>
              {whiteAI.type === "stockfish" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Depth: {whiteConfig.depth} | Time:{" "}
                  {(whiteConfig.time || 3000) / 1000}s
                </p>
              )}
              {whiteWon && (
                <div className="text-green-500 font-bold text-base lg:text-lg animate-bounce">
                  Winner! 🏆
                </div>
              )}
              {currentThinking === "white" && (
                <div className="text-blue-500 font-medium text-sm">
                  Thinking...
                </div>
              )}
            </div>
          </div>

          {/* Chess Board */}
          <div className="w-full max-w-[350px] sm:max-w-[400px] lg:max-w-[400px] aspect-square">
            <ChessGame.Board />
          </div>

          {/* Black AI */}
          <div
            className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-4 lg:p-8 w-full max-w-sm lg:w-80 transition-all ${
              blackWon
                ? "ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse"
                : currentThinking === "black"
                ? "ring-2 ring-red-400"
                : ""
            }`}
          >
            <div className="text-center">
              <div className="text-2xl lg:text-4xl mb-2 lg:mb-4">🤖</div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3">
                {blackAI.name}
              </h3>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 opacity-70 mb-2">
                Black Pieces
              </p>
              {blackAI.type === "stockfish" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Depth: {blackConfig.depth} | Time:{" "}
                  {(blackConfig.time || 3000) / 1000}s
                </p>
              )}
              {blackWon && (
                <div className="text-green-500 font-bold text-base lg:text-lg animate-bounce">
                  Winner! 🏆
                </div>
              )}
              {currentThinking === "black" && (
                <div className="text-red-500 font-medium text-sm">
                  Thinking...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {gameError && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg p-4 text-center font-semibold">
              {gameError}
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setGameError(null);
                  setIsPlaying(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mr-2"
              >
                Clear Error
              </button>
              <button
                onClick={onBackToSetup}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Setup
              </button>
            </div>
          </div>
        )}

        {/* Game Status */}
        {info.isGameOver && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg p-4 text-center font-semibold">
              {info.isCheckmate &&
                `Game Over! ${
                  info.turn === "w" ? blackAI.name : whiteAI.name
                } wins!`}
              {info.isStalemate && "Stalemate! Game is a draw."}
              {info.isDraw && "Draw!"}
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                New Battle 🤖⚔️🤖
              </button>
            </div>
          </div>
        )}

        <MoveHistory whiteAI={whiteAI} blackAI={blackAI} />

        {/* API Limit Dialog */}
        {showLimitDialog && limitReachedAI && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                API Limit Reached
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {limitReachedAI.toUpperCase()} AI (
                {limitReachedAI === "white" ? whiteAI.name : blackAI.name}) has
                reached its API limit. Choose how to continue:
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLimitDialog(false);
                    setLimitReachedAI(null);
                    // Switch the limited AI to Stockfish
                    if (limitReachedAI === "white") {
                      whiteAIEngine.setStockfishMode(12, 3000);
                    } else {
                      blackAIEngine.setStockfishMode(15, 5000);
                    }
                    setIsPlaying(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                >
                  Continue with Stockfish
                </button>
                <button
                  onClick={onBackToSetup}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors"
                >
                  Back to Setup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MoveHistory({ whiteAI, blackAI }: { whiteAI: AIOption; blackAI: AIOption }) {
  const { game } = useChessGameContext();
  const moves = game.history();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Move History
        </h3>
        <div className="max-h-32 overflow-y-auto">
          {moves.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
              No moves yet. {whiteAI.name} (White) vs {blackAI.name} (Black)
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {moves.map((move, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    index % 2 === 0
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
                  }`}
                >
                  <span className="font-mono">
                    {Math.floor(index / 2) + 1}
                    {index % 2 === 0 ? "." : "..."} {move}
                  </span>
                  <span className="text-xs ml-2 opacity-70">
                    ({index % 2 === 0 ? whiteAI.name : blackAI.name})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIvsAIGame(props: AIvsAIGameProps) {
  return (
    <ChessGame.Root>
      <AIvsAIGameContent {...props} />
    </ChessGame.Root>
  );
}

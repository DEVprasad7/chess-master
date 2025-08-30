interface PlayerCardProps {
  player: string;
  pieces: string;
  icon: string;
  isActive: boolean;
  hasWon: boolean;
  isGameOver: boolean;
}

function getCardClassName(
  hasWon: boolean,
  isActive: boolean,
  isGameOver: boolean
): string {
  const baseClasses =
    "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-4 lg:p-8 w-full max-w-sm lg:w-80 transition-all";

  if (hasWon) {
    return `${baseClasses} ring-4 ring-green-400 shadow-green-400/50 shadow-2xl animate-pulse`;
  }

  if (isActive && !isGameOver) {
    return `${baseClasses} ring-2 ring-green-400`;
  }

  return baseClasses;
}

const animationDelayStyles = {
  delay200: { animationDelay: "0.2s" } as const,
  delay400: { animationDelay: "0.4s" } as const,
};

export function PlayerCard({
  player,
  pieces,
  icon,
  isActive,
  hasWon,
  isGameOver,
}: PlayerCardProps) {
  return (
    <div className={getCardClassName(hasWon, isActive, isGameOver)}>
      <div className="text-center">
        <div className="text-2xl lg:text-4xl mb-2 lg:mb-4">{icon}</div>
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3">
          {player}
        </h3>
        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 opacity-70 mb-2">
          {pieces}
        </p>
        {hasWon && (
          <div className="text-green-500 font-bold text-base lg:text-lg animate-bounce">
            You Won! 🏆
          </div>
        )}
        {isActive && !isGameOver && (
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              style={animationDelayStyles.delay200}
            ></div>
            <div
              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              style={animationDelayStyles.delay400}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

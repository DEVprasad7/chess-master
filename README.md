# ChessMaster 🏆

A modern, interactive chess game built with Next.js 15, React 19, and TypeScript. Features a beautiful UI with drag-and-drop gameplay, real-time move validation, and winner celebrations.

## ✨ Features

- **Interactive Chess Board**: Drag-and-drop piece movement with visual feedback
- **Real-time Game State**: Live turn indicators and game status updates
- **Move Validation**: Powered by chess.js for accurate rule enforcement
- **Winner Celebrations**: Animated victory displays with glowing effects
- **Move History**: Complete game notation tracking
- **Dark/Light Theme**: Toggle between themes with system preference support
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Game Management**: Restart functionality and game over detection

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.0 with App Router
- **Frontend**: React 19.1.0, TypeScript 5
- **Chess Engine**: chess.js 1.4.0 for game logic
- **Chess UI**: @react-chess-tools/react-chess-game 0.5.1
- **Styling**: Tailwind CSS 4 with custom animations
- **Theme**: next-themes 0.4.6 for dark/light mode
- **Icons**: Lucide React 0.541.0

## 📦 Dependencies

### Core Dependencies
```json
{
  "@react-chess-tools/react-chess-game": "^0.5.1",
  "chess.js": "^1.4.0",
  "lucide-react": "^0.541.0",
  "next": "15.5.0",
  "next-themes": "^0.4.6",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

### Development Dependencies
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.5.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd chess-master
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. **Start a Game**: Click "Start Game" on the home page
2. **Make Moves**: Drag and drop pieces to make moves
3. **Turn Indicators**: Green glow shows whose turn it is
4. **Game Status**: Real-time updates for check, checkmate, and draws
5. **Winner Celebration**: Animated victory display when game ends
6. **New Game**: Click "New Game 🎮" to restart

## 📁 Project Structure

```
chess-master/
├── app/
│   ├── game/
│   │   └── page.tsx          # Main chess game component
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout with theme provider
│   └── page.tsx              # Home page with game modes
├── components/
│   ├── navbar.tsx            # Navigation bar
│   ├── theme-provider.tsx    # Theme context provider
│   └── theme-toggle.tsx      # Dark/light mode toggle
├── public/                   # Static assets
└── package.json              # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Customization

### Theme Colors
Modify `app/globals.css` to customize the color scheme:
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Chess Board Styling
The chess board inherits from the container's dimensions. Modify the wrapper in `app/game/page.tsx`:
```tsx
<div className="w-[400px] h-[400px] flex-shrink-0">
  <GameContent />
</div>
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically with zero configuration

### Other Platforms
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js) for chess game logic
- [@react-chess-tools](https://github.com/react-chess-tools/react-chess-game) for React chess components

# ChessMaster ♔

A modern, responsive chess web application built with Next.js, featuring AI opponents powered by Stockfish engine and custom AI models.

## 🚀 Live Demo

**[Play ChessMaster](https://chess-master-one-delta.vercel.app/)**

## ✨ Features

- **Multiple Game Modes**
  - Human vs Human (local multiplayer)
  - Human vs AI (Stockfish engine)
  - Custom AI integration (Google Gemini support)

- **AI Opponents**
  - **Stockfish Engine**: Professional-grade chess engine
  - **Custom AI**: Configurable AI models with API integration
  - Smart move validation and fallback systems

- **Modern UI/UX**
  - Responsive design (mobile, tablet, desktop)
  - Dark/Light theme support
  - Real-time game status updates
  - Move history tracking
  - Interactive chess board

- **Authentication**
  - Clerk authentication integration
  - Protected game routes
  - User session management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Chess Logic**: chess.js, @react-chess-tools/react-chess-game
- **AI Engine**: Stockfish.js, Custom AI API
- **Authentication**: Clerk
- **Deployment**: Vercel

## 🎮 Game Modes

### 1. Human vs Human
- Local multiplayer chess
- Turn-based gameplay
- Real-time move validation

### 2. Human vs AI
- **Stockfish Mode**: Play against the powerful Stockfish engine
- **Custom AI Mode**: Configure your own AI model (supports Google Gemini)
- Adjustable difficulty and thinking time

### 3. AI vs AI (Coming Soon)
- Watch AI opponents battle each other

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-master
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Clerk keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🤖 AI Configuration

### Stockfish Engine
- Pre-configured and ready to use
- No additional setup required
- Adjustable depth and time limits

### Custom AI Setup
1. Navigate to AI game mode
2. Select "Configure Custom AI"
3. Enter your API key and model name
4. Supported models: Google Gemini, OpenAI GPT, etc.

## 📱 Mobile Support

ChessMaster is fully responsive and optimized for:
- **Mobile phones** (portrait/landscape)
- **Tablets** 
- **Desktop computers**
- **Touch and mouse interactions**

## 🏗️ Project Structure

```
chess-master/
├── app/                    # Next.js app directory
│   ├── ai-game/           # AI vs Human game page
│   ├── game/              # Human vs Human game page
│   └── page.tsx           # Home page
├── components/            # Reusable React components
├── utils/                 # Utility functions and AI logic
├── public/               # Static assets and Stockfish files
└── middleware.ts         # Authentication middleware
```

## 🔧 Key Components

- **HybridAI**: Manages Stockfish and custom AI engines
- **ChessGame**: React chess game logic and UI
- **PlayerCard**: Responsive player information display
- **AISelectionModal**: AI configuration interface

## 🚀 Deployment

The app is deployed on Vercel with automatic deployments from the main branch.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/chess-master)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Stockfish**: Open-source chess engine
- **chess.js**: Chess game logic library
- **Clerk**: Authentication platform
- **Vercel**: Deployment platform
- **Tailwind CSS**: Utility-first CSS framework

---

**Built with ❤️ using Next.js and modern web technologies**
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { fen, moveHistory, legalMoves } = await request.json()
    
    const model = genAI.getGenerativeModel({ 
      model: process.env.GOOGLE_AI_MODEL_NAME || 'gemini-1.5-flash' 
    })
    
    const prompt = `You are an expert chess grandmaster AI playing as Black. 
                    Your objective is to WIN the game decisively.

                    Current position: ${fen}
                    Move history: ${moveHistory.join(' ')}
                    Legal moves: ${legalMoves.join(', ')}

                    Analyze the position deeply before choosing a move. 
                    Evaluate tactics (short-term) AND strategy (long-term). 
                    From the legal moves list, choose the SINGLE BEST move by considering:

                    1. **Immediate Tactics**
                      - If checkmate is possible, deliver it immediately.
                      - If a forced winning sequence (mate-in-X or unstoppable attack) exists, play it.
                      - Always calculate captures, checks, and forced responses.

                    2. **Material & Value**
                      - Prefer moves that capture the opponent’s high-value pieces (Queen=9, Rook=5, Bishop/Knight=3, Pawn=1).
                      - Trade only if it gives you a better position or material advantage.

                    3. **King Safety**
                      - Keep your king safe. Avoid exposing it unnecessarily.
                      - Castle early if safe and beneficial.
                      - Avoid weakening pawn structures near your king.

                    4. **Threats & Pressure**
                      - Create threats that force the opponent into defensive moves.
                      - Attack undefended or weakly defended pieces.
                      - Control key open files and diagonals with major pieces.

                    5. **Piece Activity & Development**
                      - Activate undeveloped pieces and bring them into play.
                      - Prioritize central control (d4, d5, e4, e5).
                      - Avoid moving the same piece multiple times without purpose.

                    6. **Positional Factors**
                      - Improve piece coordination.
                      - Strengthen pawn structure; avoid unnecessary weaknesses.
                      - Prepare long-term strategies (passed pawns, open files, outposts).

                    7. **Avoid Blunders**
                      - Never hang a piece.
                      - Do not make moves that immediately lose material or allow tactics against your king.

                    🎯 Important: Do not just pick a move by priority order. Instead, evaluate ALL legal moves and choose the strongest one overall, balancing tactics and strategy.

                    Output ONLY one move from the legal moves list as your final answer.

                    Your move:`

    const result = await model.generateContent(prompt)
    const aiMove = result.response.text().trim()
    
    return NextResponse.json({ move: aiMove })
  } catch (error) {
    console.error('AI move generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiKey: process.env.GOOGLE_API_KEY ? 'Present' : 'Missing'
    })
    return NextResponse.json(
      { error: 'Failed to generate AI move', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
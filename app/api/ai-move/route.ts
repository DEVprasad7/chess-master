import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { fen, moveHistory } = await request.json()
    
    const model = genAI.getGenerativeModel({ 
      model: process.env.GOOGLE_AI_MODEL_NAME || 'gemini-1.5-flash' 
    })
    
    const prompt = `You are a chess AI playing as Black. Current position: ${fen}
Move history: ${moveHistory.join(' ')}

Generate ONE valid chess move for Black in standard algebraic notation.
Examples: e5, Nf6, Bb5, O-O, Qd7
Respond with ONLY the move, no explanation.

Move:`

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
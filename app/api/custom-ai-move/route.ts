import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fen, legalMoves, config } = await request.json()
    
    const genAI = new GoogleGenerativeAI(config.apiKey)
    const model = genAI.getGenerativeModel({ model: config.modelName })
    
    const prompt = `You are a chess grandmaster AI playing as Black. 
                    Current position: ${fen}
                    Legal moves: ${legalMoves.join(', ')}
                    Choose the best move. Respond with ONLY the move:`

    const result = await model.generateContent(prompt)
    const aiMove = result.response.text().trim()
    
    return NextResponse.json({ move: aiMove })
  } catch (error) {
    console.error('Custom AI error:', error)
    return NextResponse.json({ error: 'Failed to generate move' }, { status: 500 })
  }
}
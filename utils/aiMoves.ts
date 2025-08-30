export async function getAIMove(fen: string, moveHistory: string[], legalMoves: string[]): Promise<string | null> {
  try {
    const response = await fetch('/api/ai-move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fen,
        moveHistory,
        legalMoves
      })
    })
    
    if (response.status === 429) {
      console.warn('API rate limit reached, using fallback')
      return null
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    let data
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return null
    }
    
    return data.move?.trim() || null
  } catch (error) {
    console.error('Error getting AI move:', error)
    return null
  }
}
interface AIConfig {
  apiKey: string;
  modelName: string;
}

interface AIResponse {
  move: string | null;
  error?: string;
  isLimitReached?: boolean;
}

// System prompts optimized for minimal token usage
const SYSTEM_PROMPTS = {
  chess: "Chess engine. Return only the best move in SAN format. No explanation.",
  short: "Best chess move in SAN:"
};

// Provider-specific move generation functions
const generateMoveForProvider = {
  'google-gemini': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${config.apiKey}`;
    
    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPTS.chess }] },
      contents: [{ parts: [{ text: `FEN: ${fen}\nLegal: ${legalMoves.slice(0, 10).join(',')}\nMove:` }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 5 }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error?.message || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/[.!]/g, '');
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  },

  'openai': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    
    const payload = {
      model: config.modelName,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.chess },
        { role: "user", content: `${fen} ${legalMoves.slice(0, 10).join(',')}` }
      ],
      max_tokens: 5,
      temperature: 0
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error?.message || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data.choices?.[0]?.message?.content?.trim();
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  },

  'anthropic': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = "https://api.anthropic.com/v1/messages";
    
    const payload = {
      model: config.modelName,
      max_tokens: 5,
      system: SYSTEM_PROMPTS.chess,
      messages: [{ role: "user", content: `${fen} ${legalMoves.slice(0, 10).join(',')}` }]
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error?.message || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data.content?.[0]?.text?.trim();
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  },

  'deepseek': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = "https://api.deepseek.com/v1/chat/completions";
    
    const payload = {
      model: config.modelName,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.chess },
        { role: "user", content: `${fen} ${legalMoves.slice(0, 10).join(',')}` }
      ],
      max_tokens: 5,
      temperature: 0
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error?.message || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data.choices?.[0]?.message?.content?.trim();
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  },

  'openrouter': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    const payload = {
      model: config.modelName,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.chess },
        { role: "user", content: `${fen} ${legalMoves.slice(0, 10).join(',')}` }
      ],
      max_tokens: 5,
      temperature: 0
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error?.message || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data.choices?.[0]?.message?.content?.trim();
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  },

  'hugging-face': async (config: AIConfig, fen: string, legalMoves: string[]): Promise<AIResponse> => {
    const API_URL = `https://api-inference.huggingface.co/models/${config.modelName}`;
    
    const payload = {
      inputs: `${SYSTEM_PROMPTS.short} ${fen} ${legalMoves.slice(0, 10).join(',')}`,
      parameters: { max_new_tokens: 5, temperature: 0 }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        return { move: null, error: "Rate limit reached", isLimitReached: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return { move: null, error: errorData.error || "API Error", isLimitReached: response.status === 403 };
      }

      const data = await response.json();
      const move = data[0]?.generated_text?.replace(payload.inputs, '').trim();
      
      return { move: move || null };
    } catch (error) {
      return { move: null, error: (error as Error).message };
    }
  }
};

// Detect provider from model name
function detectProvider(modelName: string): string {
  if (modelName.includes('gemini')) return 'google-gemini';
  if (modelName.includes('gpt') || modelName.includes('o1')) return 'openai';
  if (modelName.includes('claude')) return 'anthropic';
  if (modelName.includes('deepseek')) return 'deepseek';
  if (modelName.includes('openrouter') || modelName.includes('/')) return 'openrouter';
  return 'hugging-face';
}

// Main function to get AI move
export async function getCustomAIMove(
  config: AIConfig,
  fen: string,
  legalMoves: string[]
): Promise<AIResponse> {
  const provider = detectProvider(config.modelName);
  const generateMove = generateMoveForProvider[provider as keyof typeof generateMoveForProvider];
  
  if (!generateMove) {
    return { move: null, error: "Unsupported provider" };
  }
  
  return await generateMove(config, fen, legalMoves);

}

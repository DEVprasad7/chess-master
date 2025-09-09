"use client";

import { useState, FC } from 'react';

interface ApiModel {
  id: string;
  name: string;
  modelId: string;
}

interface ApiResponse {
  data?: ApiModel[];
  models?: ApiModel[];
  error?: { message: string };
  [key: string]: unknown;
}

// Define the structure for each provider's configuration
export interface ProviderConfig {
  name: string;
  apiUrl: string;
  getHeaders: (apiKey: string) => HeadersInit;
  parseModels: (data: ApiResponse) => string[];
}

// Configuration object for all supported AI providers
export const providers: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    apiUrl: "https://api.openai.com/v1/models",
    getHeaders: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
    parseModels: (data) => data.data?.map((model) => model.id).sort() || [],
  },
  "google-gemini": {
    name: "Google Gemini",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    getHeaders: (apiKey) => ({ "x-goog-api-key": apiKey }),
    parseModels: (data) => data.models?.map((model) => model.name.replace('models/', '')).sort() || [],
  },
  anthropic: {
    name: "Anthropic (Claude)",
    apiUrl: "https://api.anthropic.com/v1/messages",
    getHeaders: (apiKey) => ({
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    }),
    parseModels: () => [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-2.1",
      "claude-2.0",
      "claude-instant-1.2",
    ],
  },
  deepseek: {
    name: "Deepseek",
    apiUrl: "https://api.deepseek.com/v1/models",
    getHeaders: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
    parseModels: (data) => data.data?.map((model) => model.id).sort() || [],
  },
  openrouter: {
    name: "OpenRouter",
    apiUrl: "https://openrouter.ai/api/v1/models",
    getHeaders: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
    parseModels: (data) => data.data?.map((model) => model.id).sort() || [],
  },
  "hugging-face": {
      name: "Hugging Face",
      apiUrl: "https://api-inference.huggingface.co/models",
      getHeaders: (apiKey) => ({ "Authorization": `Bearer ${apiKey}` }),
      parseModels: (data) => (Array.isArray(data) ? data.map((model) => model.modelId).sort().slice(0, 50) : []),
  }
};

// Verification function to be used by other components
export async function verifyApiKey(provider: string, apiKey: string): Promise<{ success: boolean; models?: string[]; error?: string }> {
  if (!apiKey) {
    return { success: false, error: "API key cannot be empty." };
  }

  const selectedProvider = providers[provider];
  if (!selectedProvider) {
    return { success: false, error: "Invalid provider selected." };
  }

  try {
    let response: Response;
    if (provider === 'anthropic') {
      response = await fetch(selectedProvider.apiUrl, {
        method: 'POST',
        headers: selectedProvider.getHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 10,
          messages: [{ role: "user", content: "." }],
        }),
      });
    } else if (provider === 'google-gemini') {
      response = await fetch(`${selectedProvider.apiUrl}?key=${apiKey}`, {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      response = await fetch(selectedProvider.apiUrl, {
        headers: selectedProvider.getHeaders(apiKey),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || `Error: ${response.status} ${response.statusText}`;
      return { success: false, error: errorMessage };
    }
    
    const parsedModels = selectedProvider.parseModels(data);
    return { success: true, models: parsedModels };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Invalid API key";
    return { success: false, error: errorMessage };
  }
}

const ApiKeyVerifier: FC = () => {
  const [provider, setProvider] = useState<string>(Object.keys(providers)[0]);
  const [apiKey, setApiKey] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setModels([]);
    setIsVerified(false);

    const result = await verifyApiKey(provider, apiKey);
    
    if (result.success && result.models) {
      setModels(result.models);
      setIsVerified(true);
    } else {
      setError(result.error || "An unknown error occurred.");
      setIsVerified(false);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400">AI Provider API Key Verifier</h1>
          <p className="text-gray-400 mt-2">Select a provider, enter your API key, and verify to see available models.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="col-span-1">
            <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                // Reset state when provider changes
                setApiKey('');
                setModels([]);
                setError(null);
                setIsVerified(false);
              }}
              className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 transition"
            >
              {Object.entries(providers).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here"
              className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full flex justify-center items-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : "Verify API Key"}
          </button>
        </div>
        
        <div className="pt-4">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">
                    <strong className="font-bold">Verification Failed: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {isVerified && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-md">
                    <h3 className="text-lg font-bold text-green-200 mb-3">✅ Verification Successful!</h3>
                    <p className="text-sm mb-4">Found <span className="font-bold">{models.length}</span> available models for <span className="font-bold">{providers[provider].name}</span>:</p>
                    <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-3 rounded-md border border-gray-700">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            {models.map((model) => (
                                <li key={model} className="truncate" title={model}>{model}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyVerifier;

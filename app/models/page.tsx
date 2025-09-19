"use client";

import { useState } from "react";

import { useApiKeyMetadata } from "@/components/metadata";
import { providers, verifyApiKey } from "@/components/api-key_verify";
import { Trash2 } from "lucide-react";
import { ApiKey } from "@/utils/types";

export default function ModelsPage() {
  const { apiKeys, isLoaded, deleteApiKey, updateApiKey, addApiKey } = useApiKeyMetadata();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [provider, setProvider] = useState<string>(Object.keys(providers)[0]);
  const [apiKey, setApiKey] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [newSelectedModel, setNewSelectedModel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleEdit = async (apiKey: ApiKey) => {
    setEditingId(apiKey.id);
    setSelectedModel(apiKey.model);
    setIsLoading(true);
    
    try {
      const result = await verifyApiKey(apiKey.provider, apiKey.apiKey);
      if (result.success && result.models) {
        setAvailableModels(result.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
    setIsLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !selectedModel) return;
    
    const apiKey = apiKeys.find(k => k.id === editingId);
    if (!apiKey) return;

    try {
      await updateApiKey(editingId, {
        ...apiKey,
        model: selectedModel,
        name: `${providers[apiKey.provider]?.name || apiKey.provider} - ${selectedModel}`
      });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update API key:', error);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    setModels([]);
    setIsVerified(false);
    setNewSelectedModel('');

    const result = await verifyApiKey(provider, apiKey);
    
    if (result.success && result.models) {
      setModels(result.models);
      setIsVerified(true);
      if (result.models.length > 0) {
        setNewSelectedModel(result.models[0]);
      }
    } else {
      setError(result.error || "Invalid API key");
      setIsVerified(false);
    }
    
    setIsLoading(false);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerified && newSelectedModel) {
      const newApiKey = {
        id: `${provider}-${newSelectedModel}-${Date.now()}`,
        provider,
        name: `${providers[provider]?.name || provider} - ${newSelectedModel}`,
        apiKey,
        model: newSelectedModel
      };
      
      await addApiKey(newApiKey);
      
      // Reset form
      setShowConfigForm(false);
      setProvider(Object.keys(providers)[0]);
      setApiKey('');
      setModels([]);
      setNewSelectedModel('');
      setError(null);
      setIsVerified(false);
    }
  };

  const resetConfigForm = () => {
    setShowConfigForm(false);
    setProvider(Object.keys(providers)[0]);
    setApiKey('');
    setModels([]);
    setNewSelectedModel('');
    setError(null);
    setIsVerified(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Models
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your configured AI models
          </p>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No AI Models Configured
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start by configuring your first AI model to play chess
            </p>
            <button
              onClick={() => setShowConfigForm(true)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Configure AI Model
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {apiKey.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          {providers[apiKey.provider]?.name || apiKey.provider}
                        </span>
                        <span>Model: {apiKey.model}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleEdit(apiKey)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(apiKey.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Model</h3>
              
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="text-gray-500 dark:text-gray-400">Loading models...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Model
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {availableModels.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configure AI Form Modal */}
        {showConfigForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configure New AI</h3>
              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setApiKey('');
                      setModels([]);
                      setNewSelectedModel('');
                      setError(null);
                      setIsVerified(false);
                    }}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(providers).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setError(null);
                        setIsVerified(false);
                        setModels([]);
                        setNewSelectedModel('');
                      }}
                      className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter your API key"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isLoading || !apiKey}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : "Verify"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                    Invalid API key
                  </div>
                )}

                {isVerified && models.length > 0 && (
                  <div className="bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-700 rounded-lg p-3">
                    <div className="text-green-700 dark:text-green-300 text-sm font-medium mb-2">
                      ✅ API key verified! Found {models.length} models
                    </div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Model
                    </label>
                    <select
                      value={newSelectedModel}
                      onChange={(e) => setNewSelectedModel(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      {models.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!isVerified || !newSelectedModel}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save AI Model
                  </button>
                  <button
                    type="button"
                    onClick={resetConfigForm}
                    className="px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiKeyMetadata } from "@/components/metadata";
import { providers, verifyApiKey } from "@/components/api-key_verify";
import { Trash2 } from "lucide-react";
import { ApiKey } from "@/utils/types";

export default function ModelsPage() {
  const { apiKeys, isLoaded, deleteApiKey, updateApiKey } = useApiKeyMetadata();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Configure AI Model
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
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
      </div>
    </div>
  );
}
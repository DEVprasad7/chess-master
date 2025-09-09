import { useUser } from '@clerk/nextjs';
import { ApiKey } from '@/utils/types';

export function useApiKeyMetadata() {
  const { user } = useUser();

  const saveApiKeys = async (apiKeys: ApiKey[]) => {
    if (!user) throw new Error('User not authenticated');
    
    // Store only essential data to stay within 10KB limit
    const minimalApiKeys = apiKeys;
    
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        apiKeys: minimalApiKeys
      }
    });
  };

  const getApiKeys = (): ApiKey[] => {
    if (!user) return [];
    const storedKeys = (user.unsafeMetadata?.apiKeys as ApiKey[]) || [];
    
    return storedKeys;
  };

  const addApiKey = async (newApiKey: ApiKey) => {
    const existingKeys = getApiKeys();
    const updatedKeys = [...existingKeys, newApiKey];
    await saveApiKeys(updatedKeys);
  };

  const updateApiKey = async (id: string, updatedApiKey: Omit<ApiKey, 'id' | 'createdAt'>) => {
    const existingKeys = getApiKeys();
    const updatedKeys = existingKeys.map(key => 
      key.id === id ? { ...key, ...updatedApiKey } : key
    );
    await saveApiKeys(updatedKeys);
  };

  const deleteApiKey = async (id: string) => {
    const existingKeys = getApiKeys();
    const updatedKeys = existingKeys.filter(key => key.id !== id);
    await saveApiKeys(updatedKeys);
  };

  return {
    apiKeys: getApiKeys(),
    addApiKey,
    updateApiKey,
    deleteApiKey,
    isLoaded: user !== undefined
  };
}
import { useState, useCallback, useEffect } from 'react';

interface ModelInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
  models: string[];
  defaultModel: string;
  supportsVision?: boolean;
  supportsAudio?: boolean;
  local?: boolean;
}

interface DiscoveryResult {
  provider: string;
  name: string;
  models: string[];
  defaultModel: string;
  discovered: boolean;
  hasApiKey?: boolean;
  cached?: boolean;
  local?: boolean;
}

interface UseModelDiscoveryReturn {
  // Provider data
  providers: ModelInfo[];
  currentProvider: string;
  currentModels: string[];
  defaultModel: string;
  
  // Discovery state
  isDiscovering: boolean;
  discoveryError: string | null;
  
  // Actions
  selectProvider: (providerId: string) => Promise<void>;
  refreshModels: () => Promise<void>;
  setProviderAndModel: (providerId: string, modelId: string) => void;
}

export function useModelDiscovery(
  initialProvider: string = 'openai',
  onProviderChange?: (providerId: string, models: string[], defaultModel: string) => void
): UseModelDiscoveryReturn {
  const [providers, setProviders] = useState<ModelInfo[]>([]);
  const [currentProvider, setCurrentProvider] = useState(initialProvider);
  const [currentModels, setCurrentModels] = useState<string[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  // Fetch all providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        if (data.providers) {
          setProviders(data.providers);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };
    
    fetchProviders();
  }, []);

  // Discovery function
  const discoverModels = useCallback(async (providerId: string, forceRefresh: boolean = false) => {
    setIsDiscovering(true);
    setDiscoveryError(null);
    
    try {
      const url = forceRefresh 
        ? `/api/models?provider=${providerId}&refresh=true`
        : `/api/models?provider=${providerId}`;
        
      const response = await fetch(url);
      const data: DiscoveryResult = await response.json();
      
      if (response.ok) {
        setCurrentModels(data.models);
        setDefaultModel(data.defaultModel);
        
        if (onProviderChange) {
          onProviderChange(providerId, data.models, data.defaultModel);
        }
        
        return data;
      } else {
        throw new Error(data.error || 'Failed to discover models');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model discovery failed';
      setDiscoveryError(message);
      console.error('Model discovery error:', error);
      return null;
    } finally {
      setIsDiscovering(false);
    }
  }, [onProviderChange]);

  // Select provider and discover models
  const selectProvider = useCallback(async (providerId: string) => {
    setCurrentProvider(providerId);
    await discoverModels(providerId);
  }, [discoverModels]);

  // Refresh models for current provider
  const refreshModels = useCallback(async () => {
    if (currentProvider) {
      await discoverModels(currentProvider, true);
    }
  }, [currentProvider, discoverModels]);

  // Set provider and model without discovery (for manual override)
  const setProviderAndModel = useCallback((providerId: string, modelId: string) => {
    setCurrentProvider(providerId);
    // Models will be fetched via selectProvider, this is just for manual override
  }, []);

  // Initial discovery when provider changes
  useEffect(() => {
    if (currentProvider && providers.length > 0) {
      discoverModels(currentProvider);
    }
  }, [currentProvider, providers.length, discoverModels]);

  return {
    providers,
    currentProvider,
    currentModels,
    defaultModel,
    isDiscovering,
    discoveryError,
    selectProvider,
    refreshModels,
    setProviderAndModel,
  };
}

// Hook for batch model discovery
export function useBatchModelDiscovery() {
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, string[]>>({});
  const [isDiscovering, setIsDiscovering] = useState(false);

  const discoverAll = useCallback(async (providerIds: string[]) => {
    setIsDiscovering(true);
    const results: Record<string, string[]> = {};
    
    await Promise.all(
      providerIds.map(async (providerId) => {
        try {
          const response = await fetch(`/api/models?provider=${providerId}`);
          const data = await response.json();
          if (response.ok) {
            results[providerId] = data.models;
          }
        } catch (error) {
          console.error(`Failed to discover models for ${providerId}:`, error);
        }
      })
    );
    
    setDiscoveredModels(results);
    setIsDiscovering(false);
    return results;
  }, []);

  return {
    discoveredModels,
    isDiscovering,
    discoverAll,
  };
}

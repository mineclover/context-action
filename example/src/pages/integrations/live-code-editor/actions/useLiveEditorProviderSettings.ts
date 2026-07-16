import { useEffect, useState } from 'react';
import {
  saveOpenRouterApiKey,
  useStoredOpenRouterApiKey,
} from '../../../../lib/openrouter-api-key';
import {
  getFreeModelsWithTools,
  type OpenRouterModel,
} from '../../../../lib/openrouter-models';

export function useLiveEditorProviderSettings() {
  const apiKey = useStoredOpenRouterApiKey();
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingModels(true);
    getFreeModelsWithTools()
      .then((freeModels) => {
        if (!active) return;
        setModels(freeModels);
        setSelectedModel((current) => current || freeModels[0]?.id || '');
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'OpenRouter models could not be loaded.'
          );
        }
      })
      .finally(() => {
        if (active) setLoadingModels(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    apiKey,
    models,
    selectedModel,
    loadingModels,
    error,
    commands: {
      saveApiKey: saveOpenRouterApiKey,
      selectModel: setSelectedModel,
    },
  };
}

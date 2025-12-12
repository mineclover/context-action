/**
 * OpenRouter Free Models API Integration
 *
 * Fetches and filters free models that support function calling (tools)
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  supported_parameters?: string[];
}

export interface OpenRouterModelsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    pricing?: {
      prompt: string;
      completion: string;
    };
    supported_parameters?: string[];
  }>;
}

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

/**
 * Fetch all models from OpenRouter
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data: OpenRouterModelsResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    throw error;
  }
}

/**
 * Filter free models that support function calling (tools)
 */
export function filterFreeModelsWithTools(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter(model => {
    // Check if model has :free in the ID or name
    const isFree = model.id.includes(':free') || model.name.includes(':free');

    // Check if model supports tools parameter
    const supportTools = model.supported_parameters?.includes('tools') ?? false;

    return isFree && supportTools;
  });
}

/**
 * Get free models that support function calling
 */
export async function getFreeModelsWithTools(): Promise<OpenRouterModel[]> {
  try {
    const allModels = await fetchOpenRouterModels();
    return filterFreeModelsWithTools(allModels);
  } catch (error) {
    console.error('Error getting free models:', error);
    throw error;
  }
}

/**
 * Format model for display
 */
export function formatModelName(model: OpenRouterModel): string {
  // Remove :free suffix for display
  const displayName = model.name.replace(':free', '').trim();
  const modelId = model.id.replace(':free', '').trim();

  return `${displayName} (${modelId})`;
}

export type OpenRouterDataPolicy = 'allow' | 'deny' | 'zdr';

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  canonical_slug?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
  supported_parameters?: string[];
};

type OpenRouterModelsResponse = {
  data?: unknown;
};

const OPENROUTER_MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models';

function isModel(value: unknown): value is OpenRouterModel {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}

export function isFreeOpenRouterModel(model: OpenRouterModel): boolean {
  if (model.id.endsWith(':free')) return true;
  const prompt = Number(model.pricing?.prompt);
  const completion = Number(model.pricing?.completion);
  return (
    Number.isFinite(prompt) &&
    Number.isFinite(completion) &&
    prompt === 0 &&
    completion === 0
  );
}

export function supportsOpenRouterTools(model: OpenRouterModel): boolean {
  return model.supported_parameters?.includes('tools') ?? false;
}

export async function fetchOpenRouterModels(
  apiKey: string,
  dataPolicy: OpenRouterDataPolicy,
  signal?: AbortSignal
): Promise<OpenRouterModel[]> {
  const url = new URL(OPENROUTER_MODELS_ENDPOINT);
  url.searchParams.set('output_modalities', 'text');
  url.searchParams.set('supported_parameters', 'tools');
  if (dataPolicy === 'zdr') url.searchParams.set('zdr', 'true');

  const response = await fetch(url, {
    headers: apiKey.trim()
      ? { Authorization: `Bearer ${apiKey.trim()}` }
      : undefined,
    signal,
  });
  let payload: OpenRouterModelsResponse;
  try {
    payload = (await response.json()) as OpenRouterModelsResponse;
  } catch (error) {
    throw new Error(
      `OpenRouter model catalog returned invalid JSON (${error instanceof Error ? error.message : 'unknown error'}).`
    );
  }
  if (!response.ok) {
    throw new Error(
      `OpenRouter model catalog request failed (HTTP ${response.status}).`
    );
  }
  if (!Array.isArray(payload.data)) return [];
  return payload.data.filter(isModel);
}

export function formatOpenRouterModel(model: OpenRouterModel): string {
  const suffix = isFreeOpenRouterModel(model) ? ' · free' : '';
  return `${model.name} (${model.id})${suffix}`;
}

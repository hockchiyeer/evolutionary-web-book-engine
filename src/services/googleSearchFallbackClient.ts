import type { SearchFallbackPayload } from '../types';

const SEARCH_FALLBACK_ROUTE = '/api/search-fallback';
const FALLBACK_FETCH_ATTEMPTS = 3;
const FALLBACK_FETCH_TIMEOUT_MS = 20000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchGoogleSearchFallback(query: string): Promise<SearchFallbackPayload> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= FALLBACK_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${SEARCH_FALLBACK_ROUTE}?query=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(FALLBACK_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        let errorMessage = 'Google Search fallback is currently unavailable.';

        try {
          const payload = await response.json() as { error?: string };
          if (payload.error) {
            errorMessage = payload.error;
          }
        } catch {
          // Ignore JSON parse failures and use the default message.
        }

        throw new Error(errorMessage);
      }

      return response.json() as Promise<SearchFallbackPayload>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Google Search fallback request failed.');

      if (attempt < FALLBACK_FETCH_ATTEMPTS) {
        await wait(800 * attempt);
        continue;
      }
    }
  }

  throw lastError || new Error('Google Search fallback is currently unavailable.');
}

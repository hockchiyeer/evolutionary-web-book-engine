import assert from 'node:assert/strict';
import {
  GEMINI_REQUEST_TIMEOUT_MS,
  buildGeminiUserFacingErrorMessage,
} from '../../src/services/geminiUserFacingErrors.ts';

assert.equal(
  GEMINI_REQUEST_TIMEOUT_MS,
  0,
  'Gemini requests should not be aborted by a hardcoded local timeout.'
);

const invalidApiKeyPayload = JSON.stringify({
  error: {
    code: 400,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'INVALID_ARGUMENT',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'API_KEY_INVALID',
        domain: 'googleapis.com',
      },
    ],
  },
});

assert.equal(
  buildGeminiUserFacingErrorMessage(new Error(invalidApiKeyPayload), 'invalid_api_key'),
  'Gemini API key was rejected by Google. Check GEMINI_API_KEY or VITE_GEMINI_API_KEY and try again.\n\nDetails: API key not valid. Please pass a valid API key.'
);

console.log('evolutionService Gemini-only regression checks passed');

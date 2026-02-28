/**
 * API key prefixes
 */
export const API_KEY_PREFIX_LIVE = 'sk_live_';
export const API_KEY_PREFIX_TEST = 'sk_test_';

/**
 * Retry configuration (shared between server and SDK)
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
} as const;

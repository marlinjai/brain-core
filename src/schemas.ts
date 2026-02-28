import { z } from 'zod';
import { API_KEY_PREFIX_LIVE, API_KEY_PREFIX_TEST } from './constants';

/**
 * UUID validation helper
 */
export const uuidSchema = z.string().uuid();

/**
 * API key validation
 */
export const apiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .refine(
    (key) => key.startsWith(API_KEY_PREFIX_LIVE) || key.startsWith(API_KEY_PREFIX_TEST),
    `API key must start with '${API_KEY_PREFIX_LIVE}' or '${API_KEY_PREFIX_TEST}'`
  );

/**
 * Pagination cursor (base64 encoded)
 */
export const cursorSchema = z
  .string()
  .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid cursor format')
  .optional();

/**
 * Workspace slug validation
 */
export const workspaceSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/, 'Slug must be lowercase alphanumeric with hyphens');

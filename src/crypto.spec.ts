import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  timingSafeEqual,
  generateId,
} from './crypto';
import { API_KEY_PREFIX_LIVE } from './constants';

// ---------- generateApiKey ----------

describe('generateApiKey', () => {
  it('uses the live prefix', () => {
    expect(generateApiKey().startsWith(API_KEY_PREFIX_LIVE)).toBe(true);
  });

  it('produces a base64url body without padding or non-url-safe characters', () => {
    const body = generateApiKey().slice(API_KEY_PREFIX_LIVE.length);
    expect(body).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(body).not.toContain('+');
    expect(body).not.toContain('/');
    expect(body).not.toContain('=');
  });

  it('encodes 24 random bytes (32 base64url characters)', () => {
    const body = generateApiKey().slice(API_KEY_PREFIX_LIVE.length);
    expect(body).toHaveLength(32);
  });

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => generateApiKey()));
    expect(keys.size).toBe(1000);
  });
});

// ---------- hashApiKey ----------

describe('hashApiKey', () => {
  it('returns a 64-character lowercase hex string', async () => {
    const hash = await hashApiKey('sk_live_example');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches a known SHA-256 vector', async () => {
    // SHA-256("abc")
    expect(await hashApiKey('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('is deterministic for the same input', async () => {
    const key = generateApiKey();
    expect(await hashApiKey(key)).toBe(await hashApiKey(key));
  });

  it('produces different hashes for different inputs', async () => {
    expect(await hashApiKey('sk_live_a')).not.toBe(await hashApiKey('sk_live_b'));
  });
});

// ---------- verifyApiKey ----------

describe('verifyApiKey', () => {
  it('verifies a key against its own hash', async () => {
    const key = generateApiKey();
    const hash = await hashApiKey(key);
    expect(await verifyApiKey(key, hash)).toBe(true);
  });

  it('rejects a key that does not match the hash', async () => {
    const hash = await hashApiKey(generateApiKey());
    expect(await verifyApiKey(generateApiKey(), hash)).toBe(false);
  });

  it('rejects when the stored hash is malformed', async () => {
    const key = generateApiKey();
    expect(await verifyApiKey(key, 'not-a-valid-hash')).toBe(false);
  });
});

// ---------- timingSafeEqual ----------

describe('timingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqual('hello', 'hello')).toBe(true);
  });

  it('returns true for two empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('returns false for equal-length but different strings', () => {
    expect(timingSafeEqual('hello', 'world')).toBe(false);
  });

  it('returns false for different-length strings', () => {
    expect(timingSafeEqual('short', 'longer string')).toBe(false);
  });

  it('distinguishes strings differing only in the final character', () => {
    expect(timingSafeEqual('abcdef', 'abcdeg')).toBe(false);
  });
});

// ---------- generateId ----------

describe('generateId', () => {
  it('returns a v4 UUID', () => {
    expect(generateId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});

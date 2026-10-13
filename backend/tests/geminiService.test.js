/**
 * Gemini Service Tests
 *
 * Runs with Node's built-in `assert` — no external test framework needed.
 * Execute: node tests/geminiService.test.js
 *
 * All tests use mocks — zero real API calls, zero quota consumption.
 */

const assert = require('assert');

// ---- Mock environment before requiring any project modules ----
process.env.GEMINI_API_KEY = 'test-key-not-real';
process.env.GEMINI_MODEL = 'gemini-3.5-flash';
process.env.GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite';

// ---- Require modules after environment is set ----
const {
  classifyGeminiError,
  isRetryableGeminiError,
  formatGeminiHistory,
  jitteredDelay,
  computeRetryDelay,
  MAX_GEMINI_ATTEMPTS,
  RETRY_BASE_DELAYS_MS,
  getGeminiTimeoutMs
} = require('../services/geminiService');

const {
  getGeminiModelName,
  getGeminiFallbackModelName,
  validateGeminiConfig,
  sanitizeApiKey,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_FALLBACK_MODEL
} = require('../config/gemini');

// Keep a running count
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ===========================================================================
// CONFIG TESTS
// ===========================================================================
console.log('\n▸ Config: getGeminiModelName');

test('returns env-configured model', () => {
  assert.strictEqual(getGeminiModelName(), 'gemini-3.5-flash');
});

test('defaults match constants', () => {
  assert.strictEqual(DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash');
  assert.strictEqual(DEFAULT_GEMINI_FALLBACK_MODEL, 'gemini-3.5-flash-lite');
});

console.log('\n▸ Config: getGeminiFallbackModelName');

test('returns fallback different from primary', () => {
  assert.strictEqual(getGeminiFallbackModelName(), 'gemini-3.5-flash-lite');
});

test('returns null when fallback equals primary', () => {
  const orig = process.env.GEMINI_FALLBACK_MODEL;
  process.env.GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash';
  assert.strictEqual(getGeminiFallbackModelName(), null);
  process.env.GEMINI_FALLBACK_MODEL = orig;
});

console.log('\n▸ Config: sanitizeApiKey');

test('trims whitespace', () => {
  assert.strictEqual(sanitizeApiKey('  mykey  '), 'mykey');
});

test('strips surrounding double quotes', () => {
  assert.strictEqual(sanitizeApiKey('"mykey"'), 'mykey');
});

test('strips surrounding single quotes', () => {
  assert.strictEqual(sanitizeApiKey("'mykey'"), 'mykey');
});

test('returns empty string for undefined', () => {
  assert.strictEqual(sanitizeApiKey(undefined), '');
});

console.log('\n▸ Config: validateGeminiConfig');

test('reports apiKeySet true when key is present', () => {
  const config = validateGeminiConfig();
  assert.strictEqual(config.apiKeySet, true);
  assert.strictEqual(config.primaryModel, 'gemini-3.5-flash');
  assert.strictEqual(config.fallbackModel, 'gemini-3.5-flash-lite');
  assert.strictEqual(config.errors.length, 0);
});

test('reports apiKeySet false when key is missing', () => {
  const orig = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const config = validateGeminiConfig();
  assert.strictEqual(config.apiKeySet, false);
  assert.ok(config.errors.length > 0);
  process.env.GEMINI_API_KEY = orig;
});

// ===========================================================================
// ERROR CLASSIFICATION TESTS
// ===========================================================================
console.log('\n▸ classifyGeminiError: errorDetails-based classification');

test('API_KEY_INVALID via errorDetails → GEMINI_AUTH, not retryable', () => {
  const error = {
    status: 400,
    message: '[GoogleGenerativeAI Error]: [400 Bad Request] API key not valid.',
    errorDetails: [
      { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID', domain: 'googleapis.com' }
    ]
  };
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_AUTH');
  assert.strictEqual(result.retryable, false);
  assert.strictEqual(result.status, 500);
});

test('RESOURCE_EXHAUSTED via errorDetails → GEMINI_RATE_LIMITED, retryable', () => {
  const error = {
    status: 429,
    message: '[429 Too Many Requests] Resource exhausted.',
    errorDetails: [
      { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'RESOURCE_EXHAUSTED' }
    ]
  };
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_RATE_LIMITED');
  assert.strictEqual(result.retryable, true);
  assert.strictEqual(result.status, 429);
});

test('RESOURCE_EXHAUSTED with retryDelay metadata → retryAfterMs is set', () => {
  const error = {
    status: 429,
    message: '[429] Resource exhausted.',
    errorDetails: [
      {
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RESOURCE_EXHAUSTED',
        metadata: { retryDelay: '30' }
      }
    ]
  };
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_RATE_LIMITED');
  assert.strictEqual(result.retryAfterMs, 30000);
});

test('MODEL_NOT_FOUND via errorDetails → GEMINI_MODEL_NOT_FOUND, not retryable', () => {
  const error = {
    status: 404,
    message: 'models/fake-model is not found',
    errorDetails: [
      { reason: 'MODEL_NOT_FOUND' }
    ]
  };
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_MODEL_NOT_FOUND');
  assert.strictEqual(result.retryable, false);
});

test('PERMISSION_DENIED via errorDetails → GEMINI_AUTH', () => {
  const error = {
    status: 403,
    message: 'Permission denied.',
    errorDetails: [{ reason: 'PERMISSION_DENIED' }]
  };
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_AUTH');
  assert.strictEqual(result.retryable, false);
});

console.log('\n▸ classifyGeminiError: HTTP status-based classification');

test('status 401 → GEMINI_AUTH, not retryable', () => {
  const result = classifyGeminiError({ status: 401, message: 'Unauthorized' });
  assert.strictEqual(result.code, 'GEMINI_AUTH');
  assert.strictEqual(result.retryable, false);
});

test('status 403 → GEMINI_AUTH, not retryable', () => {
  const result = classifyGeminiError({ status: 403, message: 'Forbidden' });
  assert.strictEqual(result.code, 'GEMINI_AUTH');
  assert.strictEqual(result.retryable, false);
});

test('status 404 → GEMINI_MODEL_NOT_FOUND, not retryable', () => {
  const result = classifyGeminiError({ status: 404, message: 'Not found' });
  assert.strictEqual(result.code, 'GEMINI_MODEL_NOT_FOUND');
  assert.strictEqual(result.retryable, false);
});

test('status 400 (generic) → GEMINI_INVALID_REQUEST, not retryable', () => {
  const result = classifyGeminiError({ status: 400, message: 'Invalid request body' });
  assert.strictEqual(result.code, 'GEMINI_INVALID_REQUEST');
  assert.strictEqual(result.retryable, false);
});

test('status 400 with "api key not valid" message → GEMINI_AUTH (not INVALID_REQUEST)', () => {
  const result = classifyGeminiError({
    status: 400,
    message: '[400 Bad Request] API key not valid. Please pass a valid API key.'
  });
  assert.strictEqual(result.code, 'GEMINI_AUTH');
  assert.strictEqual(result.retryable, false);
});

test('status 429 → GEMINI_RATE_LIMITED, retryable', () => {
  const result = classifyGeminiError({ status: 429, message: 'Too many requests' });
  assert.strictEqual(result.code, 'GEMINI_RATE_LIMITED');
  assert.strictEqual(result.retryable, true);
  assert.strictEqual(result.status, 429);
});

test('status 503 → GEMINI_OVERLOADED, retryable', () => {
  const result = classifyGeminiError({ status: 503, message: 'Service unavailable' });
  assert.strictEqual(result.code, 'GEMINI_OVERLOADED');
  assert.strictEqual(result.retryable, true);
});

test('status 500 → GEMINI_OVERLOADED, retryable', () => {
  const result = classifyGeminiError({ status: 500, message: 'Internal error' });
  assert.strictEqual(result.code, 'GEMINI_OVERLOADED');
  assert.strictEqual(result.retryable, true);
});

test('status 502 → GEMINI_OVERLOADED, retryable', () => {
  const result = classifyGeminiError({ status: 502, message: 'Bad gateway' });
  assert.strictEqual(result.code, 'GEMINI_OVERLOADED');
  assert.strictEqual(result.retryable, true);
});

test('status 504 → GEMINI_OVERLOADED, retryable', () => {
  const result = classifyGeminiError({ status: 504, message: 'Gateway timeout' });
  assert.strictEqual(result.code, 'GEMINI_OVERLOADED');
  assert.strictEqual(result.retryable, true);
});

console.log('\n▸ classifyGeminiError: message heuristic classification');

test('"rate limit" in message → GEMINI_RATE_LIMITED', () => {
  const result = classifyGeminiError({ message: 'Rate limit exceeded' });
  assert.strictEqual(result.code, 'GEMINI_RATE_LIMITED');
  assert.strictEqual(result.retryable, true);
});

test('"resource_exhausted" in message → GEMINI_RATE_LIMITED', () => {
  const result = classifyGeminiError({ message: 'RESOURCE_EXHAUSTED' });
  assert.strictEqual(result.code, 'GEMINI_RATE_LIMITED');
  assert.strictEqual(result.retryable, true);
});

test('"model not found" in message → GEMINI_MODEL_NOT_FOUND', () => {
  const result = classifyGeminiError({ message: 'Model not found for the given ID' });
  assert.strictEqual(result.code, 'GEMINI_MODEL_NOT_FOUND');
});

test('"safety" in message → GEMINI_INVALID_REQUEST', () => {
  const result = classifyGeminiError({ message: 'Content blocked by safety filters' });
  assert.strictEqual(result.code, 'GEMINI_INVALID_REQUEST');
  assert.strictEqual(result.retryable, false);
});

console.log('\n▸ classifyGeminiError: pre-classified errors pass through');

test('GEMINI_NOT_CONFIGURED code passes through', () => {
  const error = new Error('Not configured');
  error.code = 'GEMINI_NOT_CONFIGURED';
  error.status = 500;
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_NOT_CONFIGURED');
  assert.strictEqual(result.retryable, false);
});

test('GEMINI_INVALID_RESPONSE code passes through', () => {
  const error = new Error('Bad parse');
  error.code = 'GEMINI_INVALID_RESPONSE';
  error.status = 502;
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_INVALID_RESPONSE');
  assert.strictEqual(result.retryable, false);
});

test('GEMINI_TIMEOUT code passes through as retryable', () => {
  const error = new Error('Timed out');
  error.code = 'GEMINI_TIMEOUT';
  error.status = 503;
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_TIMEOUT');
  assert.strictEqual(result.retryable, true);
});

test('GEMINI_MODEL_MISCONFIGURED code passes through', () => {
  const error = new Error('Misconfigured');
  error.code = 'GEMINI_MODEL_MISCONFIGURED';
  error.status = 500;
  const result = classifyGeminiError(error);
  assert.strictEqual(result.code, 'GEMINI_MODEL_MISCONFIGURED');
  assert.strictEqual(result.retryable, false);
});

test('unknown error → GEMINI_FAILED, not retryable', () => {
  const result = classifyGeminiError({ message: 'Something weird happened' });
  assert.strictEqual(result.code, 'GEMINI_FAILED');
  assert.strictEqual(result.retryable, false);
});

// ===========================================================================
// isRetryableGeminiError
// ===========================================================================
console.log('\n▸ isRetryableGeminiError');

test('429 is retryable', () => {
  assert.strictEqual(isRetryableGeminiError({ status: 429 }), true);
});

test('503 is retryable', () => {
  assert.strictEqual(isRetryableGeminiError({ status: 503 }), true);
});

test('401 is not retryable', () => {
  assert.strictEqual(isRetryableGeminiError({ status: 401 }), false);
});

test('404 is not retryable', () => {
  assert.strictEqual(isRetryableGeminiError({ status: 404 }), false);
});

// ===========================================================================
// JITTER & DELAY TESTS
// ===========================================================================
console.log('\n▸ jitteredDelay');

test('jittered delay is within ±30% of base', () => {
  const base = 2000;
  for (let i = 0; i < 50; i++) {
    const d = jitteredDelay(base);
    assert.ok(d >= base * 0.7, `${d} < ${base * 0.7}`);
    assert.ok(d <= base * 1.3, `${d} > ${base * 1.3}`);
  }
});

test('jittered delay is not always the same (randomness)', () => {
  const values = new Set();
  for (let i = 0; i < 20; i++) {
    values.add(jitteredDelay(2000));
  }
  assert.ok(values.size > 1, 'Expected multiple distinct jittered values');
});

console.log('\n▸ computeRetryDelay');

test('uses Retry-After from classified error when available', () => {
  const classified = { retryAfterMs: 5000 };
  const delay = computeRetryDelay(0, classified);
  assert.strictEqual(delay, 5000);
});

test('clamps Retry-After to max 10000ms', () => {
  const classified = { retryAfterMs: 60000 };
  const delay = computeRetryDelay(0, classified);
  assert.strictEqual(delay, 10000);
});

test('clamps Retry-After to min 500ms', () => {
  const classified = { retryAfterMs: 100 };
  const delay = computeRetryDelay(0, classified);
  assert.strictEqual(delay, 500);
});

test('falls back to jittered base delay when no Retry-After', () => {
  const classified = { retryAfterMs: null };
  const delay = computeRetryDelay(0, classified);
  const base = RETRY_BASE_DELAYS_MS[0]; // 1500
  assert.ok(delay >= base * 0.7);
  assert.ok(delay <= base * 1.3);
});

// ===========================================================================
// FORMAT GEMINI HISTORY
// ===========================================================================
console.log('\n▸ formatGeminiHistory');

test('maps user/assistant roles correctly', () => {
  const history = [
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello!' }
  ];
  const result = formatGeminiHistory(history);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].role, 'user');
  assert.strictEqual(result[1].role, 'model');
});

test('skips leading model messages', () => {
  const history = [
    { role: 'assistant', content: 'I am a bot' },
    { role: 'user', content: 'Hi' }
  ];
  const result = formatGeminiHistory(history);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].role, 'user');
});

test('merges consecutive same-role messages', () => {
  const history = [
    { role: 'user', content: 'Part 1' },
    { role: 'user', content: 'Part 2' }
  ];
  const result = formatGeminiHistory(history);
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].parts[0].text.includes('Part 1'));
  assert.ok(result[0].parts[0].text.includes('Part 2'));
});

test('handles empty history', () => {
  assert.deepStrictEqual(formatGeminiHistory([]), []);
  assert.deepStrictEqual(formatGeminiHistory(undefined), []);
  assert.deepStrictEqual(formatGeminiHistory(null), []);
});

test('skips invalid items', () => {
  const history = [null, undefined, 'string', { role: 'user', content: '' }];
  assert.deepStrictEqual(formatGeminiHistory(history), []);
});

test('maps consultant/student sender aliases', () => {
  const history = [
    { sender: 'student', content: 'Hi' },
    { sender: 'consultant', content: 'Hello' }
  ];
  const result = formatGeminiHistory(history);
  assert.strictEqual(result[0].role, 'user');
  assert.strictEqual(result[1].role, 'model');
});

// ===========================================================================
// TIMEOUT CONFIG
// ===========================================================================
console.log('\n▸ getGeminiTimeoutMs');

test('returns default 25000 when no env var', () => {
  delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
  assert.strictEqual(getGeminiTimeoutMs(), 25000);
});

test('respects env override', () => {
  process.env.GEMINI_REQUEST_TIMEOUT_MS = '10000';
  assert.strictEqual(getGeminiTimeoutMs(), 10000);
  delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
});

test('clamps to 120000ms max', () => {
  process.env.GEMINI_REQUEST_TIMEOUT_MS = '999999';
  assert.strictEqual(getGeminiTimeoutMs(), 120000);
  delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
});

test('ignores invalid values', () => {
  process.env.GEMINI_REQUEST_TIMEOUT_MS = 'abc';
  assert.strictEqual(getGeminiTimeoutMs(), 25000);
  delete process.env.GEMINI_REQUEST_TIMEOUT_MS;
});

// ===========================================================================
// CONSTANTS
// ===========================================================================
console.log('\n▸ Constants');

test('MAX_GEMINI_ATTEMPTS is 3', () => {
  assert.strictEqual(MAX_GEMINI_ATTEMPTS, 3);
});

test('RETRY_BASE_DELAYS_MS is [1500, 3000]', () => {
  assert.deepStrictEqual(RETRY_BASE_DELAYS_MS, [1500, 3000]);
});

// ===========================================================================
// SUMMARY
// ===========================================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
}

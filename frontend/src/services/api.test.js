import { describe, expect, it } from 'vitest';
import { extractErrorMessage } from './api';

describe('extractErrorMessage', () => {
  it('returns a plain string detail unchanged', () => {
    const err = { response: { data: { detail: 'Email already registered' } } };
    expect(extractErrorMessage(err, 'fallback')).toBe('Email already registered');
  });

  it('flattens a FastAPI 422 validation-error array instead of crashing on render', () => {
    // This is the exact shape FastAPI returns for a Pydantic validation
    // error - a component that did setError(err.response.data.detail)
    // directly would try to render this array as a React child and crash.
    const err = {
      response: {
        data: {
          detail: [
            { loc: ['body', 'email'], msg: 'field required', type: 'value_error.missing' },
            { loc: ['body', 'password'], msg: 'ensure this value has at least 6 characters', type: 'value_error' },
          ],
        },
      },
    };
    const message = extractErrorMessage(err, 'fallback');
    expect(typeof message).toBe('string');
    expect(message).toContain('field required');
    expect(message).toContain('ensure this value has at least 6 characters');
  });

  it('falls back to data.message when detail is absent', () => {
    const err = { response: { data: { message: 'Something went wrong' } } };
    expect(extractErrorMessage(err, 'fallback')).toBe('Something went wrong');
  });

  it('falls back to the provided default when nothing usable is present', () => {
    expect(extractErrorMessage({}, 'fallback')).toBe('fallback');
    expect(extractErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback');
    expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});

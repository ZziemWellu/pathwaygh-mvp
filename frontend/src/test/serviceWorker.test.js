import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Runs the real public/sw.js with a fake browser around it.
const loadWorker = ({ network, stored = {} }) => {
  const listeners = {};
  const puts = [];
  const cache = { put: vi.fn(async (request) => puts.push(request.url || request)), addAll: vi.fn(async () => {}) };
  const context = {
    self: { addEventListener: (type, fn) => { listeners[type] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: {
      open: async () => cache,
      match: async (request) => stored[request.url || request],
      keys: async () => [],
      delete: async () => true,
    },
    fetch: network,
    URL,
    Response,
    Promise,
    JSON,
    console: { log: () => {} },
  };
  vm.runInNewContext(readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8'), context);
  const send = (url) => new Promise((done) => {
    listeners.fetch({
      request: { url, method: 'GET' },
      respondWith: (result) => done(Promise.resolve(result)),
    });
  });
  return { send, puts, cache };
};

const okResponse = () => ({ status: 200, clone: () => okResponse(), json: async () => ({ fresh: true }) });
const API = 'https://api.learninghotspot.africa';

describe('service worker', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    '/api/auth/me',
    '/api/profile/me',
    '/api/school/dashboard',
    '/api/learn/courses',
    '/api/practice/subjects',
    '/api/dashboard/summary',
  ])('never stores signed-in data from %s', async (path) => {
    const { send, puts } = loadWorker({ network: async () => okResponse() });
    await send(`${API}${path}`);
    await new Promise((r) => setTimeout(r));
    expect(puts).toEqual([]);
  });

  it('does not show anything saved earlier for a signed-in address when offline', async () => {
    const url = `${API}/api/profile/me`;
    const { send } = loadWorker({
      network: async () => { throw new Error('offline'); },
      stored: { [url]: new Response('{"full_name":"Another Child"}') },
    });
    const response = await send(url);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Another Child');
  });

  it('keeps public career and university information for offline reading', async () => {
    const url = `${API}/api/explore/careers`;
    const { send, puts } = loadWorker({ network: async () => okResponse() });
    await send(url);
    await new Promise((r) => setTimeout(r));
    expect(puts).toEqual([url]);
  });
});

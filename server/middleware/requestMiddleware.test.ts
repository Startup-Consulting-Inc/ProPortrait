// @vitest-environment node
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { configureRequestMiddleware } from './requestMiddleware.js';

const servers: Server[] = [];
const firebaseOrigin = 'https://portrait-7b01d.web.app';

async function startApi(corsOrigin = ''): Promise<string> {
  const app = express();
  configureRequestMiddleware(app, corsOrigin);
  app.post('/api/payments/webhook', (req, res) => {
    res.json({ raw: Buffer.isBuffer(req.body), body: req.body.toString() });
  });
  // Stand in for authentication and routing: preflight must finish before this.
  app.use((_req, res) => res.status(401).json({ error: 'Authentication required.' }));
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    if (!server.listening) {
      resolve();
      return;
    }
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
});

async function preflight(base: string, origin: string, endpoint = '/api/events/track') {
  return fetch(`${base}${endpoint}`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
}

describe('API CORS', () => {
  it.each(['/api/events/track', '/api/settings/snapshot', '/api/portraits/generate'])(
    'allows credentialed Firebase preflight for %s before authentication', async endpoint => {
      const response = await preflight(await startApi(), firebaseOrigin, endpoint);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(firebaseOrigin);
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('authorization,content-type');
      expect(response.headers.get('Vary')).toContain('Origin');
    },
  );

  it.each(['https://portrait-7b01d.firebaseapp.com', 'https://portrait.ai-biz.app', 'https://proportrait.ai', 'http://localhost:3000'])(
    'keeps the default frontend origin %s allowed', async origin => {
      const response = await preflight(await startApi(), origin);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    },
  );

  it('trims a configured allowlist and keeps it authoritative', async () => {
    const base = await startApi(` https://custom.example, ${firebaseOrigin} , `);
    const allowed = await preflight(base, firebaseOrigin);
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(firebaseOrigin);
    const excluded = await preflight(base, 'https://proportrait.ai');
    expect(excluded.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('does not allow unrelated origins', async () => {
    const response = await preflight(await startApi(), 'https://unrelated.example');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('includes CORS headers on authentication errors', async () => {
    const response = await fetch(`${await startApi()}/api/portraits/generate`, {
      method: 'POST',
      headers: { Origin: firebaseOrigin, 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(firebaseOrigin);
  });

  it('includes CORS headers when JSON parsing fails', async () => {
    const response = await fetch(`${await startApi()}/api/settings/snapshot`, {
      method: 'POST',
      headers: { Origin: firebaseOrigin, 'Content-Type': 'application/json' },
      body: '{invalid',
    });
    expect(response.status).toBe(400);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(firebaseOrigin);
  });

  it('preserves the Stripe webhook raw body', async () => {
    const body = '{ "event": "checkout.session.completed" }';
    const response = await fetch(`${await startApi()}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(await response.json()).toEqual({ raw: true, body });
  });
});

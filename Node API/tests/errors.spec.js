import { test, expect } from '@playwright/test';

test.describe('404 / unknown routes', () => {
  test('GET /api/nonexistent returns 404 with success:false', async ({ request }) => {
    const response = await request.get('/api/nonexistent');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
  });

  test('GET /notaroute returns 404', async ({ request }) => {
    const response = await request.get('/notaroute');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/categories/extra returns 404 (no sub-routes on categories)', async ({ request }) => {
    const response = await request.get('/api/categories/extra');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

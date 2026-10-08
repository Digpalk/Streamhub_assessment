import { test, expect } from '@playwright/test';

const EXPECTED_CATEGORIES = ['Books', 'Clothing', 'Electronics', 'Home', 'Toys'];

test.describe('GET /api/categories', () => {
  test('returns 200 with success:true and a data array', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('returns all 5 categories sorted alphabetically', async ({ request }) => {
    const response = await request.get('/api/categories');
    const body = await response.json();
    expect(body.data).toEqual(EXPECTED_CATEGORIES);
  });

  test('all category entries are strings', async ({ request }) => {
    const response = await request.get('/api/categories');
    const body = await response.json();
    body.data.forEach(cat => expect(typeof cat).toBe('string'));
  });

  test('response has no meta field', async ({ request }) => {
    const response = await request.get('/api/categories');
    const body = await response.json();
    expect(body.meta).toBeUndefined();
  });
});

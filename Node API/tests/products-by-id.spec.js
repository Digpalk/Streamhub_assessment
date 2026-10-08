import { test, expect } from '@playwright/test';

test.describe('GET /api/products/:id', () => {
  test.describe('happy path', () => {
    test('GET /api/products/1 returns Wireless Bluetooth Headphones', async ({ request }) => {
      const response = await request.get('/api/products/1');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 1,
        name: 'Wireless Bluetooth Headphones',
        price: 59.99,
        category: 'Electronics',
        inStock: true,
      });
    });

    test('GET /api/products/17 returns Atomic Habits with correct fields', async ({ request }) => {
      const response = await request.get('/api/products/17');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 17,
        name: 'Atomic Habits',
        category: 'Books',
        rating: 4.9,
        inStock: true,
      });
    });

    test('GET /api/products/25 returns last product (boundary check)', async ({ request }) => {
      const response = await request.get('/api/products/25');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ id: 25, name: 'Drone with HD Camera' });
    });

    test('single product response has data object but no meta', async ({ request }) => {
      const response = await request.get('/api/products/1');
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe('object');
      expect(Array.isArray(body.data)).toBe(false);
      expect(body.meta).toBeUndefined();
    });
  });

  test.describe('invalid id / not found', () => {
    test('GET /api/products/abc returns 400', async ({ request }) => {
      const response = await request.get('/api/products/abc');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(typeof body.error).toBe('string');
    });

    test('GET /api/products/0 returns 400 (zero is not a valid id)', async ({ request }) => {
      const response = await request.get('/api/products/0');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('GET /api/products/-1 returns 400 (negative id)', async ({ request }) => {
      const response = await request.get('/api/products/-1');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('GET /api/products/1.5 returns 400 (non-integer id)', async ({ request }) => {
      const response = await request.get('/api/products/1.5');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('GET /api/products/9999 returns 404 with id in error message', async ({ request }) => {
      const response = await request.get('/api/products/9999');
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('9999');
    });
  });
});

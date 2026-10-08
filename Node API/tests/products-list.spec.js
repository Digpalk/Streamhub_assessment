import { test, expect } from '@playwright/test';

test.describe('GET /api/products', () => {
  test.describe('happy path', () => {
    test('default (no params) returns 10 of 25 products on page 1', async ({ request }) => {
      const response = await request.get('/api/products');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(10);
      expect(body.meta).toMatchObject({ total: 25, page: 1, limit: 10, totalPages: 3 });
    });

    test('each product item has the expected shape', async ({ request }) => {
      const response = await request.get('/api/products?limit=1');
      const body = await response.json();
      const p = body.data[0];
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(typeof p.price).toBe('number');
      expect(typeof p.category).toBe('string');
      expect(typeof p.rating).toBe('number');
      expect(typeof p.inStock).toBe('boolean');
      expect(typeof p.description).toBe('string');
    });

    test('category=Electronics returns exactly 5 electronics products', async ({ request }) => {
      const response = await request.get('/api/products?category=Electronics&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta.total).toBe(5);
      body.data.forEach(p => expect(p.category).toBe('Electronics'));
    });

    test('category filter is case-insensitive (books matches Books)', async ({ request }) => {
      const response = await request.get('/api/products?category=books&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta.total).toBe(5);
      body.data.forEach(p => expect(p.category).toBe('Books'));
    });

    test('minPrice=50 returns only products priced >= 50', async ({ request }) => {
      const response = await request.get('/api/products?minPrice=50&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(p => expect(p.price).toBeGreaterThanOrEqual(50));
    });

    test('maxPrice=30 returns only products priced <= 30', async ({ request }) => {
      const response = await request.get('/api/products?maxPrice=30&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(p => expect(p.price).toBeLessThanOrEqual(30));
    });

    test('minPrice=20&maxPrice=50 returns products within that range', async ({ request }) => {
      const response = await request.get('/api/products?minPrice=20&maxPrice=50&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.length).toBeGreaterThan(0);
      body.data.forEach(p => {
        expect(p.price).toBeGreaterThanOrEqual(20);
        expect(p.price).toBeLessThanOrEqual(50);
      });
    });

    test('inStock=true returns only in-stock products (21 total)', async ({ request }) => {
      const response = await request.get('/api/products?inStock=true&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta.total).toBe(21);
      body.data.forEach(p => expect(p.inStock).toBe(true));
    });

    test('inStock=false returns only out-of-stock products (4 total)', async ({ request }) => {
      const response = await request.get('/api/products?inStock=false&limit=100');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta.total).toBe(4);
      body.data.forEach(p => expect(p.inStock).toBe(false));
    });

    test('q=phone matches name substring and returns 2 products', async ({ request }) => {
      const response = await request.get('/api/products?q=phone');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta.total).toBe(2);
      const names = body.data.map(p => p.name);
      expect(names).toContain('Wireless Bluetooth Headphones');
      expect(names).toContain('Smartphone X200');
    });

    test('q with no matches returns empty data and total=0', async ({ request }) => {
      const response = await request.get('/api/products?q=nosuchproductxyz');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body.meta.total).toBe(0);
    });

    test('sortBy=price order=asc returns products sorted cheapest first', async ({ request }) => {
      const response = await request.get('/api/products?sortBy=price&order=asc&limit=25');
      expect(response.status()).toBe(200);
      const body = await response.json();
      const prices = body.data.map(p => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
      expect(body.data[0].name).toBe('Scented Soy Candle');
    });

    test('sortBy=price order=desc returns products sorted most expensive first', async ({ request }) => {
      const response = await request.get('/api/products?sortBy=price&order=desc&limit=25');
      expect(response.status()).toBe(200);
      const body = await response.json();
      const prices = body.data.map(p => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
      expect(body.data[0].name).toBe('Smartphone X200');
    });

    test('sortBy=name order=asc returns products sorted alphabetically', async ({ request }) => {
      const response = await request.get('/api/products?sortBy=name&order=asc&limit=25');
      expect(response.status()).toBe(200);
      const body = await response.json();
      const names = body.data.map(p => p.name);
      for (let i = 1; i < names.length; i++) {
        expect(names[i].localeCompare(names[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    test('sortBy=rating order=asc returns products sorted by rating low to high', async ({ request }) => {
      const response = await request.get('/api/products?sortBy=rating&order=asc&limit=25');
      expect(response.status()).toBe(200);
      const body = await response.json();
      const ratings = body.data.map(p => p.rating);
      for (let i = 1; i < ratings.length; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i - 1]);
      }
    });

    test('page=2 limit=5 returns second page with correct meta', async ({ request }) => {
      const response = await request.get('/api/products?page=2&limit=5');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta).toMatchObject({ total: 25, page: 2, limit: 5, totalPages: 5 });
      expect(body.data).toHaveLength(5);
    });

    test('page=3 limit=10 is last page with 5 remaining products', async ({ request }) => {
      const response = await request.get('/api/products?page=3&limit=10');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meta).toMatchObject({ total: 25, page: 3, limit: 10, totalPages: 3 });
      expect(body.data).toHaveLength(5);
    });

    test('combined: Electronics $50–$300 desc by price returns 2 products in correct order', async ({ request }) => {
      const response = await request.get(
        '/api/products?category=Electronics&minPrice=50&maxPrice=300&sortBy=price&order=desc&limit=10'
      );
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.meta.total).toBe(2);
      expect(body.data[0].name).toBe('Mechanical Gaming Keyboard');
      expect(body.data[1].name).toBe('Wireless Bluetooth Headphones');
      body.data.forEach(p => {
        expect(p.category).toBe('Electronics');
        expect(p.price).toBeGreaterThanOrEqual(50);
        expect(p.price).toBeLessThanOrEqual(300);
      });
    });
  });

  test.describe('invalid parameters', () => {
    test('sortBy=bogus returns 400 with error mentioning "sortBy"', async ({ request }) => {
      const response = await request.get('/api/products?sortBy=bogus');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"sortBy"');
    });

    test('order=sideways returns 400 with error mentioning "order"', async ({ request }) => {
      const response = await request.get('/api/products?order=sideways');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"order"');
    });

    test('inStock=maybe returns 400 with error mentioning "inStock"', async ({ request }) => {
      const response = await request.get('/api/products?inStock=maybe');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"inStock"');
    });

    test('minPrice=cheap returns 400 with error mentioning "minPrice"', async ({ request }) => {
      const response = await request.get('/api/products?minPrice=cheap');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"minPrice"');
    });

    test('maxPrice=verymuch returns 400 with error mentioning "maxPrice"', async ({ request }) => {
      const response = await request.get('/api/products?maxPrice=verymuch');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"maxPrice"');
    });

    test('minPrice=100&maxPrice=10 (min > max) returns 400', async ({ request }) => {
      const response = await request.get('/api/products?minPrice=100&maxPrice=10');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"minPrice"');
    });

    test('minPrice=-5 (negative) returns 400', async ({ request }) => {
      const response = await request.get('/api/products?minPrice=-5');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"minPrice"');
    });

    test('maxPrice=-1 (negative) returns 400', async ({ request }) => {
      const response = await request.get('/api/products?maxPrice=-1');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"maxPrice"');
    });

    test('limit=500 (exceeds max 100) returns 400', async ({ request }) => {
      const response = await request.get('/api/products?limit=500');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"limit"');
    });

    test('limit=0 returns 400', async ({ request }) => {
      const response = await request.get('/api/products?limit=0');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('limit=-1 returns 400', async ({ request }) => {
      const response = await request.get('/api/products?limit=-1');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('page=0 returns 400', async ({ request }) => {
      const response = await request.get('/api/products?page=0');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('page=-3 returns 400', async ({ request }) => {
      const response = await request.get('/api/products?page=-3');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('page=1.5 (non-integer) returns 400', async ({ request }) => {
      const response = await request.get('/api/products?page=1.5');
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('"page"');
    });
  });
});

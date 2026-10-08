import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'products.json');

const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

function filterProducts(items, { category, minPrice, maxPrice, inStock }) {
  return items.filter((product) => {
    if (category !== undefined && product.category.toLowerCase() !== category.toLowerCase()) return false;
    if (minPrice !== undefined && product.price < minPrice) return false;
    if (maxPrice !== undefined && product.price > maxPrice) return false;
    if (inStock !== undefined && product.inStock !== inStock) return false;
    return true;
  });
}

function searchProducts(items, q) {
  if (!q) return items;
  const needle = q.toLowerCase();
  return items.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) || product.description.toLowerCase().includes(needle)
  );
}

function sortProducts(items, sortBy, order) {
  if (!sortBy) return items;
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1 * direction;
    if (a[sortBy] > b[sortBy]) return 1 * direction;
    return 0;
  });
}

function paginate(items, page, limit) {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, meta: { total, page, limit, totalPages } };
}

export function listProducts(query) {
  const filtered = filterProducts(products, query);
  const searched = searchProducts(filtered, query.q);
  const sorted = sortProducts(searched, query.sortBy, query.order);
  return paginate(sorted, query.page, query.limit);
}

export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function listCategories() {
  return [...new Set(products.map((product) => product.category))].sort();
}

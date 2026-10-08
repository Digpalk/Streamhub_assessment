import { ApiError } from './ApiError.js';

const ALLOWED_SORT_FIELDS = ['price', 'rating', 'name'];
const ALLOWED_ORDERS = ['asc', 'desc'];
const MAX_LIMIT = 100;

function parseNumber(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new ApiError(400, `Query parameter "${fieldName}" must be a valid number, received "${value}".`);
  }
  return num;
}

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError(400, `Query parameter "${fieldName}" must be "true" or "false", received "${value}".`);
}

function parsePositiveInt(value, fieldName, { defaultValue, max } = {}) {
  if (value === undefined) return defaultValue;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(400, `Query parameter "${fieldName}" must be a positive integer, received "${value}".`);
  }
  if (max !== undefined && num > max) {
    throw new ApiError(400, `Query parameter "${fieldName}" must not exceed ${max}, received "${value}".`);
  }
  return num;
}

export function validateProductListQuery(query) {
  const { category, minPrice, maxPrice, inStock, q, sortBy, order, page, limit } = query;

  const parsed = {
    category: category !== undefined ? String(category).trim() : undefined,
    q: q !== undefined ? String(q).trim() : undefined,
    minPrice: minPrice !== undefined ? parseNumber(minPrice, 'minPrice') : undefined,
    maxPrice: maxPrice !== undefined ? parseNumber(maxPrice, 'maxPrice') : undefined,
    inStock: inStock !== undefined ? parseBoolean(inStock, 'inStock') : undefined,
    sortBy: sortBy !== undefined ? String(sortBy) : undefined,
    order: order !== undefined ? String(order).toLowerCase() : 'asc',
    page: parsePositiveInt(page, 'page', { defaultValue: 1 }),
    limit: parsePositiveInt(limit, 'limit', { defaultValue: 10, max: MAX_LIMIT }),
  };

  if (parsed.minPrice !== undefined && parsed.minPrice < 0) {
    throw new ApiError(400, 'Query parameter "minPrice" must not be negative.');
  }
  if (parsed.maxPrice !== undefined && parsed.maxPrice < 0) {
    throw new ApiError(400, 'Query parameter "maxPrice" must not be negative.');
  }
  if (parsed.minPrice !== undefined && parsed.maxPrice !== undefined && parsed.minPrice > parsed.maxPrice) {
    throw new ApiError(
      400,
      `Query parameter "minPrice" (${parsed.minPrice}) must not be greater than "maxPrice" (${parsed.maxPrice}).`
    );
  }
  if (parsed.sortBy !== undefined && !ALLOWED_SORT_FIELDS.includes(parsed.sortBy)) {
    throw new ApiError(
      400,
      `Query parameter "sortBy" must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}. Received "${parsed.sortBy}".`
    );
  }
  if (!ALLOWED_ORDERS.includes(parsed.order)) {
    throw new ApiError(
      400,
      `Query parameter "order" must be one of: ${ALLOWED_ORDERS.join(', ')}. Received "${parsed.order}".`
    );
  }

  return parsed;
}

export function validateProductId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `Product id must be a positive integer, received "${idParam}".`);
  }
  return id;
}

# Mock Products API

A small Node.js + Express REST API that serves product data from a static JSON file. It supports **filtering, searching, sorting, and pagination** via query parameters, and returns proper HTTP status codes with clear error messages for invalid input.

Built as a learning project — no database, just an in-memory dataset loaded from `data/products.json`.

---

## Tech Stack

- **Node.js** (ES Modules — `"type": "module"`)
- **Express 5**
- **nodemon** (dev auto-reload)

---

## Project Structure

```
Node API/
├── package.json
├── .gitignore
├── playwright.config.js           # Playwright test runner config (auto-starts the server)
├── data/
│   └── products.json              # 25 mock product records (the "database")
├── tests/
│   ├── root.spec.js              # GET /
│   ├── products-list.spec.js     # GET /api/products (filter/search/sort/paginate + errors)
│   ├── products-by-id.spec.js    # GET /api/products/:id
│   ├── categories.spec.js        # GET /api/categories
│   └── errors.spec.js            # Unknown routes / 404s
└── src/
    ├── server.js                  # Entry point — starts the HTTP server
    ├── app.js                     # Creates & configures the Express app
    ├── routes/
    │   ├── products.routes.js     # /api/products routes
    │   └── categories.routes.js   # /api/categories route
    ├── controllers/
    │   └── products.controller.js # Request handlers
    ├── services/
    │   └── products.service.js    # Loads JSON; filter/search/sort/paginate logic
    ├── utils/
    │   ├── ApiError.js            # Custom error class carrying an HTTP status code
    │   └── queryValidation.js     # Validates & coerces query params
    └── middleware/
        ├── notFound.js            # 404 handler for unknown routes
        └── errorHandler.js        # Centralized error → JSON response
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the server

Development (auto-reloads on file changes):
```bash
npm run dev
```

Production:
```bash
npm start
```

You should see:
```
Mock Products API listening on http://localhost:3000
```

The server runs on port **3000** by default. Override with the `PORT` environment variable.

---

## Endpoints

| Method | Path                 | Description                                        |
|--------|----------------------|----------------------------------------------------|
| GET    | `/`                  | Welcome message + endpoint hints                   |
| GET    | `/api/products`      | List products (supports all query params below)    |
| GET    | `/api/products/:id`  | Get a single product by its numeric id             |
| GET    | `/api/categories`    | List all distinct product categories               |

---

## Query Parameters (`GET /api/products`)

Parameters can be combined freely. They are applied in this order: **filter → search → sort → paginate**.

### Filtering
| Param       | Type    | Example            | Description                                  |
|-------------|---------|--------------------|----------------------------------------------|
| `category`  | string  | `category=Books`   | Exact match, case-insensitive                |
| `minPrice`  | number  | `minPrice=20`      | Minimum price (inclusive)                    |
| `maxPrice`  | number  | `maxPrice=100`     | Maximum price (inclusive)                    |
| `inStock`   | boolean | `inStock=true`     | Filter by stock availability (`true`/`false`)|

### Search
| Param | Type   | Example      | Description                                              |
|-------|--------|--------------|---------------------------------------------------------|
| `q`   | string | `q=phone`    | Case-insensitive substring match on `name` + `description` |

### Sorting
| Param    | Type   | Allowed values        | Default | Description             |
|----------|--------|-----------------------|---------|-------------------------|
| `sortBy` | string | `price`, `rating`, `name` | —   | Field to sort by        |
| `order`  | string | `asc`, `desc`         | `asc`   | Sort direction          |

### Pagination
| Param   | Type   | Default | Max | Description             |
|---------|--------|---------|-----|-------------------------|
| `page`  | number | `1`     | —   | Page number (1-based)   |
| `limit` | number | `10`    | 100 | Items per page          |

---

## Response Format

### Success — list (`/api/products`)
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "...", "price": 59.99, ... } ],
  "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
}
```

### Success — single item / categories
```json
{
  "success": true,
  "data": { "id": 2, "name": "Smartphone X200", ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Query parameter \"sortBy\" must be one of: price, rating, name. Received \"bogus\"."
}
```

---

## Status Codes

| Code | When                                                                             |
|------|----------------------------------------------------------------------------------|
| 200  | Successful request                                                                |
| 400  | Invalid query parameter or invalid `:id` (bad type, out of range, min > max, etc.)|
| 404  | Product id not found, or unknown route                                            |
| 500  | Unexpected server error (body is a generic message; details are logged server-side) |

---

## Example Requests

```bash
# Default list (first 10)
curl "http://localhost:3000/api/products"

# Filter + sort + paginate
curl "http://localhost:3000/api/products?category=electronics&minPrice=50&maxPrice=300&sortBy=price&order=desc&page=1&limit=5"

# Search
curl "http://localhost:3000/api/products?q=phone"

# Single product
curl "http://localhost:3000/api/products/2"

# All categories
curl "http://localhost:3000/api/categories"
```

---

## Testing Error Cases

Failure cases to verify the API rejects bad input correctly:

| Request                                             | Expected |
|-----------------------------------------------------|----------|
| `GET /api/products?sortBy=bogus`                    | 400      |
| `GET /api/products?order=sideways`                  | 400      |
| `GET /api/products?inStock=maybe`                   | 400      |
| `GET /api/products?minPrice=cheap`                  | 400      |
| `GET /api/products?minPrice=100&maxPrice=10`        | 400      |
| `GET /api/products?limit=500`                       | 400      |
| `GET /api/products/abc`                             | 400      |
| `GET /api/products/9999`                            | 404      |
| `GET /api/nonexistent`                              | 404      |

### PowerShell (shows status code)
```powershell
$res = Invoke-WebRequest "http://localhost:3000/api/products?sortBy=bogus" -SkipHttpErrorCheck
$res.StatusCode
$res.Content
```

> `-SkipHttpErrorCheck` is required because PowerShell throws on 4xx/5xx responses by default.

### curl (shows status code)
```bash
curl -s -w "\nSTATUS:%{http_code}\n" "http://localhost:3000/api/products?sortBy=bogus"
```

You can also test GET endpoints directly in a browser, or use Postman / Insomnia / the VS Code REST Client extension.

---

## Automated Tests (Playwright)

The project ships with an automated API test suite built on [`@playwright/test`](https://playwright.dev/docs/test-api-testing). It covers every endpoint: happy-path requests and parameter combinations, invalid/edge-case params (out-of-range, wrong type, missing/unsupported values), and verifies both the status codes and the response shape for valid and invalid requests.

Tests live in the `tests/` folder (see [Project Structure](#project-structure)), with **49 tests across 5 spec files**.

### Install

Playwright is already listed in `devDependencies`, so a plain install pulls it in:
```bash
npm install
```

> No browser download is needed — these are pure HTTP/API tests, not browser tests.

### Run the tests

```bash
npm test
```

`playwright.config.js` is configured with a `webServer` block, so the test runner **automatically starts the API** (`node src/server.js`) before the tests and shuts it down afterward. You do **not** need to start the server yourself. If a server is already running on port 3000 (e.g. `npm run dev`), it is reused.

### Useful variations

```bash
# Run a single spec file
npx playwright test tests/products-list.spec.js

# Run tests whose title matches a string
npx playwright test -g "inStock"

# Interactive UI mode (watch + inspect each request)
npx playwright test --ui
```

### View the HTML report

Each `npm test` run writes an HTML report to `playwright-report/`. Open it with:
```bash
npm run test:report
```

> `test:report` only opens an existing report — run `npm test` at least once first.

### What's covered

| Spec file                 | Endpoint              | Focus                                                                 |
|---------------------------|-----------------------|----------------------------------------------------------------------|
| `root.spec.js`            | `GET /`               | Welcome message, 200 + response shape                                |
| `products-list.spec.js`   | `GET /api/products`   | Filtering, search, sorting, pagination, combined params, and all invalid-param cases (400s) |
| `products-by-id.spec.js`  | `GET /api/products/:id` | Valid ids, boundary ids, bad types (400), not found (404)           |
| `categories.spec.js`      | `GET /api/categories` | 200, sorted category list, response shape                           |
| `errors.spec.js`          | unknown routes        | 404 handling for unmatched paths                                     |

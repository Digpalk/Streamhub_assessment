import express from 'express';
import productsRouter from './routes/products.routes.js';
import categoriesRouter from './routes/categories.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Mock Products API. See /api/products, /api/products/:id, /api/categories.',
    });
  });

  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

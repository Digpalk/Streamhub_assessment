import { Router } from 'express';
import { getCategories } from '../controllers/products.controller.js';

const router = Router();

router.get('/', getCategories);

export default router;

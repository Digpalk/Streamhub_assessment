import * as productsService from '../services/products.service.js';
import { validateProductListQuery, validateProductId } from '../utils/queryValidation.js';
import { ApiError } from '../utils/ApiError.js';

export function getProducts(req, res, next) {
  try {
    const query = validateProductListQuery(req.query);
    const { data, meta } = productsService.listProducts(query);
    res.status(200).json({ success: true, data, meta });
  } catch (err) {
    next(err);
  }
}

export function getProductById(req, res, next) {
  try {
    const id = validateProductId(req.params.id);
    const product = productsService.getProductById(id);
    if (!product) {
      throw new ApiError(404, `Product with id ${id} was not found.`);
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export function getCategories(req, res, next) {
  try {
    const categories = productsService.listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

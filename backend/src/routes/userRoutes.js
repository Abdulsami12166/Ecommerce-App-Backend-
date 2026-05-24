const express = require('express');

const {
  getProducts,
  getProductById,
} = require('../controllers/user/productController');

const router = express.Router();

// PRODUCTS ONLY
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

module.exports = router;
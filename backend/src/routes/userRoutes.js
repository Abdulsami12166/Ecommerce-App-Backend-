const express = require('express');

const {
  getProducts,
  getProductById,
} = require('../controllers/user/productController');

const {
  userLogin,
  verifyOtp,
} = require('../controllers/user/authController');

const router = express.Router();

// AUTH
router.post('/auth/login', userLogin);
router.post('/auth/verify-otp', verifyOtp);

// PRODUCTS
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

module.exports = router;
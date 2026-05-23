const express = require('express');

const {
  getProducts,
  getProductById,
} = require('../controllers/user/productController');

const {
  userLogin,
  userRegister,
} = require('../controllers/user/authController');

const router = express.Router();

// ── Public Auth ──

router.post('/auth/login', userLogin);
router.post('/auth/register', userRegister);

// ── Public Products ──

router.get('/products', getProducts);
router.get('/products/:id', getProductById);

module.exports = router;

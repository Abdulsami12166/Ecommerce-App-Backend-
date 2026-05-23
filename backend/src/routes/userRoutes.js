const express = require('express');

const {
  getProducts,
  getProductById,
} = require('../controllers/user/productController');

const {
  userLogin,
  userRegister,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require('../controllers/user/authController');

const { authorizeAdmin } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// ── Public Auth ──────────────────────────────────────
router.post('/auth/login', userLogin);
router.post('/auth/register', userRegister);

router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);

router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ── Public Products ──────────────────────────────────
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

module.exports = router;

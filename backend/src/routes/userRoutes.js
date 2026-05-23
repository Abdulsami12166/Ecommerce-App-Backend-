const express = require('express');

const {
  userRegister,
  userLogin,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require('../controllers/user/authController');

const { authorizeAdmin } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

/* ── Public Auth Routes ─────────────────────────────── */
router.post('/auth/register', userRegister);
router.post('/auth/login', userLogin);

router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);

router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

module.exports = router;

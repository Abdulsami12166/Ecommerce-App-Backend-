const express = require('express');

const authController = require('./auth.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', requireUserAuth, authController.logoutUser);
router.get('/me', requireUserAuth, authController.getMe);

module.exports = router;

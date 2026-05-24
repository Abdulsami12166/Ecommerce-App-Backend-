const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const usersController = require('./users.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

const uploadsDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.get('/profile', requireUserAuth, usersController.getProfile);
router.put('/profile', requireUserAuth, usersController.updateProfile);
router.post('/profile/avatar', requireUserAuth, upload.single('avatar'), usersController.uploadProfileAvatar);
router.patch('/wishlist', requireUserAuth, usersController.toggleWishlist);

module.exports = router;

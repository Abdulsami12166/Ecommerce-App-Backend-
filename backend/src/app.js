const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const { adminLogin, authorizeAdmin } = require('./middleware/adminAuthMiddleware');
const { requestLogger } = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce backend is running',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ecommerce backend is running',
  });
});

/* Public user-facing routes  →  /api/v1/auth/*, /api/v1/products, /api/v1/products/:id */
app.use('/api/v1', userRoutes);

/* Protected admin routes     →  /api/v1/admin/... */
app.use('/api/v1/admin', adminRoutes);

/* Admin-only login            →  /api/v1/admin/auth/login */
app.post('/api/v1/admin/auth/login', adminLogin);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

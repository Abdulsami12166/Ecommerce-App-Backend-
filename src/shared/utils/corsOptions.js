const defaultAllowedOrigins = [
  'http://localhost:8081',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://admin-app-web.onrender.com',
];

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_WEB_URL,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .flatMap(value => value.split(','))
  .map(value => value.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

const isAllowedOrigin = origin => {
  if (!origin || allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};

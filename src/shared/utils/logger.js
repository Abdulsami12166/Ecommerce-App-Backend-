const buildPayload = (level, message, meta = {}) => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  ...meta,
});

const log = (level, message, meta = {}) => {
  const payload = buildPayload(level, message, meta);
  const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  method(JSON.stringify(payload));
};

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};

module.exports = { logger };

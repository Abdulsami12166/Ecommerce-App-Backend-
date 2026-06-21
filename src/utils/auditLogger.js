const CustomerAuditLog = require('../models/CustomerAuditLog');

function maskPII(text) {
  if (typeof text !== 'string') return text;
  // Mask email addresses
  let masked = text.replace(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g, (email) => {
    const parts = email.split('@');
    return parts[0].slice(0, 2) + '***@' + parts[1];
  });
  // Mask password inputs
  masked = masked.replace(/(password["\s:]+)[^,\s"}]+/gi, '$1"***"');
  return masked;
}

const logCustomerActivity = async (userId, action, module, details, relatedEntityId = '', req = null, extra = {}) => {
  try {
    let ipAddress = extra.ipAddress || '';
    let userAgent = extra.userAgent || '';
    let platform = extra.platform || 'unknown';
    let deviceInfo = extra.deviceInfo || '';

    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
      userAgent = req.get('user-agent') || '';
      
      const headerPlatform = req.headers['x-platform'] || req.body?.platform;
      if (headerPlatform) {
        const p = String(headerPlatform).toLowerCase();
        if (p.includes('android')) platform = 'Android';
        else if (p.includes('ios')) platform = 'iOS';
        else if (p.includes('web')) platform = 'Web';
      } else if (userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes('android')) platform = 'Android';
        else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod') || ua.includes('ios')) platform = 'iOS';
        else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari') || ua.includes('webkit')) platform = 'Web';
      }

      deviceInfo = req.headers['x-device-name'] || req.headers['x-device-info'] || '';
      if (!deviceInfo && userAgent) {
        if (userAgent.includes('Android')) deviceInfo = 'Android Device';
        else if (userAgent.includes('iPhone')) deviceInfo = 'iPhone';
        else if (userAgent.includes('iPad')) deviceInfo = 'iPad';
        else if (userAgent.includes('Windows')) deviceInfo = 'Windows PC';
        else if (userAgent.includes('Macintosh')) deviceInfo = 'Mac';
        else if (userAgent.includes('Linux')) deviceInfo = 'Linux PC';
        else deviceInfo = 'Web Browser';
      }
    }

    const maskedDetails = maskPII(details);

    await CustomerAuditLog.create({
      user: userId,
      action,
      module,
      details: maskedDetails,
      relatedEntityId: String(relatedEntityId || ''),
      ipAddress,
      userAgent,
      platform,
      deviceInfo: deviceInfo || 'unknown',
      metadata: extra.metadata || {},
    });
  } catch (err) {
    console.error('Failed to log customer activity:', err.message);
  }
};

module.exports = {
  logCustomerActivity,
};

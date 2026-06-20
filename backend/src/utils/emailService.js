const { logger } = require('./logger');

/**
 * Send an email via Resend (primary) with nodemailer (fallback).
 * Supports both Resend SDK v6+  and legacy versions.
 */
async function sendEmail({ to, subject, html, text }) {
  // ponytail: support mock sending in development mode to avoid configuration dependency
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[MOCK] Email sent successfully in development mode to: ${to}, subject: ${subject}. Content: ${text || html}`);
    return;
  }

  const from = process.env.EMAIL_FROM;

  if (!from) {
    logger.warn('EMAIL_FROM is not set; cannot send email', { to, subject });
    throw new Error('EMAIL_FROM is not configured on the server.');
  }

  const resendKey = process.env.RESEND_API_KEY;

  // ── Primary: Resend ──────────────────────────────────
  if (resendKey) {
    try {
      let resendLib = require('resend');

      // SDK v6+: default export is a factory function / class
      // ── v6+ API: new Resend(key).emails.send(...)
      let resendClient;
      if (typeof resendLib === 'function') {
        resendClient = new resendLib(resendKey);
      } else if (resendLib.Resend) {
        resendClient = new resendLib.Resend(resendKey);
      } else if (resendLib.default && typeof resendLib.default === 'function') {
        resendClient = new resendLib.default(resendKey);
      } else {
        throw new Error('Unrecognised Resend SDK shape');
      }

      const result = await resendClient.emails.send({
        from,
        to,
        subject,
        html,
        text: text || html?.replace(/<[^>]+>/g, ' '),
      });

      const resendId = result?.data?.id || 'unknown';
      logger.info('Email sent via Resend', { to, subject, resendId });
      return result.data;
    } catch (err) {
      logger.warn('Resend failed — trying next attempt: %s', err.message);
    }
  }

  // ── Fallback: nodemailer ─────────────────────────────
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ' '),
    });

    logger.info('Email sent via nodemailer', { to, subject });
    return;
  } catch (err) {
    logger.error('Both Resend and nodemailer failed', { error: err.message, to, subject });
    throw new Error(`Unable to deliver email to ${to}: ${err.message}`);
  }
}

module.exports = { sendEmail };

const { logger } = require('./logger');

/**
 * Send an email via Resend (primary) with nodemailer (fallback).
 * Supports both Resend SDK v6+  and legacy versions.
 */
async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  const hasConfig = !!(from && (resendKey || smtpHost));

  // ponytail: support mock sending in development mode only to avoid configuration dependency
  if (!hasConfig && process.env.NODE_ENV === 'development') {
    logger.info(`[MOCK] Email sent successfully in development mode to: ${to}, subject: ${subject}. Content: ${text || html}`);
    return;
  }

  if (!from) {
    logger.warn('Email sender address is not set; cannot send email', { to, subject });
    throw new Error('Email sender is not configured on the server.');
  }

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

      if (result?.error) {
        throw new Error(result.error.message || 'Resend API returned an error');
      }

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

const { logger } = require('./logger');

/**
 * Send an email via Resend (primary) with nodemailer (fallback).
 *
 * Accepted options: { to, subject, html, text? }
 */
async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM;

  if (!from) {
    logger.warn('EMAIL_FROM is not set; cannot send email', { to, subject });
    throw new Error('EMAIL_FROM is not configured on the server.');
  }

  const resendKey = process.env.RESEND_API_KEY;

  // ── Primary: Resend ──────────────────────────────────
  if (resendKey) {
    try {
      const resend = require('resend');
      const { data } = await resend.Emails.send({
        from,
        to,
        subject,
        html,
        text: text || html?.replace(/<[^>]+>/g, ' '),
      });
      logger.info('Email sent via Resend', { to, subject, resendId: data?.id });
      return data;
    } catch (err) {
      logger.warn('Resend failed, falling back to nodemailer', { error: err.message });
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

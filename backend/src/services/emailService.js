const { Resend } = require('resend');

// Optional env vars:
// - RESEND_FROM (sender email). If not provided, falls back to SMTP_FROM-like var.
// - RESEND_FROM_NAME
const getFromEmail = () => {
  return (
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.FROM_EMAIL ||
    process.env.SMTP_USER
  );
};

const sendOtpEmail = async ({ toEmail, otpCode }) => {
  if (!toEmail) throw new Error('Missing toEmail');
  if (!otpCode) throw new Error('Missing otpCode');
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing API key. Set RESEND_API_KEY to send OTP email with Resend.');
  }

  const from = getFromEmail();
  if (!from) {
    throw new Error(
      'Missing email sender. Set RESEND_FROM (or SMTP_FROM / FROM_EMAIL / SMTP_USER).',
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from:
      process.env.RESEND_FROM_NAME && process.env.RESEND_FROM_NAME.trim()
        ? `${process.env.RESEND_FROM_NAME} <${from}>`
        : from,
    to: [toEmail],
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Your OTP Code</h3>
        <p>Your OTP code is: <b>${otpCode}</b></p>
        <p>It will expire in 5 minutes.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Resend API returned an error');
  }

  return {
    messageId: data?.id || '',
  };
};

module.exports = {
  sendOtpEmail,
};

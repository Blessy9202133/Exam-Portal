const nodemailer = require('nodemailer');

/**
 * Creates dynamic email transporter based on environment variables
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Development fallback transporter (logs preview)
  return null;
}

/**
 * Sends a password reset email
 */
async function sendPasswordResetEmail({ to, employeeName, resetToken, origin }) {
  const appOrigin = origin || process.env.APP_URL || 'http://localhost:4200';
  const resetLink = `${appOrigin}/login?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.FROM_EMAIL || '"HBL Assessment Portal" <no-reply@hbl.in>';

  const subject = 'Password Reset Request - HBL Assessment Portal';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #1e3a8a; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .body { padding: 32px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; }
        .token-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 16px; font-weight: 700; color: #0f172a; text-align: center; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HBL ASSESSMENT PORTAL</h1>
        </div>
        <div class="body">
          <div class="greeting">Hello ${employeeName || 'Colleague'},</div>
          <p>We received a request to reset your password for the HBL Employee Assessment Portal.</p>
          <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="btn" target="_blank">Reset My Password</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
          <div style="word-break: break-all; font-size: 12px; color: #2563eb;">${resetLink}</div>
          <div style="margin-top: 24px;">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Alternatively, enter this Reset Code directly on the portal:</p>
            <div class="token-box">${resetToken}</div>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">If you did not request this reset, you can safely ignore this email. Your current password remains secure.</p>
        </div>
        <div class="footer">
          © HBL Power Systems Ltd. • Automated Notification System
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (transporter) {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`📧 [EMAIL SENT] Password reset email delivered to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, resetLink };
  } else {
    console.log(`\n=============================================================`);
    console.log(`📧 [DEV EMAIL SIMULATOR] Password Reset Requested for ${to}`);
    console.log(`👉 Reset Link: ${resetLink}`);
    console.log(`👉 Reset Code: ${resetToken}`);
    console.log(`💡 (To send live emails, configure SMTP_HOST/USER/PASS in backend/.env)`);
    console.log(`=============================================================\n`);
    return { success: true, simulated: true, resetLink, resetToken };
  }
}

module.exports = { sendPasswordResetEmail };

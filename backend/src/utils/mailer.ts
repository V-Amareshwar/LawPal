import nodemailer from 'nodemailer';

async function getTransporter() {
  // Option 1: SendGrid (Recommended for production)
  // Set SENDGRID_API_KEY in Render environment
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (SENDGRID_API_KEY) {
    // Use SendGrid via SMTP relay (no extra package needed!)
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // TLS
      auth: {
        user: 'apikey', // This is literal string 'apikey'
        pass: SENDGRID_API_KEY, // Your actual SendGrid API key
      },
    });
    console.log('📧 Using SendGrid SMTP transport');
    try {
      await transporter.verify();
      console.log('✅ SendGrid connection verified successfully');
    } catch (err: any) {
      console.error('❌ SendGrid verify failed:', err?.message || err);
      throw err;
    }
    return transporter;
  }

  // Option 2: Gmail SMTP (Fallback - may timeout on free tier)
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    if (SMTP_HOST.includes('gmail') && /\s/.test(SMTP_PASS)) {
      console.warn('⚠️ SMTP_PASS contains spaces but Gmail App Passwords must be 16 characters without spaces. Remove spaces in your .env SMTP_PASS.');
    }
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.log(`📧 Using SMTP transport: host=${SMTP_HOST} port=${SMTP_PORT} secure=${SMTP_SECURE} user=${SMTP_USER}`);
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (err: any) {
      console.error('❌ SMTP verify failed:', err?.message || err);
      throw err;
    }
    return transporter;
  }

  // Option 3: Development test account
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.warn('⚠️ Using Nodemailer test account (emails will NOT be delivered to real inboxes). A preview URL will be printed below.');
    return transporter;
  }

  throw new Error('Email service not configured. Set SENDGRID_API_KEY or SMTP credentials in .env');
}

export async function sendVerificationEmail(to: string, link: string) {
  const transporter = await getTransporter();
  const MAIL_FROM = process.env.MAIL_FROM || 'LawPal <no-reply@lawpal.app>';

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2>Verify your email</h2>
    <p>Welcome to LawPal! Please verify your email address to activate your account.</p>
    <p>
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Verify Email</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${link}</p>
    <p style="color:#666">If you didn't request this, you can ignore this email.</p>
  </div>`;

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Verify your LawPal account',
    html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('🔗 Email preview URL:', preview);
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const transporter = await getTransporter();
  const MAIL_FROM = process.env.MAIL_FROM || 'LawPal <no-reply@lawpal.app>';

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2>Reset your password</h2>
    <p>We received a request to reset your LawPal password. If this was you, click the button below.</p>
    <p>
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Reset Password</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${link}</p>
    <p style="color:#666">If you didn't request this, you can ignore this email.</p>
  </div>`;

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Reset your LawPal password',
    html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('🔗 Email preview URL:', preview);
}

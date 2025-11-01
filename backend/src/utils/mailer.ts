// SendGrid email service using HTTPS API (best for production)
// Uses fetch API - no extra dependencies needed!

async function sendEmailViaSendGridAPI(to: string, subject: string, html: string) {
  // Read env variables inside the function (after dotenv.config() has run)
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const MAIL_FROM = process.env.MAIL_FROM || 'LawPal <no-reply@lawpal.app>';
  
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY environment variable not set!');
    console.error('Current env keys:', Object.keys(process.env).filter(k => k.includes('SEND')));
    throw new Error('SENDGRID_API_KEY not configured');
  }

  console.log('📧 Sending email via SendGrid HTTPS API');
  console.log('📬 To:', to);
  console.log('📝 Subject:', subject);
  console.log('🔑 API Key present:', SENDGRID_API_KEY.substring(0, 10) + '...');

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject,
      },
    ],
    from: { 
      email: MAIL_FROM.match(/<(.+)>/)?.[1] || MAIL_FROM, // Extract email from "Name <email>"
      name: MAIL_FROM.match(/^([^<]+)</)?.[1]?.trim() || 'LawPal',
    },
    content: [
      {
        type: 'text/html',
        value: html,
      },
    ],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ SendGrid API error:', response.status, errorText);
    throw new Error(`SendGrid API failed: ${response.status} - ${errorText}`);
  }

  console.log('✅ Email sent successfully via SendGrid HTTPS API');
  return response;
}

export async function sendVerificationEmail(to: string, link: string) {
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

  await sendEmailViaSendGridAPI(to, 'Verify your LawPal account', html);
}

export async function sendPasswordResetEmail(to: string, link: string) {
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

  await sendEmailViaSendGridAPI(to, 'Reset your LawPal password', html);
}

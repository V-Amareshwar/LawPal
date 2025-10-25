// Test SendGrid email sending
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSendGrid() {
  console.log('\n🧪 Testing SendGrid Configuration...\n');
  
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const MAIL_FROM = process.env.MAIL_FROM || 'LawPal <theguddicheppu@gmail.com>';
  
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not found in .env');
    console.log('Please add: SENDGRID_API_KEY=SG.xxx...');
    process.exit(1);
  }
  
  console.log('✅ SENDGRID_API_KEY found:', SENDGRID_API_KEY.substring(0, 20) + '...');
  console.log('✅ MAIL_FROM:', MAIL_FROM);
  console.log('');
  
  try {
    console.log('📧 Creating SendGrid transporter...');
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // literal string 'apikey'
        pass: SENDGRID_API_KEY,
      },
    });
    
    console.log('🔍 Verifying SendGrid connection...');
    await transporter.verify();
    console.log('✅ SendGrid connection verified successfully!\n');
    
    // Send test email
    console.log('📨 Sending test email...');
    const testEmail = 'theguddicheppu@gmail.com'; // Change to your email
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: testEmail,
      subject: 'LawPal SendGrid Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 SendGrid is Working!</h2>
          <p>This is a test email from your LawPal backend.</p>
          <p>If you received this, your SendGrid configuration is correct!</p>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Recipient:', testEmail);
    console.log('\n✨ Check your inbox at:', testEmail);
    console.log('⚠️  If not in inbox, check SPAM folder!\n');
    
  } catch (error) {
    console.error('\n❌ SendGrid Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed! Possible issues:');
      console.error('   1. Invalid SendGrid API key');
      console.error('   2. API key doesn\'t have "Mail Send" permission');
      console.error('   3. Sender email not verified in SendGrid dashboard');
      console.error('\n📋 Next steps:');
      console.error('   1. Go to https://app.sendgrid.com/settings/api_keys');
      console.error('   2. Create new API key with "Mail Send" full access');
      console.error('   3. Verify theguddicheppu@gmail.com at Settings > Sender Authentication');
    }
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Connection failed! Check your internet connection.');
    }
    process.exit(1);
  }
}

testSendGrid();

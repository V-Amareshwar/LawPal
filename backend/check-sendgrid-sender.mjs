import dotenv from 'dotenv';

dotenv.config();

async function checkSendGridSender() {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not found in .env');
    return;
  }
  
  console.log('\n🔍 Checking SendGrid Sender Verification...\n');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SendGrid API connection successful!\n');
      
      if (data.results && data.results.length > 0) {
        console.log('📧 Verified Senders:');
        data.results.forEach(sender => {
          console.log(`\n  From Name: ${sender.from_name}`);
          console.log(`  From Email: ${sender.from_email}`);
          console.log(`  Verified: ${sender.verified ? '✅ YES' : '❌ NO'}`);
          console.log(`  Locked: ${sender.locked ? 'Yes' : 'No'}`);
        });
        
        const hasVerified = data.results.some(s => s.verified && s.from_email === 'theguddicheppu@gmail.com');
        
        if (hasVerified) {
          console.log('\n✅ theguddicheppu@gmail.com is VERIFIED! Emails can be sent.');
        } else {
          console.log('\n❌ theguddicheppu@gmail.com is NOT verified!');
          console.log('\n📋 Next steps:');
          console.log('1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
          console.log('2. Click "Verify a Single Sender"');
          console.log('3. Add: theguddicheppu@gmail.com');
          console.log('4. Check your Gmail for verification link');
        }
      } else {
        console.log('❌ No verified senders found!\n');
        console.log('📋 You need to verify your sender email:');
        console.log('1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
        console.log('2. Click "Verify a Single Sender"');
        console.log('3. Add: theguddicheppu@gmail.com');
        console.log('4. Check your Gmail for verification link');
      }
    } else {
      console.error('❌ SendGrid API Error:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 401) {
        console.log('\n⚠️  API Key might be invalid or expired.');
        console.log('Create a new one at: https://app.sendgrid.com/settings/api_keys');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSendGridSender();

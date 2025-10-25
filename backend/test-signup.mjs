// Quick test to call signup endpoint
const testSignup = async () => {
  console.log('\n🧪 Testing Signup Endpoint...\n');
  
  const email = 'test' + Date.now() + '@example.com'; // Unique email
  
  try {
    const response = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: email,
      }),
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Signup successful!');
      console.log('📧 Email should be sent to:', email);
      console.log('\n⚠️  NOW CHECK YOUR BACKEND TERMINAL LOGS!');
      console.log('You should see:');
      console.log('  📧 Using SendGrid SMTP transport');
      console.log('  ✅ SendGrid connection verified successfully');
      console.log('  ✅ Verification email sent successfully');
    } else {
      console.log('\n❌ Signup failed:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Make sure backend is running on http://localhost:5000');
  }
};

testSignup();

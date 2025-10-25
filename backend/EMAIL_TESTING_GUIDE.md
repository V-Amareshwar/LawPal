# 🔍 Local Email Testing Guide

## Problem
You're not receiving verification emails when testing signup locally.

## Root Cause
The backend server needs to be restarted after changing `.env` file for new environment variables to load.

---

## ✅ Solution: Restart Backend Server

### Step 1: Stop Current Backend
Find the terminal running your backend and press **Ctrl+C** to stop it.

Or kill the process using PowerShell:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace XXXX with the PID from above command)
taskkill /F /PID XXXX
```

### Step 2: Rebuild TypeScript Code
```powershell
cd d:\Projects\LawPal\ai-lawyer-chat\my-ai-lawyer-app\backend
node node_modules/typescript/bin/tsc
```

### Step 3: Start Backend Again
```powershell
node dist/server.js
```

### Step 4: Check Logs
You should see:
```
📧 Using SendGrid SMTP transport
✅ SendGrid connection verified successfully
✅ Connected to MongoDB Atlas successfully!
🚀 Server running on http://localhost:5000
```

---

## 🧪 Test Email Sending

### Option A: Use Test Script (Quickest)
```powershell
cd d:\Projects\LawPal\ai-lawyer-chat\my-ai-lawyer-app\backend
node test-sendgrid.mjs
```

**Expected output:**
```
✅ SendGrid connection verified successfully!
✅ Email sent successfully!
📬 Recipient: theguddicheppu@gmail.com
```

**Then check your Gmail inbox!**

---

### Option B: Test Signup Endpoint
1. Start frontend: `cd my-ai-lawyer-app; npm run dev`
2. Open: `http://localhost:5173/#/signup`
3. Enter:
   - Name: Test User
   - Email: ANY email (can be fake for testing)
4. Click "Sign Up"
5. Check backend terminal logs for:
   ```
   📧 Using SendGrid SMTP transport
   ✅ SendGrid connection verified successfully
   📥 POST /auth/signup { email: 'test@example.com' }
   📤 /auth/signup response: { success: true }
   ```

6. **If email send fails**, you'll see:
   ```
   ❌ Failed to send verification email: [error message]
   ⚠️  Signup proceeding despite email failure
   ```

---

## 🎯 What Should Happen

### With SendGrid Working:
1. User signs up
2. Backend logs: `📧 Using SendGrid SMTP transport`
3. Backend logs: `✅ SendGrid connection verified`
4. Email sent to user's inbox
5. User receives "Verify your LawPal account" email
6. Frontend shows: "Verification email sent"

### If SendGrid Not Configured:
1. User signs up
2. Backend logs: `⚠️ Using Nodemailer test account`
3. Backend logs: `🔗 Email preview URL: https://ethereal.email/message/xxx`
4. **No real email sent** - you get a preview URL instead
5. Copy the preview URL and paste in browser to see the email

---

## 📋 Checklist

- [ ] `.env` has `SENDGRID_API_KEY=SG.xxx...`
- [ ] `.env` has `MAIL_FROM=LawPal <theguddicheppu@gmail.com>`
- [ ] `.env` has `NODE_ENV=development` (for local testing)
- [ ] Sender email verified in SendGrid dashboard
- [ ] Backend server restarted after changing `.env`
- [ ] Backend logs show "Using SendGrid SMTP transport"
- [ ] Test script sends email successfully

---

## ⚠️ Common Issues

### Issue 1: "Using Nodemailer test account" instead of SendGrid
**Cause:** `SENDGRID_API_KEY` not found in `.env`  
**Fix:** Check `.env` file has the API key, restart server

### Issue 2: No email in inbox
**Possible causes:**
1. Sender not verified in SendGrid → Go to https://app.sendgrid.com/settings/sender_auth
2. Email in spam folder → Check spam
3. SendGrid API key invalid → Create new one
4. SendGrid account suspended → Check SendGrid dashboard for warnings

### Issue 3: "Email service not configured" error
**Cause:** Neither SendGrid nor Gmail SMTP configured  
**Fix:** Add `SENDGRID_API_KEY` to `.env`

---

## 🚀 Quick Test Commands

```powershell
# 1. Go to backend directory
cd d:\Projects\LawPal\ai-lawyer-chat\my-ai-lawyer-app\backend

# 2. Test SendGrid directly
node test-sendgrid.mjs

# 3. If email received successfully, your SendGrid is working!
# 4. Now restart your backend server for signup to work
```

---

## 📧 Expected Email

**Subject:** Verify your LawPal account  
**From:** LawPal <theguddicheppu@gmail.com>  
**Content:**
```
Verify your email

Welcome to LawPal! Please verify your email address to activate your account.

[Verify Email Button]

If the button doesn't work, copy and paste this link into your browser:
http://localhost:5173/#/signup?token=abc123...
```

---

## ✅ Success Criteria

1. Run `node test-sendgrid.mjs` → Email received ✅
2. Backend logs show "Using SendGrid SMTP transport" ✅
3. Signup creates user and sends email ✅
4. Email arrives in inbox (not spam) ✅

**Once all pass, your local setup is complete!**

For production (Render), remember to:
1. Change `NODE_ENV=production` in Render dashboard
2. Add `SENDGRID_API_KEY` to Render environment variables
3. Add `MAIL_FROM` to Render environment variables

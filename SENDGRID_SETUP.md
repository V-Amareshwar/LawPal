# SendGrid Email Setup Guide

## Why SendGrid?
- ✅ **100 free emails/day** (3,000/month)
- ✅ **No connection timeout** on free hosting (Render/Vercel)
- ✅ **Better deliverability** than Gmail SMTP
- ✅ **No 2FA issues** like Gmail App Passwords

---

## Step 1: Create SendGrid Account

1. Go to **https://signup.sendgrid.com/**
2. Sign up with your email (free tier)
3. Verify your email address
4. Complete the "Tell us about yourself" form (select "Transactional Emails")

---

## Step 2: Get API Key

1. Log in to **https://app.sendgrid.com/**
2. Go to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"**
4. Name it: `LawPal Production`
5. Select **"Restricted Access"**
   - Enable: **Mail Send** (full access)
   - Leave everything else disabled
6. Click **"Create & View"**
7. **COPY THE KEY NOW** (you won't see it again!)
   - Looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 3: Verify Sender Identity

SendGrid requires you to verify your "From" email address:

### Option A: Single Sender Verification (Easiest - Free Tier)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **"Create New Sender"**
3. Fill in:
   - **From Name**: `LawPal`
   - **From Email**: Your real email (e.g., `youremail@gmail.com`)
   - **Reply To**: Same email
   - **Address, City, State, Zip**: Your real info (required by SendGrid)
4. Click **"Create"**
5. Check your email and click the verification link
6. Wait for approval (usually instant)

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Follow wizard to add DNS records to your domain
3. Use your own domain for emails (e.g., `no-reply@yourdomain.com`)

---

## Step 4: Configure Render Backend

1. Go to **https://dashboard.render.com**
2. Find your backend service (`LawPal-3`)
3. Go to **Environment** tab
4. Add new environment variable:
   ```
   Key: SENDGRID_API_KEY
   Value: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Add another variable:
   ```
   Key: MAIL_FROM
   Value: LawPal <youremail@gmail.com>
   ```
   ⚠️ **Use the SAME email you verified in Step 3!**

6. Click **"Save Changes"**
7. Render will auto-redeploy

---

## Step 5: Test It!

1. Wait for Render to finish deploying (~5 minutes)
2. Go to **https://actright.vercel.app/#/signup**
3. Enter your email and sign up
4. Check your inbox - you should receive the verification email!
5. Check Render logs - should see:
   ```
   📧 Using SendGrid SMTP transport
   ✅ SendGrid connection verified successfully
   ```

---

## Troubleshooting

### "Failed to send verification email"
- Check Render logs for error details
- Verify your `SENDGRID_API_KEY` is correct
- Make sure `MAIL_FROM` email matches your verified sender

### Emails going to spam
- Use domain authentication (Option B in Step 3)
- Add SPF/DKIM records to your domain
- Don't send from @gmail.com in production (verify your own domain)

### SendGrid account suspended
- Complete "Tell us about yourself" form in SendGrid dashboard
- Don't send to fake/disposable email addresses
- Keep bounce rate low (<5%)

---

## Alternative: Keep Gmail SMTP

If you want to keep using Gmail:

1. In Render environment, **remove** `SENDGRID_API_KEY`
2. Keep existing SMTP variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```
3. Note: Gmail may still timeout on Render free tier occasionally

The code will automatically fallback to Gmail if `SENDGRID_API_KEY` is not set.

---

## Email Limits

| Provider | Free Tier Limit | Cost |
|----------|----------------|------|
| SendGrid | 100/day (3,000/month) | $0 |
| Gmail SMTP | ~500/day | $0 |
| Resend | 3,000/month | $0 |
| Mailgun | 5,000/month (first 3 months) | Then $35/month |

**Recommendation:** Start with SendGrid free tier, upgrade if you exceed limits.

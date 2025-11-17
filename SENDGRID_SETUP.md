# SendGrid Email Setup Guide

## Why SendGrid?
- ✅ **Works on Render free tier** (Gmail SMTP blocked)
- ✅ **100 emails/day free** tier
- ✅ **Reliable delivery** rates
- ✅ **Easy setup** - just API key needed

---

## Step 1: Create SendGrid Account

1. Go to **[SendGrid.com](https://signup.sendgrid.com/)**
2. Sign up for a **free account**
3. Verify your email address

---

## Step 2: Create API Key

1. **Log in** to SendGrid dashboard
2. Go to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"**
4. Set name: `Voyage-Evasion`
5. Choose **"Full Access"** or **"Restricted Access"** with "Mail Send" permission
6. Click **"Create & View"**
7. **Copy the API key** (you won't see it again!)
   - Example: `SG.abc123...xyz789`

---

## Step 3: Verify Sender Email

SendGrid requires you to verify the email address you'll send from:

### Option A: Single Sender Verification (Easiest - Free Tier)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in:
   - **From Name:** Voyage Évasion
   - **From Email Address:** your-email@example.com (use your real email)
   - **Reply To:** Same as From Email
   - **Company details:** (fill in basic info)
4. Click **"Create"**
5. **Check your email** and click verification link
6. Wait for approval (usually instant)

### Option B: Domain Authentication (Better for production)

1. Go to **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain name
4. Add DNS records to your domain provider
5. Wait for verification (can take 24-48 hours)

---

## Step 4: Configure Your App

### Local Development (.env file)

Update your `.env` file:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
```

### For Render Deployment

Add environment variables in Render dashboard:

1. Go to your service → **Environment** tab
2. Add:
   - `SENDGRID_API_KEY` = `SG.abc123...` (your API key)
   - `SENDGRID_FROM_EMAIL` = `your-verified-email@example.com`
3. Click **"Save Changes"** (service will redeploy)

---

## Step 5: Test Email Sending

1. Start your server locally:
   ```bash
   node server/server.js
   ```

2. You should see:
   ```
   ✅ SendGrid API key configured
   📧 Emails will be sent from: your-email@example.com
   ```

3. Try registering a new user - you should receive the confirmation code email!

---

## Troubleshooting

### "Sender identity not verified"
- Make sure you verified your sender email in SendGrid dashboard
- Check that `SENDGRID_FROM_EMAIL` matches exactly what you verified

### "API key not valid"
- Check that you copied the full API key (starts with `SG.`)
- Make sure there are no extra spaces
- Try creating a new API key

### "Failed to send email"
- Check SendGrid dashboard → **Activity** to see send logs
- Verify your free tier hasn't exceeded 100 emails/day
- Check spam folder if using free email providers

### Still using Gmail locally?
You can keep both! The code will use SendGrid if `SENDGRID_API_KEY` is set, otherwise falls back to `EMAIL_USER`/`EMAIL_PASS`.

---

## Free Tier Limits

- ✅ **100 emails per day**
- ✅ Up to 2,000 contacts
- ✅ Email API access
- ✅ Email validation
- ✅ 30 days of email activity history

For most development/testing needs, this is more than enough!

---

## Next Steps

Once everything is working:
1. ✅ Test signup flow with confirmation code
2. ✅ Test resend code functionality  
3. ✅ Deploy to Render with SendGrid environment variables
4. ✅ Remove old Gmail credentials from production environment

**Your email sending is now production-ready! 🎉**

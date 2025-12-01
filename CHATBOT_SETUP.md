# AI Chatbot Setup Guide

This guide will help you set up the intelligent travel chatbot that uses Gemini 2.5 Flash AI and Apify's Expedia scraper.

## Prerequisites

You'll need to obtain API keys from:
1. **Google AI (Gemini)** - For the AI chatbot functionality
2. **Apify** - For scraping hotel/flight data from Expedia

---

## Step 1: Get Gemini API Key

### 1.1 Visit Google AI Studio
Go to: https://makersuite.google.com/app/apikey

### 1.2 Sign In
- Sign in with your Google account
- Accept the terms of service if prompted

### 1.3 Create API Key
- Click on "Create API Key"
- Select or create a Google Cloud project
- Copy the generated API key

### 1.4 Free Tier Limits
- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per minute**
- Sufficient for most small to medium applications

---

## Step 2: Get Apify API Token

### 2.1 Sign Up for Apify
Go to: https://apify.com/sign-up

### 2.2 Create Account
- Sign up with email or GitHub
- Verify your email address

### 2.3 Get API Token
1. Go to Settings: https://console.apify.com/account/integrations
2. Find the "API tokens" section
3. Click "Create new token"
4. Give it a name (e.g., "Voyage Evasion")
5. Copy the token (starts with `apify_api_`)

### 2.4 Free Tier Limits
- **$5 of free usage credits** per month
- Approximately **100-200 scrapes** per month (depending on complexity)
- Renews monthly

---

## Step 3: Configure Environment Variables

### 3.1 Update Your `.env` File

Add the following lines to your `.env` file (in the root of your project):

```env
# Gemini API Key for AI chatbot
GEMINI_API_KEY=your_gemini_api_key_here

# Apify API Token for Expedia scraping
APIFY_API_TOKEN=apify_api_your_token_here
```

### 3.2 Example `.env` File
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/voyage-evasion
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=your-email@gmail.com
PORT=3000
FRONTEND_URL=http://localhost:3000

# AI Chatbot Configuration
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
APIFY_API_TOKEN=apify_api_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 4: Deploy to Render

### 4.1 Add Environment Variables to Render

1. Go to your Render dashboard: https://dashboard.render.com/
2. Select your web service
3. Go to "Environment" tab
4. Add these environment variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `APIFY_API_TOKEN` = your Apify token

### 4.2 Redeploy

The service will automatically redeploy when you add the environment variables.

---

## Step 5: Test the Chatbot

### 5.1 Start Your Server Locally

```bash
npm start
```

### 5.2 Open Your Application

Navigate to: http://localhost:3000

### 5.3 Test Chatbot Features

Click the chat button (💬) in the bottom right corner and try these questions:

**Basic Travel Questions:**
- "What are the best destinations for summer vacation?"
- "Tell me about Paris"
- "I want to plan a trip to Japan"

**Expedia Search Queries:**
- "Find hotels in Paris"
- "Search for hotels in Tokyo from June 1 to June 7"
- "Show me accommodations in New York"

**Internal Destination Queries:**
- "What destinations do you offer?"
- "Show me beach destinations"
- "I'm looking for mountain destinations"

**Trip Planning:**
- "I want to plan a romantic getaway"
- "Suggest a family-friendly destination"
- "Help me plan a 7-day trip to Europe"

---

## Chatbot Features

✅ **AI-Powered Responses** - Uses Gemini 2.5 Flash for natural conversations  
✅ **Expedia Integration** - Real-time hotel and flight data  
✅ **Internal Destinations** - Shows destinations from your database  
✅ **Context-Aware** - Remembers conversation history  
✅ **Smart Filtering** - Only answers travel-related questions  
✅ **Clarifying Questions** - Asks for more info when needed  
✅ **Responsive Design** - Works on mobile, tablet, and desktop  

---

## Troubleshooting

### Chatbot Not Responding
- Check that `GEMINI_API_KEY` is set correctly
- Verify you haven't exceeded the free tier limits
- Check browser console for errors

### Expedia Data Not Loading
- Verify `APIFY_API_TOKEN` is set correctly
- Check Apify dashboard for usage limits
- Ensure you haven't exceeded monthly credits

### "API key not configured" Error
- Make sure environment variables are set in `.env`
- Restart your server after adding variables
- On Render, verify environment variables are set in dashboard

---

## Cost Management

### Gemini API (Free Tier)
- Monitor usage at: https://makersuite.google.com/app/apikey
- 60 requests/minute is usually sufficient for small sites
- Consider implementing rate limiting for production

### Apify (Free Tier)
- Monitor usage at: https://console.apify.com/billing
- $5/month credit renews automatically
- Each Expedia scrape costs ~$0.02-$0.05
- Cache results to reduce API calls

---

## Security Best Practices

1. **Never commit `.env` to Git**
   - Already in `.gitignore`
   - Use `.env.example` for documentation

2. **Rotate API keys regularly**
   - Change keys every 3-6 months
   - Immediately rotate if compromised

3. **Use environment-specific keys**
   - Different keys for development/production
   - Helps track usage per environment

4. **Monitor API usage**
   - Set up alerts for unusual activity
   - Track costs regularly

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are set
3. Ensure your API keys are valid and active
4. Check API provider status pages for outages

---

## Next Steps

- Customize chatbot responses in `server/routes/chatbot.js`
- Add more Apify actors (flights, car rentals, etc.)
- Implement conversation saving to database
- Add user feedback system
- Enhance with more AI capabilities

Enjoy your intelligent travel chatbot! 🤖✈️

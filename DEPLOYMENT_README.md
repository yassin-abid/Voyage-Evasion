# Voyage Évasion - Deployment Files

## Files Added for Production Deployment

1. **.env.example** - Template for environment variables
2. **DEPLOYMENT.md** - Complete deployment guide for Render
3. **server.js** - Updated with dynamic PORT and CORS configuration

## Quick Start

### For Render Deployment:
Follow the step-by-step guide in `DEPLOYMENT.md`

### Environment Variables Needed:
```
MONGO_URI - MongoDB connection string
JWT_SECRET - Secret key for JWT tokens
EMAIL_USER - Email address for nodemailer
EMAIL_PASS - Email password/app password
FRONTEND_URL - Your deployed frontend URL
```

See `.env.example` for detailed descriptions.

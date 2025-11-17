# 🚀 Deploy Voyage Évasion to Render

## Prerequisites
- GitHub account with your code pushed
- MongoDB Atlas account (free tier available)
- Render account (sign up at render.com - free tier available)

---

## Part 1: Set Up MongoDB Atlas (Database)

1. **Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)**
   - Sign up/login to MongoDB Atlas

2. **Create a Free Cluster**
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select a cloud provider & region (choose closest to your location)
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set role to "Atlas admin"
   - Click "Add User"

4. **Whitelist IP Addresses**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://username:password@cluster.mongodb.net/voyage-evasion?retryWrites=true&w=majority`

---

## Part 2: Deploy Backend to Render

1. **Sign up at [Render](https://render.com)**
   - Use GitHub to sign in

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `yassin-abid/Voyage-Evasion`
   - Click "Connect"

3. **Configure Web Service**
   ```
   Name: voyage-evasion-api (or any name you prefer)
   Region: Choose closest to you
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables**
   - Scroll down to "Environment Variables"
   - Click "Add Environment Variable" for each:

   ```
   MONGO_URI = mongodb+srv://your-connection-string-here
   JWT_SECRET = (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   EMAIL_USER = your-email@gmail.com
   EMAIL_PASS = your-gmail-app-password
   FRONTEND_URL = http://localhost:3000 (update after frontend deployment)
   ```

   **To generate JWT_SECRET:**
   - Open terminal in VS Code
   - Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Copy the output

   **For Gmail App Password:**
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Search "App Passwords"
   - Generate password for "Mail"
   - Copy the 16-character password

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Once deployed, you'll see: "Your service is live 🎉"
   - Copy your API URL (e.g., `https://voyage-evasion-api.onrender.com`)

---

## Part 3: Deploy Frontend to Render (Static Site)

1. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Select same repository: `yassin-abid/Voyage-Evasion`

2. **Configure Static Site**
   ```
   Name: voyage-evasion-frontend
   Branch: main
   Root Directory: (leave empty)
   Build Command: (leave empty)
   Publish Directory: public
   ```

3. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment
   - Copy your frontend URL (e.g., `https://voyage-evasion-frontend.onrender.com`)

---

## Part 4: Update API URLs in Frontend

You need to update your frontend JavaScript files to use the deployed backend URL instead of `http://localhost:3000`.

1. **Update all fetch calls in your JS files:**
   - `public/js/auth.js`
   - `public/js/destinations.js`
   - `public/js/favorites.js`
   - `public/js/admin.js`

   Change from:
   ```javascript
   fetch('http://localhost:3000/api/...')
   ```
   
   To:
   ```javascript
   fetch('https://voyage-evasion-api.onrender.com/api/...')
   ```

   **OR better - use environment-aware URLs:**
   ```javascript
   const API_URL = window.location.hostname === 'localhost' 
     ? 'http://localhost:3000/api'
     : 'https://voyage-evasion-api.onrender.com/api';
   
   fetch(`${API_URL}/destinations`)
   ```

2. **Update FRONTEND_URL in Render**
   - Go back to your backend service in Render
   - Go to "Environment"
   - Update `FRONTEND_URL` to your frontend URL
   - Save changes (service will redeploy)

3. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Update API URLs for production deployment"
   git push
   ```

4. **Render will auto-deploy** when you push to GitHub

---

## Part 5: Test Your Deployed App

1. Visit your frontend URL: `https://voyage-evasion-frontend.onrender.com`
2. Test all features:
   - ✅ View destinations
   - ✅ Register new user
   - ✅ Login
   - ✅ Add favorites
   - ✅ Access admin panel (if admin user)
   - ✅ Upload images

---

## 🔧 Troubleshooting

### Backend Issues
- **Check Render Logs:** Go to your service → "Logs" tab
- **Common issues:**
  - MongoDB connection failed → Check MONGO_URI
  - Port errors → Render sets PORT automatically
  - JWT errors → Verify JWT_SECRET is set

### Frontend Issues
- **CORS errors:** Make sure FRONTEND_URL matches your frontend domain
- **API not found:** Check API URLs in JS files
- **Images not loading:** Ensure `public` folder is published correctly

### Free Tier Limitations
- Render free tier services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds to wake up
- Storage is not persistent on free tier (uploaded images will be lost on restart)

### For Persistent Image Storage
Consider using a cloud storage service:
- **Cloudinary** (free tier: 25GB storage, 25GB bandwidth/month)
- **AWS S3** (free tier: 5GB storage)
- **DigitalOcean Spaces**

---

## 🎉 Success!

Your Voyage Évasion app is now live on the internet! Share your frontend URL with anyone to access your travel destination app.

**Your URLs:**
- Frontend: `https://voyage-evasion-frontend.onrender.com`
- Backend API: `https://voyage-evasion-api.onrender.com`

---

## 📝 Next Steps

1. **Set up automatic deployments:** Already enabled with Render + GitHub
2. **Monitor your app:** Check Render dashboard for performance
3. **Upgrade to paid tier** (if needed):
   - Persistent storage for uploaded images
   - No cold starts
   - Custom domains
4. **Add a custom domain:** Available in Render settings

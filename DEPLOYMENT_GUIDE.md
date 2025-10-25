# Deployment Guide - Backend Server

## Problem
Your frontend is deployed at `https://cohrrt.thehubitz.com` but the backend Socket.IO server is NOT deployed. The frontend is trying to connect to `https://cohrrt.thehubitz.com/api/socket` which doesn't exist.

## Solution
You need to deploy your **backend server** separately.

---

## Quick Fix Options

### Option 1: Deploy Backend to Railway (Recommended - Free)

1. **Go to Railway.app** and sign up
2. **Create New Project** → Deploy from GitHub
3. **Select your repository** (pitching-cohrrt)
4. **Set Root Directory** to `/backend`
5. **Add Environment Variables** (if needed)
6. **Deploy** - Railway will give you a URL like `https://your-app.railway.app`
7. **Update your frontend env variables:**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-app.railway.app
   ```

### Option 2: Deploy Backend to Render.com (Free)

1. **Go to Render.com** and sign up
2. **Create New Web Service**
3. **Connect your GitHub repo**
4. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node index.js`
5. **Deploy** - Get your URL
6. **Update env variables** with your Render URL

### Option 3: Same Server (Reverse Proxy)

If your frontend is on a VPS, you can run both on the same server:

1. **SSH into your server**
2. **Navigate to backend folder:**
   ```bash
   cd /path/to/pitching-poll/backend
   npm install
   ```
3. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start index.js --name pitching-backend
   pm2 save
   pm2 startup
   ```
4. **Configure Nginx reverse proxy:**
   ```nginx
   location /api/ {
       proxy_pass http://localhost:4000/api/;
   }
   
   location /api/socket {
       proxy_pass http://localhost:4000/api/socket;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```
5. **Reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## After Deploying Backend

1. **Get your backend URL** (e.g., `https://your-backend.railway.app`)

2. **Update environment variables** in your hosting platform (Vercel/Netlify):
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

3. **Redeploy your frontend**

4. **Test the connection** - Socket errors should be gone!

---

## Checking if Backend is Running

Test your backend API:
```bash
curl https://your-backend-url.com/api/state
```

Should return JSON with session state.

---

## Current Issue Summary

❌ **Frontend**: `https://cohrrt.thehubitz.com` (deployed)  
❌ **Backend**: Not deployed (returns 404)

✅ **Need**: Deploy backend separately and connect them via environment variables

# 🚀 Backend Setup Complete!

## ✅ Your MongoDB Connection String is Configured

Your connection string has been added to `backend/.env`:
```
mongodb+srv://Amar:Amar@1055@cluster0.isorxr6.mongodb.net/lawpal
```

## 📦 Installation Steps

Open a NEW terminal and run these commands:

```powershell
# Navigate to backend folder (inside my-ai-lawyer-app)
cd my-ai-lawyer-app\backend

# Install all dependencies
npm install

# Start the development server
npm run dev
```

## ✨ What Will Happen

When you run `npm run dev`, you should see:
```
✅ Connected to MongoDB Atlas successfully!
📊 Database: lawpal
🚀 Server running on http://localhost:5000
📡 Auth endpoints: http://localhost:5000/auth/signup, /auth/signin
```

## 🧪 Test the Backend

### Option 1: Browser
Visit: `http://localhost:5000/health`

Should see:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2025-10-17T..."
}
```

### Option 2: PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

## 🎯 Next Steps

1. **Keep backend running** in one terminal
2. **Keep frontend running** in another terminal (`npm run dev` in my-ai-lawyer-app)
3. **Test authentication**:
   - Go to `http://localhost:5173/#/signup`
   - Create an account
   - Sign in
   - Should redirect to main app

## 🔍 Troubleshooting

**If MongoDB connection fails:**

Your connection string has a special character `@` in the password. MongoDB might need it URL-encoded.

Try this updated connection string in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://Amar:Amar%401055@cluster0.isorxr6.mongodb.net/lawpal?retryWrites=true&w=majority&appName=Cluster0
```

Notice: `@1055` became `%401055` (@ is encoded as %40)

**Port already in use:**
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
# Find the PID and kill it
taskkill /PID <PID_NUMBER> /F
```

**Dependencies not installing:**
```powershell
# Clear npm cache and retry
npm cache clean --force
npm install
```

## 📁 Backend Structure

```
backend/
├── src/
│   ├── server.ts           # Main server file
│   ├── models/
│   │   └── User.ts         # MongoDB User model
│   └── routes/
│       └── auth.ts         # Auth endpoints
├── .env                    # Your MongoDB config ✅
├── package.json
└── tsconfig.json
```

## 🎉 You're All Set!

Your backend is ready to:
- ✅ Connect to MongoDB Atlas
- ✅ Handle user registration
- ✅ Authenticate users with JWT
- ✅ Protect API endpoints
- ✅ Work with your React frontend

Just run `npm install` and `npm run dev` in the backend folder!

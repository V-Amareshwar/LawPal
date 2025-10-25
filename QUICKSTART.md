# 🎯 Quick Start Guide

## 📁 Current Project Structure

```
my-ai-lawyer-app/
├── backend/              # ✅ MongoDB Auth Backend
│   ├── src/
│   ├── .env             # Your MongoDB connection
│   └── package.json
├── src/                  # React Frontend
├── public/
└── package.json
```

## 🚀 Running the Full Stack

### Terminal 1: Start Backend (MongoDB Auth)

```powershell
cd my-ai-lawyer-app\backend
npm install
npm run dev
```

**Expected output:**
```
✅ Connected to MongoDB Atlas successfully!
📊 Database: lawpal
🚀 Server running on http://localhost:5000
📡 Auth endpoints: http://localhost:5000/auth/signup, /auth/signin
```

### Terminal 2: Start Frontend (React)

```powershell
cd my-ai-lawyer-app
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local:   http://localhost:5173/
➜ Network: use --host to expose
```

## ✅ Test Authentication

1. Open: `http://localhost:5173/#/signup`
2. Create an account
3. Sign in
4. You'll be redirected to the chat interface
5. Auth token is stored in localStorage

## 🔧 Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://Amar:Amar@1055@cluster0...
JWT_SECRET=lawpal-super-secret...
PORT=5000
```

### Frontend (vite.config.ts)
```typescript
'/auth': points to localhost:5000 (MongoDB backend)
'/api': points to localhost:5000 or Colab ngrok
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 5000 is available
- Verify MongoDB connection string
- Try encoding password: `Amar%401055` instead of `Amar@1055`

**Frontend can't reach backend:**
- Ensure backend is running on port 5000
- Check proxy config in `vite.config.ts`
- Restart Vite dev server

**Authentication not working:**
- Check browser console for errors
- Verify token in DevTools → Application → Local Storage
- Check backend terminal for request logs

## 📚 API Endpoints

### Auth (MongoDB Backend)
- POST `/auth/signup` - Create account
- POST `/auth/signin` - Login
- POST `/auth/signout` - Logout
- GET `/health` - Check backend status

### Chat (Colab/Local)
- POST `/api/ask` - Send chat query (requires auth token)

## 🎉 You're All Set!

Both terminals running? Head to `http://localhost:5173` and start chatting!

# Quick Start: MongoDB Atlas Integration

## ✅ What's Already Done

1. ✅ Frontend auth pages (SignIn/SignUp) with glassmorphism UI
2. ✅ Auth API client (`src/utils/auth.ts`)
3. ✅ Updated pages to use real authentication
4. ✅ JWT token storage in localStorage
5. ✅ Vite proxy configured for auth endpoints

## 🚀 Quick Setup (5 minutes)

### Option 1: Use the Complete Backend (Recommended)

Follow the full setup in `MONGODB_SETUP.md` to create a proper Node.js/Express backend with MongoDB Atlas.

### Option 2: Quick Test Setup (Fastest)

If you just want to test the UI without setting up MongoDB:

1. The auth pages will work and show errors
2. Chat will continue working with your Colab backend
3. Set up MongoDB later when ready

## 🔧 Configuration

### Current Vite Proxy Setup

```typescript
// vite.config.ts
'/auth': points to localhost:5000 (MongoDB backend)
'/api': points to localhost:5000 (can switch to Colab ngrok)
```

### To Use Colab for Chat + Local for Auth

```typescript
// In vite.config.ts
'/auth': {
  target: 'http://localhost:5000', // MongoDB backend
},
'/api': {
  target: 'https://YOUR_NGROK.ngrok-free.app', // Colab
  rewrite: (path) => path.replace(/^\/api/, ''),
},
```

## 📝 Environment Variables Needed

### Frontend (`.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lawpal
JWT_SECRET=your-secret-key
PORT=5000
GROQ_API_KEY=your-groq-key
```

## 🧪 Testing Authentication

1. **Start backend** (if using MongoDB):
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start frontend**:
   ```powershell
   cd my-ai-lawyer-app
   npm run dev
   ```

3. **Test flow**:
   - Go to `http://localhost:5173/#/signup`
   - Create an account
   - Sign in
   - Should redirect to main app
   - Chat should include auth token in requests

## 🔒 Security Features Implemented

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Secure password requirements (min 8 chars)
- ✅ Email validation
- ✅ Protected API endpoints
- ✅ Token storage in localStorage
- ✅ Automatic token inclusion in chat requests

## 🐛 Troubleshooting

**"Failed to fetch" on sign up/in:**
- Backend not running on port 5000
- Check proxy configuration in vite.config.ts
- Verify MongoDB connection string

**Token not working:**
- Check browser DevTools → Application → Local Storage
- Should see `authToken` key
- Verify JWT_SECRET matches in backend

**CORS errors:**
- Backend must allow `http://localhost:5173` origin
- Check CORS configuration in backend

## 📚 Next Steps

1. Set up MongoDB Atlas cluster (free tier)
2. Create backend with provided code
3. Test authentication flow
4. Integrate with your RAG pipeline
5. Add user-specific conversation history
6. Implement protected routes

See `MONGODB_SETUP.md` for complete backend setup instructions!

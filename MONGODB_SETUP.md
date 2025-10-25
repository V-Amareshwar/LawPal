# MongoDB Atlas Backend Setup Guide

## Prerequisites
1. MongoDB Atlas account (free tier available)
2. Node.js installed
3. Your frontend already running

## Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (free M0 tier works fine)
4. Click "Connect" → "Connect your application"
5. Copy your connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/`)
6. Replace `<password>` with your actual database password

## Step 2: Create Backend Server

Create a new directory for your backend:

```powershell
mkdir backend
cd backend
npm init -y
```

Install dependencies:

```powershell
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install -D @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/node typescript ts-node nodemon
```

## Step 3: Backend Files

### `backend/src/server.ts`

```typescript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL || ''],
  credentials: true,
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### `backend/src/models/User.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>('User', UserSchema);
```

### `backend/src/routes/auth.ts`

```typescript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Sign up error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Sign Out
router.post('/signout', (req, res) => {
  res.json({ success: true, message: 'Signed out successfully' });
});

export default router;
```

### `backend/src/routes/chat.ts`

```typescript
import express from 'express';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Chat endpoint (protected)
router.post('/ask', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    
    // TODO: Integrate your RAG pipeline here
    // For now, return a placeholder
    res.json({
      answer: `Received your query: "${query}". RAG pipeline integration pending.`,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

export default router;
```

### `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
```

### `backend/.env`

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:<password>@cluster.mongodb.net/lawpal?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Groq API (for your RAG pipeline)
GROQ_API_KEY=your-groq-api-key
```

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### `backend/package.json` scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

## Step 4: Update Frontend Vite Config

Update `my-ai-lawyer-app/vite.config.ts`:

```typescript
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
```

## Step 5: Run the Full Stack

### Terminal 1: Backend
```powershell
cd backend
npm run dev
```

### Terminal 2: Frontend
```powershell
cd my-ai-lawyer-app
npm run dev
```

## Step 6: Test Authentication

1. Go to `http://localhost:5173/#/signup`
2. Create a new account
3. Sign in with your credentials
4. You should be redirected to the main app

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**
1. Change JWT_SECRET to a strong random string
2. Use environment variables, never commit secrets
3. Enable MongoDB Atlas IP whitelist
4. Add rate limiting to auth endpoints
5. Implement email verification
6. Use HTTPS in production
7. Add input sanitization

## Troubleshooting

**MongoDB connection fails:**
- Check your connection string
- Verify IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for testing)
- Ensure password doesn't contain special characters that need encoding

**CORS errors:**
- Make sure backend CORS allows your frontend origin
- Check proxy configuration in vite.config.ts

**Token not working:**
- Check localStorage in browser DevTools
- Verify JWT_SECRET matches between sign up and sign in

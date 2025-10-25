import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import passport from 'passport';
import session from 'express-session';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from './models/User';
import jwt from 'jsonwebtoken';
import profileRoutes from './routes/profile';
import conversationsRoutes from './routes/conversations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL || ''],
  credentials: true,
}));
app.use(express.json());
// Minimal session for passport (not used for app auth, only to complete OAuth handshake)
app.use(session({ secret: process.env.SESSION_SECRET || 'session-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done: (err: any, id?: string) => void) => done(null, (user as any).id));
passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (e) { done(e as any); }
});

// Strategies
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  }, async (_accessToken: any, _refreshToken: any, profile: any, done: (err: any, user?: any) => void) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const name = profile.displayName || profile.name?.givenName || 'User';
      const providerId = profile.id;
      if (!email) return done(new Error('No email from Google'));
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          isEmailVerified: true,
          provider: 'google',
          providerId,
          profilePhoto: profile.photos?.[0]?.value || '',
        });
      } else if (!user.provider) {
        user.provider = 'google';
        user.providerId = providerId;
        user.isEmailVerified = true;
        await user.save();
      }
      return done(null, user);
    } catch (e) { return done(e as any); }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback',
    scope: ['user:email'],
  }, async (_accessToken: any, _refreshToken: any, profile: any, done: (err: any, user?: any) => void) => {
    try {
  const primaryEmail = (profile.emails && profile.emails.find((e: any) => e.primary)?.value) || profile.emails?.[0]?.value;
      const email = primaryEmail?.toLowerCase();
      const name = profile.displayName || profile.username || 'User';
      const providerId = profile.id;
      if (!email) return done(new Error('No email from GitHub'));
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          isEmailVerified: true,
          provider: 'github',
          providerId,
          profilePhoto: profile.photos?.[0]?.value || '',
        });
      } else if (!user.provider) {
        user.provider = 'github';
        user.providerId = providerId;
        user.isEmailVerified = true;
        await user.save();
      }
      return done(null, user);
    } catch (e) { return done(e as any); }
  }));
}

// Basic request logging to aid debugging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// DB connection guard: return clear JSON while DB is disconnected
function dbGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
  const state = mongoose.connection.readyState;
  if (state === 1) return next();
  const stateMap: Record<number, string> = {0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting'};
  return res.status(503).json({
    success: false,
    message: 'Database not connected. Please ensure MongoDB Atlas IP is whitelisted or use a local MongoDB URI.',
    mongodbState: stateMap[state] || String(state),
  });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection with retry (dev-friendly)
const MONGODB_URI = process.env.MONGODB_URI as string;

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📊 Database:', mongoose.connection.name);
  } catch (err: any) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    console.log('⏳ Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();

// Routes - Order matters! More specific routes first, and guarded by DB state
app.use('/auth/profile', dbGuard, profileRoutes);
app.use('/auth', dbGuard, authRoutes);
app.use('/auth/conversations', dbGuard, conversationsRoutes);

// OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/#/signin?error=google_failed` }), async (req, res) => {
  const user = ((req as any).user as any);
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  const redirectUrl = new URL(`${FRONTEND_URL}/#/oauth-finish`);
  redirectUrl.searchParams.set('token', token);
  res.redirect(redirectUrl.toString());
});

app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/#/signin?error=github_failed` }), async (req, res) => {
  const user = ((req as any).user as any);
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  const redirectUrl = new URL(`${FRONTEND_URL}/#/oauth-finish`);
  redirectUrl.searchParams.set('token', token);
  res.redirect(redirectUrl.toString());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Auth endpoints: http://localhost:${PORT}/auth/signup, /auth/signin`);
});

// Global process-level error handlers for diagnostics
process.on('unhandledRejection', (reason: any) => {
  console.error('UNHANDLED REJECTION:', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
});

process.on('uncaughtException', (err: any) => {
  console.error('UNCAUGHT EXCEPTION:', err?.message || err);
  if (err?.stack) console.error(err.stack);
});

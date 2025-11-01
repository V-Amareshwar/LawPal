import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Helper function to generate verification token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Sign Up - Step 1: Send verification email
router.post('/signup', async (req, res) => {
  try {
    const { name, email } = req.body;

    console.log('========================================');
    console.log('📥 POST /auth/signup RECEIVED!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('========================================');

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        // If verified but no password yet, guide user to set password
        if (!existingUser.password) {
          const responseData = {
            success: true,
            message: 'Email verified. Please set your password.',
            userId: existingUser._id,
            requirePasswordSetup: true,
          };
          console.log('📤 /auth/signup (continue setup) response:', { success: responseData.success });
          return res.status(200).json(responseData);
        }
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Not verified yet: regenerate verification token and resend
      const verificationToken = generateToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      existingUser.emailVerificationToken = verificationToken;
      existingUser.emailVerificationExpires = verificationExpires;
      existingUser.name = name; // allow updating name before verification
      await existingUser.save();

      // Get first URL from comma-separated FRONTEND_URL (for CORS it has multiple, but we only need one for links)
      const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
      const FRONTEND_URL = frontendUrls[0].trim(); // Use first URL (production)
      const verifyLink = `${FRONTEND_URL}/#/signup?token=${verificationToken}`;
      console.log('📧 Attempting to resend verification email to:', existingUser.email);
      try {
        await sendVerificationEmail(existingUser.email, verifyLink);
        console.log('✅ Verification email resent successfully to:', existingUser.email);
      } catch (mailErr: any) {
        console.error('❌ Failed to resend verification email:', mailErr?.message);
        console.warn('⚠️  Signup proceeding despite email failure (SMTP timeout on free tier)');
        // Continue anyway - user account exists, they can request new verification email later
      }

      const responseData = {
        success: true,
        message: 'Verification email resent',
        userId: existingUser._id,
        ...(process.env.NODE_ENV === 'development' && { verificationToken }),
      };
      console.log('📤 /auth/signup (resend) response:', { success: responseData.success });
      return res.status(200).json(responseData);
    }

  // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user without password
    const user = new User({
      name,
      email: email.toLowerCase(),
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await user.save();

    // Get first URL from comma-separated FRONTEND_URL (for CORS it has multiple, but we only need one for links)
    const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
    const FRONTEND_URL = frontendUrls[0].trim(); // Use first URL (production)
    const verifyLink = `${FRONTEND_URL}/#/signup?token=${verificationToken}`;
    console.log('📧 Attempting to send verification email to:', user.email);
    try {
      await sendVerificationEmail(user.email, verifyLink);
      console.log('✅ Verification email sent successfully to:', user.email);
    } catch (mailErr: any) {
      console.error('❌ Failed to send verification email:', mailErr?.message);
      console.warn('⚠️  Signup proceeding despite email failure (SMTP timeout on free tier)');
      // Continue anyway - user account created, they can request verification email later
    }

    const responseData = {
      success: true,
      message: 'Verification email sent',
      userId: user._id,
      // In development, send token in response
      ...(process.env.NODE_ENV === 'development' && { verificationToken }),
    };
  console.log('📤 /auth/signup response:', { success: responseData.success });
    res.status(201).json(responseData);
  } catch (error: any) {
    console.error('❌ Sign up error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? 'Email already exists' : 'Server error'
    });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('📥 POST /auth/verify-email');

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

  // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Email verified for:', user.email);
    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    console.error('❌ Verify email error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Resend verification email for an existing, not-yet-verified user
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Avoid leaking which emails exist
      return res.json({ success: true, message: 'If the email exists and is not verified, a verification email has been resent' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified. Please sign in.' });
    }

    const verificationToken = generateToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${FRONTEND_URL}/#/signup?token=${verificationToken}`;
    try {
      await sendVerificationEmail(user.email, verifyLink);
    } catch (mailErr: any) {
      console.error('❌ Failed to resend verification email:', mailErr?.message);
      return res.status(500).json({ success: false, message: 'Failed to resend verification email. Please try again later.' });
    }

    return res.json({ success: true, message: 'Verification email resent' });
  } catch (error: any) {
    console.error('❌ Resend verification error:', error?.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Set Password - Step 2: After email verification
router.post('/set-password', async (req, res) => {
  try {
    const { userId, password } = req.body;

    console.log('📥 POST /auth/set-password', { userId });

    // Validation
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    const responseData = {
      success: true,
      message: 'Password set successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    };
    console.log('📤 /auth/set-password response:', { success: responseData.success });
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Set password error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📥 POST /auth/signin', { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password is set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please complete your account setup first'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Require verified email
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before signing in'
      });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    const responseData = {
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    };
    console.log('📤 /auth/signin response:', { success: responseData.success, user: responseData.user });
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Sign in error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Forgot Password - Send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📥 POST /auth/forgot-password', { email });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Explicitly inform that user does not exist (product decision)
      return res.status(404).json({
        success: false,
        message: 'User does not exist'
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // TODO: Send reset email
    const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
    const FRONTEND_URL = frontendUrls[0].trim();
    const resetLink = `${FRONTEND_URL}/#/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (mailErr: any) {
      console.error('❌ Failed to send reset email:', mailErr?.message);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      // In development, send token in response
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error: any) {
    console.error('❌ Forgot password error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reset Password - Set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log('📥 POST /auth/reset-password');

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Password reset for:', user.email);
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    console.error('❌ Reset password error:', error?.message);
    if (error?.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Sign Out
router.post('/signout', (req, res) => {
  res.json({
    success: true,
    message: 'Signed out successfully'
  });
});

export default router;

import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /auth/profile - Get user profile
router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('📥 GET /auth/profile request received');
    const userId = (req as any).user.userId;
    console.log('👤 User ID from token:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User profile found:', user.name, user.email);
    
    const responseData = {
      success: true,
      user: {
        name: user.name || '',
        email: user.email || '',
        profilePhoto: user.profilePhoto || '',
      },
    };
    
    console.log('📤 Sending response:', responseData);
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Profile fetch error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /auth/profile/photo - Upload profile photo
router.post('/photo', verifyToken, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old photo if exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Save relative path
    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePhoto = photoUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      photoUrl: photoUrl,
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /auth/profile/name - Update user name
router.put('/name', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    await user.save();

    res.json({
      success: true,
      message: 'Name updated successfully',
      name: user.name,
    });
  } catch (error: any) {
    console.error('Name update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /auth/profile/email - Update user email
router.put('/email', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && String(existingUser._id) !== userId) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = email.toLowerCase().trim();
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully',
      email: user.email,
    });
  } catch (error: any) {
    console.error('Email update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /auth/profile/password - Change password
router.put('/password', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({ message: 'No password set for this account. Please reset your password.' });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

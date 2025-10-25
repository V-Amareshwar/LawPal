import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    console.log('🧹 Cleaning up old/unverified users...');
    // Define criteria of "old" users to remove:
    // - Missing isEmailVerified OR isEmailVerified false
    // - OR missing password (never completed setup)
    const result = await User.deleteMany({
      $or: [
        { isEmailVerified: { $ne: true } },
        { password: { $exists: false } },
        { password: null },
      ],
    });

    console.log(`✅ Removed ${result.deletedCount} user(s).`);
  } catch (err: any) {
    console.error('❌ Cleanup failed:', err?.message);
    if (err?.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

run();

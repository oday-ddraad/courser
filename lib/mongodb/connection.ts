import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  initialized: boolean;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null, initialized: false };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    // Initialize default admin user after successful connection (only once)
    if (!cached.initialized) {
      await initializeDefaultAdmin();
      cached.initialized = true;
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Initialize default admin user after successful connection (only once)
    if (!cached.initialized) {
      await initializeDefaultAdmin();
      cached.initialized = true;
    }
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * Initialize default admin user if no admin accounts exist
 */
async function initializeDefaultAdmin(): Promise<void> {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✅ Default admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456A!', 12);

    const defaultAdmin = new User({
      email: 'oday.oth.r@gmail.com',
      password: hashedPassword,
      name: 'adminroot',
      role: 'admin',
      locale: 'en',
      country: 'US',
      isActive: true,
    });

    await defaultAdmin.save();
    console.log('✅ Default admin user created successfully');
  } catch (error) {
    console.error('❌ Error initializing default admin user:', error);
  }
}

export default connectDB;

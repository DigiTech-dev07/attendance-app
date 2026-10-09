import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.log('ℹ️ MONGODB_URI not provided. Using built-in persistent local database store.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const conn = await mongoose.connect(uri, opts);
    isConnected = !!conn.connections[0].readyState;
    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.log('ℹ️ Falling back to persistent local database store for continuous operation.');
    return false;
  }
}

export function isMongooseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

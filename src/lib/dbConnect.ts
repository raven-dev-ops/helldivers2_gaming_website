// src/lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';
import { logger } from '@/lib/logger';

// Register schemas once (OK as long as models don't import dbConnect)
import '@/models/User';
import '@/models/ForumCategory';
import '@/models/ForumThread';
import '@/models/ForumPost';
import '@/models/AllianceProfile';

type MongooseCache = { conn: Mongoose | null; promise: Promise<Mongoose> | null };

declare global {
  var mongoose_cache: MongooseCache | undefined; // no eslint-disable needed
}

const g = globalThis as typeof globalThis & { mongoose_cache?: MongooseCache };
g.mongoose_cache ??= { conn: null, promise: null };
const cached = g.mongoose_cache!;

/** Connect to MongoDB lazily (no env access at import). */
export default async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI missing: set it in Heroku config vars');

    const opts: Parameters<typeof mongoose.connect>[1] = {
      bufferCommands: false,
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 1),
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 4000),
      socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 15000),
      waitQueueTimeoutMS: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 2000),
      heartbeatFrequencyMS: Number(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || 10000),
      family: 4,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    logger?.error?.('MongoDB connection error:', err);
    throw err;
  }
}

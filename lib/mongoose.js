import mongoose from "mongoose";

const MONGO_URL = process.env.DATABASE_URL;

if (!MONGO_URL) {
  console.warn("DATABASE_URL is not set. Mongoose will not connect until it's provided.");
}

let cached = globalThis._mongoose;
if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URL, {
      // Let mongoose use the connection string defaults
      // Keep defaults so SRV strings work without extra parsing
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectMongoose;

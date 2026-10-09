import app from '../server/app.js';
import { connectDB } from '../server/config/db.js';

// Serverless Handler for Vercel
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/connection';

/**
 * Test API route to verify MongoDB connection
 * Visit: http://localhost:3000/api/test-db
 */
export async function GET() {
  try {
    const db = await connectDB();
    const dbName = db.connection.db?.databaseName || 'unknown';
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connected successfully',
      database: dbName,
      connectionState: db.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to MongoDB',
        error: error.message,
        hint: 'Make sure MONGODB_URI is set in .env.local',
      },
      { status: 500 }
    );
  }
}

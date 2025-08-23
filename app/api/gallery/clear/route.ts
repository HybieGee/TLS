import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  meta: Record<string, unknown>;
}

export async function POST() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DB = (process.env as any).DB as D1Database | undefined;
  
  if (!DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    console.log('🧹 Clearing all gallery positions...');
    
    // Clear all gallery positions
    await DB.prepare(
      'UPDATE GalleryPosition SET submissionId = NULL, periodKey = NULL, deployedAt = NULL'
    ).run();
    
    console.log('✅ Gallery positions cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Gallery positions cleared for fresh start'
    });
    
  } catch (error) {
    console.error('Clear gallery error:', error);
    return NextResponse.json(
      { error: 'Failed to clear gallery positions' },
      { status: 500 }
    );
  }
}
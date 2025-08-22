import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  first: () => Promise<Record<string, unknown> | null>;
  all: () => Promise<D1ResultSet>;
}

interface D1Result {
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1ResultSet {
  results: Record<string, unknown>[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface KVNamespace {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string) => Promise<string | null>;
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DB = (process.env as any).DB as D1Database | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const KV_SESSIONS = (process.env as any).KV_SESSIONS as KVNamespace | undefined;
    
    console.log('Test DB - Checking bindings:', {
      hasDB: !!DB,
      hasKV: !!KV_SESSIONS,
      envKeys: Object.keys(process.env || {}),
      nodeEnv: process.env.NODE_ENV
    });

    if (!DB || !KV_SESSIONS) {
      return NextResponse.json({
        success: false,
        error: 'Bindings not available',
        hasDB: !!DB,
        hasKV: !!KV_SESSIONS,
        envKeys: Object.keys(process.env || {}).slice(0, 10) // First 10 keys only
      });
    }

    // Test database connection
    const testQuery = await DB.prepare('SELECT COUNT(*) as count FROM Submission').all();
    
    return NextResponse.json({
      success: true,
      hasDB: !!DB,
      hasKV: !!KV_SESSIONS,
      submissionCount: testQuery.results?.[0]?.count || 0,
      dbTest: testQuery.success
    });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      hasDB: !!(process.env as any).DB,
      hasKV: !!(process.env as any).KV_SESSIONS
    }, { status: 500 });
  }
}
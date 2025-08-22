import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
  // For development, return mock user data
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'dev-user',
        kind: 'guest',
        alias: null,
        createdAt: new Date().toISOString()
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DB = (process.env as any).DB as D1Database | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const KV_SESSIONS = (process.env as any).KV_SESSIONS as KVNamespace | undefined;
  
  if (!DB || !KV_SESSIONS) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ authenticated: false });
    }

    const sessionData = await KV_SESSIONS.get(sessionId);
    if (!sessionData) {
      return NextResponse.json({ authenticated: false });
    }

    const session = JSON.parse(sessionData);
    
    const userResult = await DB.prepare(
      'SELECT id, kind, alias, createdAt, banned FROM User WHERE id = ?'
    ).bind(session.userId).first();

    if (!userResult || userResult.banned) {
      return NextResponse.json({ authenticated: false });
    }

    const now = new Date().toISOString();
    await DB.prepare(
      'UPDATE Session SET lastSeenAt = ? WHERE id = ?'
    ).bind(now, sessionId).run();
    
    session.lastSeenAt = now;
    await KV_SESSIONS.put(sessionId, JSON.stringify(session), { 
      expirationTtl: 86400 * 30 
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userResult.id,
        kind: userResult.kind,
        alias: userResult.alias,
        createdAt: userResult.createdAt
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    );
  }
}
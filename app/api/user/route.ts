import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
  KV_SESSIONS: KVNamespace;
  SESSION_COOKIE_NAME?: string;
}

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement;
  run: () => Promise<any>;
  first: () => Promise<any>;
  all: () => Promise<any>;
}

interface KVNamespace {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string) => Promise<string | null>;
}

export async function GET() {
  const env = process.env as unknown as Env;
  
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(env.SESSION_COOKIE_NAME || 'sb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ authenticated: false });
    }

    const sessionData = await env.KV_SESSIONS.get(sessionId);
    if (!sessionData) {
      return NextResponse.json({ authenticated: false });
    }

    const session = JSON.parse(sessionData);
    
    const userResult = await env.DB.prepare(
      'SELECT id, kind, alias, createdAt, banned FROM User WHERE id = ?'
    ).bind(session.userId).first();

    if (!userResult || userResult.banned) {
      return NextResponse.json({ authenticated: false });
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE Session SET lastSeenAt = ? WHERE id = ?'
    ).bind(now, sessionId).run();
    
    session.lastSeenAt = now;
    await env.KV_SESSIONS.put(sessionId, JSON.stringify(session), { 
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
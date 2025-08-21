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

export async function POST(request: NextRequest) {
  const env = process.env as unknown as Env;
  
  try {
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const ipHash = await hashIP(ipAddress);

    await env.DB.prepare(
      'INSERT INTO User (id, kind, createdAt) VALUES (?, ?, ?)'
    ).bind(userId, 'guest', now).run();

    await env.DB.prepare(
      'INSERT INTO Session (id, userId, createdAt, lastSeenAt, ipHash) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, now, now, ipHash).run();

    await env.KV_SESSIONS.put(sessionId, JSON.stringify({
      userId,
      createdAt: now,
      lastSeenAt: now,
      ipHash
    }), { expirationTtl: 86400 * 30 });

    const cookieStore = await cookies();
    cookieStore.set(env.SESSION_COOKIE_NAME || 'sb_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 30,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      userId,
      sessionId,
      kind: 'guest'
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest session' },
      { status: 500 }
    );
  }
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
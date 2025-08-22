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

export async function POST(request: NextRequest) {
  // For production, access Cloudflare bindings through context
  const env = (request as NextRequest & { env?: Env }).env;
  
  // If no database available (dev or production without DB), use mock response
  if (!env?.DB || !env?.KV_SESSIONS) {
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    
    const cookieStore = await cookies();
    cookieStore.set('sb_session', sessionId, {
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
  }
  
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
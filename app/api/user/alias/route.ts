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

export async function PUT(request: NextRequest) {
  const env = process.env as unknown as Env;
  
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(env.SESSION_COOKIE_NAME || 'sb_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = await env.KV_SESSIONS.get(sessionId);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionData);
    const { alias } = await request.json();
    
    if (!alias || alias.length < 3 || alias.length > 30) {
      return NextResponse.json(
        { error: 'Alias must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    const sanitizedAlias = alias.replace(/[^a-zA-Z0-9_-]/g, '');
    
    await env.DB.prepare(
      'UPDATE User SET alias = ? WHERE id = ?'
    ).bind(sanitizedAlias, session.userId).run();

    return NextResponse.json({
      success: true,
      alias: sanitizedAlias
    });
  } catch (error) {
    console.error('Alias update error:', error);
    return NextResponse.json(
      { error: 'Failed to update alias' },
      { status: 500 }
    );
  }
}
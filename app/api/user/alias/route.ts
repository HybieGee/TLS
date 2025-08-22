import { NextRequest, NextResponse } from 'next/server';
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

export async function PUT(request: NextRequest) {
  // For development, return mock success
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      success: true,
      alias: 'dev-alias'
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = await KV_SESSIONS.get(sessionId);
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
    
    await DB.prepare(
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
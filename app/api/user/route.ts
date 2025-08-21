import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  
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
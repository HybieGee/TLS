import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface KVNamespace {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string) => Promise<string | null>;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    
    console.log('Test Session - sessionId:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'No session cookie found',
        cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value]))
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const KV_SESSIONS = (process.env as any).KV_SESSIONS as KVNamespace | undefined;
    
    if (!KV_SESSIONS) {
      return NextResponse.json({
        success: false,
        error: 'KV not available',
        sessionId
      });
    }

    const sessionData = await KV_SESSIONS.get(sessionId);
    console.log('Test Session - sessionData found:', !!sessionData);
    
    return NextResponse.json({
      success: true,
      sessionId,
      hasSessionData: !!sessionData,
      sessionData: sessionData ? JSON.parse(sessionData) : null
    });
  } catch (error) {
    console.error('Test Session error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
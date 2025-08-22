import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: () => Promise<Record<string, unknown> | null>;
  all: () => Promise<D1ResultSet>;
}

interface D1ResultSet {
  results: Record<string, unknown>[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface KVNamespace {
  get: (key: string) => Promise<string | null>;
}

export async function GET(request: NextRequest) {
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
    
    // Get period key from query params
    const url = new URL(request.url);
    const periodKey = url.searchParams.get('period');
    
    if (!periodKey) {
      return NextResponse.json(
        { error: 'Period key is required' },
        { status: 400 }
      );
    }

    // Check how many votes the user has made this hour
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const existingVotes = await DB.prepare(
      'SELECT COUNT(*) as count FROM Vote WHERE userId = ? AND createdAt >= ? AND createdAt < ?'
    ).bind(session.userId, hourStart.toISOString(), hourEnd.toISOString()).first();

    const votesUsed = Number(existingVotes?.count || 0);
    const votesRemaining = Math.max(0, 3 - votesUsed);

    // Get which submissions the user has voted for in this period
    const votedSubmissions = await DB.prepare(
      'SELECT submissionId FROM Vote WHERE userId = ? AND periodKey = ?'
    ).bind(session.userId, periodKey).all();

    const votedSubmissionIds = (votedSubmissions.results || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vote: any) => vote.submissionId
    );

    return NextResponse.json({
      votesRemaining,
      votesUsed,
      votedSubmissionIds,
      userId: session.userId
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user votes' },
      { status: 500 }
    );
  }
}
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

export async function POST(request: NextRequest) {
  try {
    console.log('Test vote POST - Starting');

    // Test bindings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DB = (process.env as any).DB as D1Database | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const KV_SESSIONS = (process.env as any).KV_SESSIONS as KVNamespace | undefined;
    
    if (!DB || !KV_SESSIONS) {
      return NextResponse.json({
        error: 'Database not available',
        hasDB: !!DB,
        hasKV: !!KV_SESSIONS
      }, { status: 503 });
    }

    // Test session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    
    console.log('Test vote POST - sessionId:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json({
        error: 'Not authenticated',
        sessionId: null
      }, { status: 401 });
    }

    const sessionData = await KV_SESSIONS.get(sessionId);
    console.log('Test vote POST - sessionData found:', !!sessionData);
    
    if (!sessionData) {
      return NextResponse.json({
        error: 'Invalid session',
        sessionId,
        hasSessionData: false
      }, { status: 401 });
    }

    const session = JSON.parse(sessionData);
    const { submissionId, periodKey } = await request.json();
    
    console.log('Test vote POST - request data:', { submissionId, periodKey });

    if (!submissionId || !periodKey) {
      return NextResponse.json({
        error: 'Missing required fields',
        submissionId: !!submissionId,
        periodKey: !!periodKey
      }, { status: 400 });
    }

    // Test submission exists
    const submission = await DB.prepare(
      'SELECT id, name FROM Submission WHERE id = ? AND status = ?'
    ).bind(submissionId, 'approved').first();

    console.log('Test vote POST - submission found:', !!submission);

    if (!submission) {
      return NextResponse.json({
        error: 'Submission not found',
        submissionId
      }, { status: 404 });
    }

    // Check existing votes for this hour
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const existingVotes = await DB.prepare(
      'SELECT COUNT(*) as count FROM Vote WHERE userId = ? AND createdAt >= ? AND createdAt < ?'
    ).bind(session.userId, hourStart.toISOString(), hourEnd.toISOString()).first();

    console.log('Test vote POST - existing votes:', existingVotes?.count || 0);

    if (existingVotes && Number(existingVotes.count) >= 3) {
      return NextResponse.json({
        error: 'You have reached the maximum of 3 votes per hour',
        existingVotes: existingVotes.count
      }, { status: 400 });
    }

    // Try to insert the vote
    const voteId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const insertResult = await DB.prepare(
      'INSERT INTO Vote (id, userId, submissionId, periodKey, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).bind(voteId, session.userId, submissionId, periodKey, now).run();

    console.log('Test vote POST - insert result:', insertResult.success);

    return NextResponse.json({
      success: true,
      voteId,
      submissionId,
      totalVotes: 1,
      insertSuccess: insertResult.success
    });

  } catch (error) {
    console.error('Test vote POST error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
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

export async function GET(request: NextRequest) {
  // For development, return mock data
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      period: 'mock',
      submissions: []
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DB = (process.env as any).DB as D1Database | undefined;
  
  if (!DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    const url = new URL(request.url);
    const periodKey = url.searchParams.get('period');
    
    if (!periodKey) {
      return NextResponse.json(
        { error: 'Period key is required' },
        { status: 400 }
      );
    }

    // Calculate the current hour's time range
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    console.log('Votes API Debug:', {
      periodKey,
      hourStart: hourStart.toISOString(),
      hourEnd: hourEnd.toISOString(),
      now: now.toISOString()
    });

    // Get submissions with proper vote counts
    const voteCounts = await DB.prepare(
      `SELECT 
        s.id, s.name, s.description, s.imageUrl,
        COUNT(v.id) as voteCount,
        'Guest' as userAlias
       FROM Submission s
       LEFT JOIN Vote v ON s.id = v.submissionId AND v.periodKey = ?
       WHERE s.status = 'approved'
       AND s.createdAt >= ? AND s.createdAt < ?
       GROUP BY s.id, s.name, s.description, s.imageUrl
       ORDER BY s.createdAt DESC`
    ).bind(periodKey, hourStart.toISOString(), hourEnd.toISOString()).all();

    console.log('Vote counts result:', {
      success: voteCounts.success,
      resultCount: voteCounts.results?.length || 0,
      results: voteCounts.results
    });

    return NextResponse.json({
      period: periodKey,
      submissions: voteCounts.results || []
    });
  } catch (error) {
    console.error('Get votes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {

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
    console.log('POST /api/votes - Starting vote submission');
    
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('sb_session')?.value;
    
    console.log('POST votes debug - sessionId:', sessionId);
    
    if (!sessionId) {
      console.log('POST votes error - No session ID');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = await KV_SESSIONS.get(sessionId);
    console.log('POST votes debug - sessionData found:', !!sessionData);
    if (!sessionData) {
      console.log('POST votes error - Invalid session data');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionData);
    console.log('POST votes debug - session parsed, userId:', session.userId);
    
    const requestBody = await request.json();
    console.log('POST votes debug - request body:', requestBody);
    const { submissionId, periodKey } = requestBody;
    
    if (!submissionId || !periodKey) {
      console.log('POST votes error - Missing required fields:', { submissionId: !!submissionId, periodKey: !!periodKey });
      return NextResponse.json(
        { error: 'Submission ID and period key are required' },
        { status: 400 }
      );
    }

    // Check if user has already made 3 votes this hour
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    console.log('POST votes debug - Checking existing votes for hour:', { hourStart: hourStart.toISOString(), hourEnd: hourEnd.toISOString() });
    
    const existingVotes = await DB.prepare(
      'SELECT COUNT(*) as count FROM Vote WHERE userId = ? AND createdAt >= ? AND createdAt < ?'
    ).bind(session.userId, hourStart.toISOString(), hourEnd.toISOString()).first();

    console.log('POST votes debug - Existing votes this hour:', existingVotes?.count || 0);

    if (existingVotes && Number(existingVotes.count) >= 3) {
      console.log('POST votes error - Vote limit reached');
      return NextResponse.json(
        { error: 'You have reached the maximum of 3 votes per hour' },
        { status: 400 }
      );
    }

    // Check if already voted for this specific submission in this period
    console.log('POST votes debug - Checking if already voted for submission:', submissionId);
    const existingVoteForSubmission = await DB.prepare(
      'SELECT id FROM Vote WHERE userId = ? AND submissionId = ? AND periodKey = ?'
    ).bind(session.userId, submissionId, periodKey).first();

    if (existingVoteForSubmission) {
      console.log('POST votes error - Already voted for this submission');
      return NextResponse.json(
        { error: 'You have already voted for this submission' },
        { status: 400 }
      );
    }

    console.log('POST votes debug - Checking submission exists:', submissionId);
    const submission = await DB.prepare(
      'SELECT id FROM Submission WHERE id = ? AND status = ?'
    ).bind(submissionId, 'approved').first();

    if (!submission) {
      console.log('POST votes error - Submission not found or not approved');
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    const voteId = crypto.randomUUID();
    const now = new Date().toISOString();

    console.log('POST votes debug - Inserting vote:', { voteId, userId: session.userId, submissionId, periodKey, now });

    const insertResult = await DB.prepare(
      `INSERT INTO Vote 
       (id, userId, submissionId, periodKey, createdAt) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(voteId, session.userId, submissionId, periodKey, now).run();

    console.log('POST votes debug - Insert result:', insertResult);

    const voteCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM Vote WHERE submissionId = ? AND periodKey = ?'
    ).bind(submissionId, periodKey).first();

    console.log('POST votes debug - Final vote count:', voteCount);

    return NextResponse.json({
      success: true,
      voteId,
      submissionId,
      totalVotes: voteCount?.count || 1
    });
  } catch (error) {
    console.error('Create vote error:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}


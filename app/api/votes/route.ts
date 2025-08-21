import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  
  try {
    const url = new URL(request.url);
    const periodKey = url.searchParams.get('period');
    
    if (!periodKey) {
      return NextResponse.json(
        { error: 'Period key is required' },
        { status: 400 }
      );
    }

    const voteCounts = await env.DB.prepare(
      `SELECT 
        s.id, s.name, s.description, s.imageUrl,
        COUNT(v.id) as voteCount,
        u.alias as userAlias
       FROM Submission s
       LEFT JOIN Vote v ON s.id = v.submissionId AND v.periodKey = ?
       LEFT JOIN User u ON s.userId = u.id
       WHERE s.status = 'approved'
       GROUP BY s.id
       ORDER BY voteCount DESC`
    ).bind(periodKey).all();

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
  const env = process.env as any;
  
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
    const { submissionId, periodKey } = await request.json();
    
    if (!submissionId || !periodKey) {
      return NextResponse.json(
        { error: 'Submission ID and period key are required' },
        { status: 400 }
      );
    }

    const existingVote = await env.DB.prepare(
      'SELECT id FROM Vote WHERE userId = ? AND periodKey = ?'
    ).bind(session.userId, periodKey).first();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted in this period' },
        { status: 400 }
      );
    }

    const submission = await env.DB.prepare(
      'SELECT id FROM Submission WHERE id = ? AND status = ?'
    ).bind(submissionId, 'approved').first();

    if (!submission) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 400 }
      );
    }

    const voteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const ipHash = await hashIP(ipAddress);

    await env.DB.prepare(
      `INSERT INTO Vote 
       (id, userId, submissionId, periodKey, createdAt, ipHash) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(voteId, session.userId, submissionId, periodKey, now, ipHash).run();

    const voteCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM Vote WHERE submissionId = ? AND periodKey = ?'
    ).bind(submissionId, periodKey).first();

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

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DB = (process.env as any).DB as D1Database | undefined;
    
    if (!DB) {
      return NextResponse.json({ error: 'No DB' }, { status: 500 });
    }

    const url = new URL(request.url);
    const periodKey = url.searchParams.get('period');
    
    console.log('Test votes - periodKey:', periodKey);

    if (!periodKey) {
      return NextResponse.json({ error: 'No period' }, { status: 400 });
    }

    // First, let's test a simple query
    const submissionCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM Submission WHERE status = ?'
    ).bind('approved').first();

    console.log('Test votes - submission count:', submissionCount);

    // Test the time range logic
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    console.log('Test votes - time range:', {
      now: now.toISOString(),
      hourStart: hourStart.toISOString(),
      hourEnd: hourEnd.toISOString()
    });

    // Simple submissions query without joins
    const submissions = await DB.prepare(
      'SELECT id, name, description, status, createdAt FROM Submission WHERE status = ? AND createdAt >= ? AND createdAt < ?'
    ).bind('approved', hourStart.toISOString(), hourEnd.toISOString()).all();

    console.log('Test votes - submissions result:', {
      success: submissions.success,
      count: submissions.results?.length || 0
    });

    return NextResponse.json({
      success: true,
      periodKey,
      submissionCount: submissionCount?.count || 0,
      timeRange: {
        hourStart: hourStart.toISOString(),
        hourEnd: hourEnd.toISOString()
      },
      submissionsInPeriod: submissions.results?.length || 0,
      submissions: submissions.results || []
    });

  } catch (error) {
    console.error('Test votes error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
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
  // For development, return mock data
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      winners: []
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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const winners = await DB.prepare(
      `SELECT 
        w.id, w.submissionId, w.periodKey, w.createdAt, 
        w.votesAtWin, w.spawnX, w.spawnY, w.behavior,
        s.name, s.description, s.imageUrl, s.vectorJson,
        u.alias as userAlias
       FROM Winner w
       JOIN Submission s ON w.submissionId = s.id
       LEFT JOIN User u ON s.userId = u.id
       ORDER BY w.createdAt DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return NextResponse.json({
      winners: winners.results || [],
      total: winners.results?.length || 0
    });
  } catch (error) {
    console.error('Get winners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}
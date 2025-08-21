import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const winners = await env.DB.prepare(
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
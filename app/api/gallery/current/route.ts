import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: () => Promise<D1ResultSet>;
}

interface D1ResultSet {
  results: Record<string, unknown>[];
  success: boolean;
  meta: Record<string, unknown>;
}

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DB = (process.env as any).DB as D1Database | undefined;
  
  if (!DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    // Get all gallery positions with their current artworks
    const galleryState = await DB.prepare(`
      SELECT 
        gp.position,
        gp.submissionId,
        gp.periodKey,
        gp.deployedAt,
        s.name,
        s.description,
        s.imageUrl,
        u.alias as userAlias
      FROM GalleryPosition gp
      LEFT JOIN Submission s ON gp.submissionId = s.id
      LEFT JOIN User u ON s.userId = u.id
      ORDER BY 
        CASE gp.position
          WHEN 'LeftArtWork' THEN 1
          WHEN 'LeftArtWork001' THEN 2
          WHEN 'LeftArtWork002' THEN 3
          WHEN 'RightArtWork003' THEN 4
          WHEN 'RightArtWork004' THEN 5
          WHEN 'RightArtWork005' THEN 6
        END
    `).all();

    const positions = galleryState.results.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      position: row.position,
      submissionId: row.submissionId,
      periodKey: row.periodKey,
      deployedAt: row.deployedAt,
      artwork: row.submissionId ? {
        id: row.submissionId,
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        userAlias: row.userAlias || 'Guest'
      } : null
    }));

    return NextResponse.json({
      success: true,
      gallery: positions,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gallery state error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery state' },
      { status: 500 }
    );
  }
}
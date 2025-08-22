import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
}

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

export async function GET(request: Request) {
  // For development, return mock period
  if (process.env.NODE_ENV === 'development') {
    const now = new Date();
    const startOfHour = new Date(now);
    startOfHour.setMinutes(0, 0, 0);
    const endOfHour = new Date(startOfHour.getTime() + 60 * 60 * 1000);
    const timeRemaining = Math.max(0, endOfHour.getTime() - now.getTime());
    
    return NextResponse.json({
      period: {
        key: `mock-${startOfHour.getHours()}`,
        startsAt: startOfHour.toISOString(),
        endsAt: endOfHour.toISOString(),
        timeRemaining: Math.floor(timeRemaining / 1000),
        isResolved: false,
        winnerId: null
      }
    });
  }

  const env = (request as Request & { env?: Env }).env;
  
  if (!env?.DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const startOfHour = new Date(now);
    startOfHour.setUTCMinutes(0, 0, 0);
    const endOfHour = new Date(startOfHour);
    endOfHour.setUTCHours(currentHour + 1);
    
    const periodKey = `${startOfHour.toISOString().slice(0, 13)}`;
    
    let period = await env.DB.prepare(
      'SELECT * FROM Period WHERE key = ?'
    ).bind(periodKey).first();
    
    if (!period) {
      await env.DB.prepare(
        'INSERT INTO Period (key, startsAt, endsAt) VALUES (?, ?, ?)'
      ).bind(periodKey, startOfHour.toISOString(), endOfHour.toISOString()).run();
      
      period = {
        key: periodKey,
        startsAt: startOfHour.toISOString(),
        endsAt: endOfHour.toISOString(),
        resolvedAt: null,
        winnerSubmissionId: null
      };
    }

    const timeRemaining = Math.max(0, endOfHour.getTime() - now.getTime());
    
    return NextResponse.json({
      period: {
        key: period.key,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
        timeRemaining: Math.floor(timeRemaining / 1000),
        isResolved: !!period.resolvedAt,
        winnerId: period.winnerSubmissionId
      }
    });
  } catch (error) {
    console.error('Get current period error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current period' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  
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
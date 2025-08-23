import { NextResponse } from 'next/server';
import { resolvePeriodDirectly } from '@/lib/gallery-resolver';

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

async function resolvePeriodIfNeeded(DB: D1Database, periodKey: string): Promise<void> {
  try {
    console.log('🔍 Checking if period needs resolution:', periodKey);
    
    // Call the resolution function directly
    const result = await resolvePeriodDirectly(DB, periodKey);
    
    if (result.success) {
      console.log('✅ Period resolved automatically:', periodKey, result.result);
    } else {
      console.log('⚠️ Period resolution failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Auto-resolution error:', error);
  }
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
    const now = new Date();
    const currentHour = now.getUTCHours();
    const startOfHour = new Date(now);
    startOfHour.setUTCMinutes(0, 0, 0);
    const endOfHour = new Date(startOfHour);
    endOfHour.setUTCHours(currentHour + 1);
    
    const periodKey = `${startOfHour.toISOString().slice(0, 13)}`;
    
    let period = await DB.prepare(
      'SELECT * FROM Period WHERE key = ?'
    ).bind(periodKey).first();
    
    // ALWAYS check for unresolved previous periods first
    const unresolved = await DB.prepare(
      'SELECT key, endsAt FROM Period WHERE resolvedAt IS NULL AND endsAt < ? ORDER BY endsAt DESC LIMIT 10'
    ).bind(now.toISOString()).all();

    // Resolve ALL previous periods that have ended
    for (const unresolvedPeriod of unresolved.results) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const period = unresolvedPeriod as any;
      console.log('🕐 Auto-resolving expired period:', period.key);
      await resolvePeriodIfNeeded(DB, period.key);
    }
    
    if (!period) {
      await DB.prepare(
        'INSERT INTO Period (key, startsAt, endsAt) VALUES (?, ?, ?)'
      ).bind(periodKey, startOfHour.toISOString(), endOfHour.toISOString()).run();
      
      period = {
        key: periodKey,
        startsAt: startOfHour.toISOString(),
        endsAt: endOfHour.toISOString(),
        resolvedAt: null,
        winnerSubmissionId: null
      };
    } else {
      // Check if current period has ended and needs resolution
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodData = period as any;
      if (!periodData.resolvedAt && new Date(periodData.endsAt) <= now) {
        console.log('⏰ Current period has ended, resolving:', periodKey);
        await resolvePeriodIfNeeded(DB, periodKey);
        // Refresh period data after resolution
        const refreshed = await DB.prepare('SELECT * FROM Period WHERE key = ?').bind(periodKey).first();
        if (refreshed) period = refreshed;
      }
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
import { NextRequest, NextResponse } from 'next/server';
import { resolvePeriodDirectly } from '../../../lib/gallery-resolver';

export const runtime = 'edge';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  first: () => Promise<Record<string, unknown> | null>;
}

interface D1Result {
  success: boolean;
  meta: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DB = (process.env as any).DB as D1Database | undefined;
  
  if (!DB) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
  try {
    const { periodKey } = await request.json();
    
    if (!periodKey) {
      return NextResponse.json(
        { error: 'Period key is required' },
        { status: 400 }
      );
    }

    console.log('🏆 Resolving period via API:', periodKey);
    
    const result = await resolvePeriodDirectly(DB, periodKey);
    
    if (result.success) {
      return NextResponse.json(result.result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Period resolution API error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve period' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { periodKey } = await request.json();
    
    if (!periodKey) {
      return NextResponse.json(
        { error: 'Period key is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Manual test resolution for period:', periodKey);

    // Call the resolve endpoint
    const resolveUrl = new URL('/api/periods/resolve', request.url);
    
    const response = await fetch(resolveUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodKey })
    });
    
    const result = await response.json();
    
    console.log('🧪 Test resolution result:', result);
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Period resolved successfully',
        result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Resolution failed',
        details: result
      }, { status: response.status });
    }

  } catch (error) {
    console.error('Test resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to test resolution', details: String(error) },
      { status: 500 }
    );
  }
}
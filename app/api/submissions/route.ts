import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
  KV_SESSIONS: KVNamespace;
  SESSION_COOKIE_NAME?: string;
  R2_BUCKET?: R2Bucket;
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

interface KVNamespace {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string) => Promise<string | null>;
}

interface R2Bucket {
  put: (key: string, value: ArrayBuffer | ArrayBufferView | string | ReadableStream, options?: Record<string, unknown>) => Promise<void>;
}

export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'approved';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const submissions = await env.DB.prepare(
      `SELECT 
        s.id, s.name, s.description, s.imageUrl, s.vectorJson, 
        s.createdAt, s.status, u.alias as userAlias
       FROM Submission s
       LEFT JOIN User u ON s.userId = u.id
       WHERE s.status = ?
       ORDER BY s.createdAt DESC
       LIMIT ? OFFSET ?`
    ).bind(status, limit, offset).all();

    return NextResponse.json({
      submissions: submissions.results || [],
      total: submissions.results?.length || 0
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // For development, return success without database interaction
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      success: true,
      submissionId: crypto.randomUUID(),
      status: 'approved',
      message: 'Character submitted successfully!'
    });
  }

  const env = (request as NextRequest & { env?: Env }).env;
  
  if (!env?.DB || !env?.KV_SESSIONS) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }
  
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
    const { name, description, imageData, vectorJson } = await request.json();
    
    if (!name || !description || !imageData) {
      return NextResponse.json(
        { error: 'Name, description, and image are required' },
        { status: 400 }
      );
    }

    if (name.length > 100 || description.length > 500) {
      return NextResponse.json(
        { error: 'Name must be under 100 chars, description under 500' },
        { status: 400 }
      );
    }

    // Check if user has already made 3 submissions this hour
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const existingSubmissions = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM Submission WHERE userId = ? AND createdAt >= ? AND createdAt < ?'
    ).bind(session.userId, hourStart.toISOString(), hourEnd.toISOString()).first();

    if (existingSubmissions && Number(existingSubmissions.count) >= 3) {
      return NextResponse.json(
        { error: 'You have reached the maximum of 3 submissions per hour' },
        { status: 400 }
      );
    }

    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const imageUrl = await uploadToStorage(imageData, submissionId, env);

    await env.DB.prepare(
      `INSERT INTO Submission 
       (id, userId, name, description, imageUrl, vectorJson, createdAt, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      submissionId,
      session.userId,
      name,
      description,
      imageUrl,
      vectorJson ? JSON.stringify(vectorJson) : null,
      now,
      'approved'
    ).run();

    return NextResponse.json({
      success: true,
      submissionId,
      status: 'approved',
      message: 'Character submitted successfully! It will appear in the next voting period.'
    });
  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

async function uploadToStorage(imageData: string, submissionId: string, env: Env): Promise<string> {
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const key = `submissions/${submissionId}.png`;
  
  if (env.R2_BUCKET) {
    await env.R2_BUCKET.put(key, binaryData, {
      httpMetadata: {
        contentType: 'image/png'
      }
    });
    return `https://storage.livingsketchbook.art/${key}`;
  }
  
  return imageData;
}
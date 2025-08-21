import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  
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
  const env = process.env as any;
  
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
      'pending'
    ).run();

    return NextResponse.json({
      success: true,
      submissionId,
      status: 'pending',
      message: 'Submission received and pending approval'
    });
  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

async function uploadToStorage(imageData: string, submissionId: string, env: any): Promise<string> {
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
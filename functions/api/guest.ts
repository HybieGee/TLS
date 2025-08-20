// POST /api/guest - Create guest user and session
import { Env, createUser, createSession, hashIP } from '../../lib/db';
import { setSecureCookie } from '../../lib/cookies';

interface RequestHandler {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: RequestHandler): Promise<Response> {
  try {
    // Get IP for session tracking
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    const ipHash = await hashIP(clientIP);
    
    // Create user and session
    const user = await createUser(env.DB, 'guest');
    const session = await createSession(env.DB, user.id, ipHash);
    
    // Set secure session cookie
    const cookie = setSecureCookie(env.SESSION_COOKIE_NAME, session.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: user.id,
        kind: user.kind,
        alias: user.alias
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
    
  } catch (error) {
    console.error('Guest creation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to create guest session' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
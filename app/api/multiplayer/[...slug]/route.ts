/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Mock type for development
interface DurableObjectNamespace {
  idFromName: (name: string) => any;
  get: (id: any) => any;
}

interface Env {
  GALLERY_ROOMS: DurableObjectNamespace;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const env = process.env as any as Env;
  
  if (!env.GALLERY_ROOMS) {
    return new Response("Multiplayer not available", { status: 503 });
  }

  // Get room ID from URL
  const resolvedParams = await params;
  const roomId = resolvedParams.slug?.[0] || "main";
  const playerId = new URL(request.url).searchParams.get("playerId") || crypto.randomUUID();
  
  // Get Durable Object instance
  const id = env.GALLERY_ROOMS.idFromName(roomId);
  const room = env.GALLERY_ROOMS.get(id);
  
  // Forward request to Durable Object
  const newUrl = new URL(request.url);
  newUrl.searchParams.set("playerId", playerId);
  
  const newRequest = new Request(newUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  return await room.fetch(newRequest);
}
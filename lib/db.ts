// Database utilities for D1
import type { 
  D1Database, 
  R2Bucket, 
  KVNamespace, 
  DurableObjectNamespace 
} from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV_SESSIONS: KVNamespace;
  WorldHub: DurableObjectNamespace;
  SESSION_COOKIE_NAME: string;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getCurrentPeriodKey(): string {
  const now = new Date();
  const utc = new Date(now.getTime());
  return utc.toISOString().slice(0, 13).replace(/[-T:]/g, ''); // YYYYMMDDHH
}

export function getPeriodBounds(periodKey: string) {
  // periodKey format: YYYYMMDDHH
  const year = parseInt(periodKey.slice(0, 4));
  const month = parseInt(periodKey.slice(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(periodKey.slice(6, 8));
  const hour = parseInt(periodKey.slice(8, 10));
  
  const startsAt = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
  const endsAt = new Date(Date.UTC(year, month, day, hour + 1, 0, 0, 0));
  
  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString()
  };
}

export async function createUser(db: D1Database, kind: 'guest' | 'passkey' = 'guest', alias?: string) {
  const id = generateId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO User (id, kind, alias, createdAt)
    VALUES (?, ?, ?, ?)
  `).bind(id, kind, alias || null, now).run();
  
  return { id, kind, alias, createdAt: now, banned: 0 };
}

export async function createSession(db: D1Database, userId: string, ipHash: string) {
  const id = generateSessionId();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO Session (id, userId, createdAt, lastSeenAt, ipHash)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, userId, now, now, ipHash).run();
  
  return { id, userId, createdAt: now, lastSeenAt: now, ipHash };
}

export async function getSession(db: D1Database, sessionId: string) {
  const result = await db.prepare(`
    SELECT s.*, u.id as userId, u.kind, u.alias, u.banned
    FROM Session s
    JOIN User u ON s.userId = u.id
    WHERE s.id = ?
  `).bind(sessionId).first();
  
  return result;
}

export async function updateSessionLastSeen(db: D1Database, sessionId: string) {
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE Session SET lastSeenAt = ? WHERE id = ?
  `).bind(now, sessionId).run();
}

export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'salt_living_sketchbook_2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
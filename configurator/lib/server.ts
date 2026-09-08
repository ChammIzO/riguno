import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { z } from 'zod';
export const selection = z.record(z.enum(['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PCCase', 'PSU', 'CPUCooler', 'CaseFan']), z.string().uuid()).refine(x => Object.keys(x).length > 0, 'Configuration vide');
export const prefs = z.object({ region: z.enum(['fr', 'de', 'uk', 'us']), currency: z.enum(['EUR', 'USD', 'GBP']), language: z.enum(['fr', 'en']), theme: z.enum(['dark', 'light', 'system']) });
export const buildInput = z.object({ name: z.string().trim().min(1).max(80), parts: selection, public: z.boolean().default(false) });
export function db() { const d = (env as unknown as {
    DB?: D1Database;
}).DB; if (!d)
    throw new Error('DATABASE_UNAVAILABLE'); return d; }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' } }); }
export function sameOrigin(req: Request) { return req.headers.get('origin') === new URL(req.url).origin; }
export async function user() { if ((env as unknown as {
    RIGUNO_TRUSTED_SITES_AUTH?: string;
}).RIGUNO_TRUSTED_SITES_AUTH !== "enabled")
    return null; const u = await getChatGPTUser(); if (!u)
    return null; await db().prepare('INSERT OR IGNORE INTO profiles (id, preferences) VALUES (?, ?)').bind(u.userId, JSON.stringify({ region: 'fr', currency: 'EUR', language: 'fr', theme: 'system' })).run(); return u; }
export async function body(req: Request) { if (Number(req.headers.get('content-length') || 0) > 12000)
    throw new Error('TOO_LARGE'); const s = await req.text(); if (s.length > 12000)
    throw new Error('TOO_LARGE'); return JSON.parse(s); }
export async function rate(key: string, max = 30) { const bucket = Math.floor(Date.now() / 60000); const d = db(); const r = await d.prepare('INSERT INTO rate_limits (key,bucket,hits) VALUES (?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key, bucket).first<{
    hits: number;
}>(); return !!r && r.hits <= max; }

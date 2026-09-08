import { env } from 'cloudflare:workers';
import { db, json } from '@/lib/server';
import { offerSchema } from '@/lib/offers';
import { z } from 'zod';
const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
export async function POST(req: Request) { const secret = (env as unknown as {
    PRICE_INGEST_TOKEN?: string;
}).PRICE_INGEST_TOKEN; if (!secret || secret.length < 32)
    return json({ error: 'Collector not configured' }, 503); const token = req.headers.get('authorization')?.replace(/^Bearer /, '') || ''; const a = await digest(token), b = await digest(secret); let diff = 0; for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i]; if (diff)
    return json({ error: 'Unauthorized' }, 401); try {
    const raw = await req.text();
    if (raw.length > 300000)
        return json({ error: 'Payload too large' }, 413);
    const offers = z.array(offerSchema).min(1).max(100).parse(JSON.parse(raw));
    const queries = [];
    const d = db();
    for (const o of offers) {
        const id = Array.from(await digest([o.part_id, o.merchant, o.country, o.currency, o.url].join('|'))).map(x => x.toString(16).padStart(2, '0')).join('');
        queries.push(d.prepare('INSERT INTO offers (id,part_id,merchant,country,currency,amount,shipping,in_stock,url,observed_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET amount=excluded.amount,shipping=excluded.shipping,in_stock=excluded.in_stock,observed_at=excluded.observed_at,expires_at=excluded.expires_at WHERE excluded.observed_at>=offers.observed_at').bind(id, o.part_id, o.merchant, o.country, o.currency, o.amount, o.shipping, o.in_stock ? 1 : 0, o.url, o.observed_at, o.expires_at));
        if (o.history_allowed)
            queries.push(d.prepare('INSERT OR IGNORE INTO price_history (id,part_id,merchant,country,currency,amount,shipping,in_stock,url,observed_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), o.part_id, o.merchant, o.country, o.currency, o.amount, o.shipping, o.in_stock ? 1 : 0, o.url, o.observed_at));
    }
    await d.batch(queries);
    await d.batch([d.prepare('DELETE FROM offers WHERE expires_at<?').bind(new Date().toISOString()), d.prepare('DELETE FROM rate_limits WHERE bucket<?').bind(Math.floor(Date.now() / 60000) - 2)]);
    return json({ accepted: offers.length });
}
catch {
    return json({ error: 'Invalid offers or storage unavailable' }, 400);
} }

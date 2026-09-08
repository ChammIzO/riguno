import { env } from 'cloudflare:workers';
import { db, json, user, body, sameOrigin, buildInput, prefs, rate } from '@/lib/server';
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        if (action === 'public') {
            const id = url.searchParams.get('id') || '';
            if (!/^[a-f0-9-]{36}$/.test(id))
                return json({ error: 'Configuration introuvable' }, 404);
            const b = await db().prepare('SELECT id,name,parts,updated_at FROM builds WHERE id=? AND public=1').bind(id).first();
            return b ? json(b) : json({ error: 'Configuration introuvable' }, 404);
        }
        if (action === 'prices') {
            const id = url.searchParams.get('id') || '', country = url.searchParams.get('country') || 'fr', currency = url.searchParams.get('currency') || 'EUR';
            if (!/^[a-f0-9-]{36}$/.test(id))
                return json({ error: 'Identifiant invalide' }, 400);
            const offers = await db().prepare('SELECT * FROM offers WHERE part_id=? AND country=? AND currency=? AND expires_at>? ORDER BY in_stock DESC, CASE WHEN shipping IS NULL THEN 1 ELSE 0 END, amount+COALESCE(shipping,0)').bind(id, country, currency, new Date().toISOString()).all();
            const history = await db().prepare('SELECT merchant,amount,shipping,observed_at FROM price_history WHERE part_id=? AND country=? AND currency=? ORDER BY observed_at DESC LIMIT 365').bind(id, country, currency).all();
            const benchmarks = await db().prepare('SELECT * FROM benchmarks WHERE part_id=?').bind(id).all();
            return json({ offers: offers.results, history: history.results, benchmarks: benchmarks.results });
        }
        const u = await user();
        if (!u)
            return json({ user: null, builds: [], authAvailable: (env as unknown as {
                    RIGUNO_TRUSTED_SITES_AUTH?: string;
                }).RIGUNO_TRUSTED_SITES_AUTH === 'enabled' });
        const profile = await db().prepare('SELECT preferences FROM profiles WHERE id=?').bind(u.userId).first();
        const builds = await db().prepare('SELECT id,name,parts,public,updated_at FROM builds WHERE owner_id=? ORDER BY updated_at DESC LIMIT 100').bind(u.userId).all();
        return json({ user: { name: u.displayName }, profile: profile ? JSON.parse(String(profile.preferences)) : null, builds: builds.results });
    }
    catch {
        return json({ error: 'Service de sauvegarde indisponible. La configuration locale reste disponible.' }, 503);
    }
}
export async function POST(req: Request) { if (!sameOrigin(req))
    return json({ error: 'Origine refusée' }, 403); try {
    const u = await user();
    if (!u)
        return json({ error: 'Connexion nécessaire' }, 401);
    if (!await rate(u.userId))
        return json({ error: 'Trop de requêtes' }, 429);
    const input = await body(req);
    switch (input.action) {
        case 'save': {
            const b = buildInput.parse(input.build);
            const id = crypto.randomUUID();
            await db().prepare('INSERT INTO builds (id,owner_id,name,parts,public) VALUES (?,?,?,?,?)').bind(id, u.userId, b.name, JSON.stringify(b.parts), b.public ? 1 : 0).run();
            return json({ id, public: b.public });
        }
        case 'preferences':
            await db().prepare('UPDATE profiles SET preferences=? WHERE id=?').bind(JSON.stringify(prefs.parse(input.preferences)), u.userId).run();
            return json({ ok: true });
        case 'delete':
            await db().prepare('DELETE FROM builds WHERE id=? AND owner_id=?').bind(String(input.id), u.userId).run();
            return json({ ok: true });
        case 'privacy':
            await db().prepare('UPDATE builds SET public=? WHERE id=? AND owner_id=?').bind(input.public === true ? 1 : 0, String(input.id), u.userId).run();
            return json({ ok: true });
        case 'export': return json({ profile: await db().prepare('SELECT preferences FROM profiles WHERE id=?').bind(u.userId).first(), builds: (await db().prepare('SELECT * FROM builds WHERE owner_id=?').bind(u.userId).all()).results });
        case 'deleteAccount':
            await db().batch([db().prepare('DELETE FROM builds WHERE owner_id=?').bind(u.userId), db().prepare('DELETE FROM profiles WHERE id=?').bind(u.userId)]);
            return json({ ok: true });
        default: return json({ error: 'Action invalide' }, 400);
    }
}
catch {
    return json({ error: 'Action impossible : vérifier les données et la connexion.' }, 400);
} }

import { z } from 'zod';
export const merchantHosts: Record<string, string[]> = { amazon: ['amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.com'], grosbill: ['grosbill.com'], ldlc: ['ldlc.com'], topachat: ['topachat.com'], materielnet: ['materiel.net'] };
export const offerSchema = z.object({ part_id: z.string().uuid(), merchant: z.enum(['amazon', 'grosbill', 'ldlc', 'topachat', 'materielnet']), country: z.enum(['fr', 'de', 'uk', 'us']), currency: z.enum(['EUR', 'GBP', 'USD']), amount: z.number().finite().positive().max(100000), shipping: z.number().finite().min(0).max(10000).nullable(), in_stock: z.boolean(), url: z.string().url().max(2000), observed_at: z.string().datetime(), expires_at: z.string().datetime(), history_allowed: z.boolean().default(false) }).superRefine((o, ctx) => { const u = new URL(o.url), host = u.hostname.replace(/^www\./, ''); if (u.protocol !== 'https:' || u.username || u.password || !merchantHosts[o.merchant]?.includes(host))
    ctx.addIssue({ code: 'custom', message: 'Invalid merchant URL' }); const now = Date.now(), at = Date.parse(o.observed_at), exp = Date.parse(o.expires_at); if (at > now + 300000 || at < now - 86400000 || exp <= now || exp <= at || exp - at > 86400000)
    ctx.addIssue({ code: 'custom', message: 'Invalid freshness window' }); if (o.merchant === 'amazon') {
    const domains: Record<string, string> = { fr: 'amazon.fr', de: 'amazon.de', uk: 'amazon.co.uk', us: 'amazon.com' };
    if (host !== domains[o.country])
        ctx.addIssue({ code: 'custom', message: 'Marketplace mismatch' });
} });

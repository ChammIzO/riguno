'use client';
import { useState, useEffect, useMemo } from 'react';
import { Cpu, MemoryStick, Microchip, Monitor, Box, Wind, HardDrive, Zap, Plus, Check, ArrowUpRight, Sun, Moon, Share2, Save, Trash2, Search, SlidersHorizontal, ChevronRight, Download, ShieldCheck, TriangleAlert, Layers, User, Globe, Info } from 'lucide-react';
import { categories, checks, power, summary, retailerLinks, type Category, type Part, type Build } from '@/lib/catalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Toaster, toast } from 'sonner';
import Scene from './scene';
const icons = { CPU: Cpu, GPU: Monitor, Motherboard: Microchip, RAM: MemoryStick, Storage: HardDrive, PCCase: Box, PSU: Zap, CPUCooler: Wind, CaseFan: Wind };
const keys = Object.keys(categories) as Category[];
const cache: Partial<Record<Category, Part[]>> = {};
async function catalog(c: Category) { if (!cache[c]) {
    const r = await fetch('/data/' + c + '.json');
    if (!r.ok)
        throw Error('Catalogue indisponible');
    cache[c] = await r.json();
} return cache[c]!; }
function Chooser({ value, onChange, items, label }: {
    value: string;
    onChange: (v: string) => void;
    items: [
        string,
        string
    ][];
    label: string;
}) { return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{items.map(([id, text]) => <SelectItem key={id} value={id}>{text}</SelectItem>)}</SelectContent></Select>; }
async function api(action: string, data: Record<string, unknown> = {}) { const r = await fetch('/api/riguno', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) }); const d: any = await r.json(); if (!r.ok)
    throw Error(d.error); return d; }
function download(value: unknown, name: string) { const u = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }
export default function Configurator() {
    const [authAvailable, setAuthAvailable] = useState(false), [removeAccount, setRemoveAccount] = useState(false), [quote, setQuote] = useState({ total: 0, covered: 0 });
    const [build, setBuild] = useState<Build>({}), [ready, setReady] = useState(false), [meta, setMeta] = useState<any>(null), [name, setName] = useState('Ma nouvelle configuration');
    const [picker, setPicker] = useState<Category | null>(null), [parts, setParts] = useState<Part[]>([]), [search, setSearch] = useState(''), [brand, setBrand] = useState('all'), [onlyCompatible, setOnlyCompatible] = useState(false), [loading, setLoading] = useState(false), [limit, setLimit] = useState(36);
    const [detail, setDetail] = useState<Part | null>(null), [prices, setPrices] = useState<any>(null), [priceError, setPriceError] = useState('');
    const [airflow, setAirflow] = useState(false), [exploded, setExploded] = useState(false), [view, setView] = useState('build');
    const [prefs, setPrefs] = useState({ region: 'fr', currency: 'EUR', language: 'fr', theme: 'dark' }), [settings, setSettings] = useState(false), [account, setAccount] = useState(false), [saved, setSaved] = useState<any[]>([]), [user, setUser] = useState<any>(null), [legal, setLegal] = useState(false);
    const report = useMemo(() => checks(build), [build]);
    const errors = report.filter(x => x.level === 'error');
    const warnings = report.filter(x => x.level === 'warning');
    const watts = power(build);
    const chosen = Object.keys(build).length;
    const run = async (fn: () => Promise<unknown>) => { try {
        await fn();
    }
    catch (e) {
        toast.error(e instanceof Error ? e.message : 'Action impossible');
    } };
    const refresh = async () => { const r = await fetch('/api/riguno'); if (r.ok) {
        const d: any = await r.json();
        setAuthAvailable(d.authAvailable ?? !!d.user);
        setUser(d.user);
        setSaved(d.builds || []);
        if (d.profile)
            setPrefs(d.profile);
    } };
    const resolve = async (ids: Record<string, string>) => { const result: Build = {}; await Promise.all(keys.filter(c => ids[c]).map(async (c) => { const p = (await catalog(c)).find(x => x.id === ids[c]); if (p)
        result[c] = p; })); return result; };
    useEffect(() => { void run(async () => { const r = await fetch('/data/index.json'); setMeta(await r.json()); let ids = {}; try {
        const v = JSON.parse(localStorage.getItem('riguno-build') || 'null');
        if (v) {
            ids = v.parts || {};
            setName(v.name || 'Ma configuration');
        }
        const p = JSON.parse(localStorage.getItem('riguno-prefs') || 'null');
        if (p)
            setPrefs(p);
    }
    catch {
        toast.error('La sauvegarde locale est illisible.');
    } const id = new URL(location.href).searchParams.get('build'); if (id) {
        const r = await fetch('/api/riguno?action=public&id=' + encodeURIComponent(id));
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        ids = JSON.parse(d.parts);
        setName(d.name);
    } setBuild(await resolve(ids)); setReady(true); }); void refresh(); }, []);
    useEffect(() => { if (ready)
        localStorage.setItem('riguno-build', JSON.stringify({ name, parts: Object.fromEntries(Object.entries(build).map(([k, p]) => [k, p.id])) })); }, [build, name, ready]);
    useEffect(() => { localStorage.setItem('riguno-prefs', JSON.stringify(prefs)); const q = matchMedia('(prefers-color-scheme: dark)'); const apply = () => { document.documentElement.classList.toggle('dark', prefs.theme === 'dark' || prefs.theme === 'system' && q.matches); }; apply(); q.addEventListener('change', apply); return () => q.removeEventListener('change', apply); }, [prefs]);
    useEffect(() => { if (!picker)
        return; let active = true; setLoading(true); setSearch(''); setBrand('all'); setLimit(36); catalog(picker).then(p => { if (active)
        setParts(p); }).catch(() => toast.error('Chargement du catalogue impossible.')).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [picker]);
    useEffect(() => { if (!detail)
        return; let active = true; setPrices(null); setPriceError(''); const poll = () => fetch(`/api/riguno?action=prices&id=${detail.id}&country=${prefs.region}&currency=${prefs.currency}`).then(async (r) => { const d: any = await r.json(); if (!r.ok)
        throw Error(d.error); if (active)
        setPrices(d); }).catch(() => { if (active)
        setPriceError('La collecte marchande doit être connectée pour afficher les offres.'); }); void poll(); const timer = setInterval(poll, 60000); return () => { active = false; clearInterval(timer); }; }, [detail, prefs.region, prefs.currency]);
    useEffect(() => { let active = true; const items = Object.values(build); if (!items.length) {
        setQuote({ total: 0, covered: 0 });
        return;
    } const update = async () => { const values = await Promise.all(items.map(async (p) => { try {
        const r = await fetch(`/api/riguno?action=prices&id=${p.id}&country=${prefs.region}&currency=${prefs.currency}`);
        if (!r.ok)
            return null;
        const data: any = await r.json();
        const offers = data.offers.filter((o: any) => o.in_stock && o.shipping !== null);
        return offers.length ? Math.min(...offers.map((o: any) => o.amount + o.shipping)) : null;
    }
    catch {
        return null;
    } })); if (active)
        setQuote({ total: values.reduce<number>((s, v) => s + (v ?? 0), 0), covered: values.filter(v => v !== null).length }); }; void update(); const timer = setInterval(update, 60000); return () => { active = false; clearInterval(timer); }; }, [build, prefs.region, prefs.currency]);
    const filtered = useMemo(() => parts.filter(p => (brand === 'all' || p.brand === brand) && p.name.toLowerCase().includes(search.toLowerCase()) && (!onlyCompatible || !checks({ ...build, [p.category]: p }).some(x => x.level === 'error'))), [parts, brand, search, onlyCompatible, build]);
    const ids = () => Object.fromEntries(Object.entries(build).map(([k, p]) => [k, p.id]));
    const save = async (shared = false) => { if (!chosen) {
        toast.error('Ajoute un composant pour enregistrer.');
        return;
    } if (!user) {
        setAccount(true);
        return;
    } const r = await api('save', { build: { name, parts: ids(), public: shared } }); await refresh(); if (shared) {
        const link = location.origin + '/?build=' + r.id;
        try {
            await navigator.clipboard.writeText(link);
            toast.success('Lien public copié. Tu peux retirer le partage dans ton compte.');
        }
        catch {
            toast.message(link, { duration: 20000 });
        }
    }
    else
        toast.success('Configuration enregistrée dans ton compte.'); };
    const money = (n: number) => new Intl.NumberFormat(prefs.language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: prefs.currency }).format(n);
    return <><Toaster richColors/><header className="topbar"><a href="/" className="brand"><img src="/favicon.svg" width="36" height="36" alt=""/>riguno<span className="brand-dot">.</span></a><nav><button className={view === 'build' ? 'active' : ''} onClick={() => setView('build')}>Configurateur</button><button onClick={() => setAccount(true)}>Mes configurations</button><a href="https://github.com/ChammIzO/riguno" target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14}/></a></nav><div className="top-actions"><button className="icon-button" aria-label="Pays et préférences" onClick={() => setSettings(true)}><Globe size={19}/><span>{prefs.region.toUpperCase()} · {prefs.currency}</span></button><button className="icon-button" aria-label="Changer de thème" onClick={() => setPrefs({ ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' })}>{prefs.theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="account-button" onClick={() => setAccount(true)}><User size={17}/>{user ? 'Mon compte' : 'Connexion'}</button></div></header>
 <main><div className="heading"><div><div className="eyebrow">L’ATELIER PC <span>/</span> CONFIGURATEUR</div><h1>Chaque pièce. <em>Votre PC.</em></h1><p>Composez votre configuration et vérifiez ce qui fonctionne ensemble.</p></div><button className="secondary" onClick={() => run(async () => { setBuild(await (await fetch('/data/defaults.json')).json()); setName('Atelier AM5'); toast.success('Exemple chargé · consulter les points à vérifier.'); })}><Layers size={17}/>Charger un exemple</button></div>
 <div className="workspace"><section className="assembly"><div className="section-head"><div><span className="eyebrow">01 — VOTRE CONFIGURATION</span><input aria-label="Nom de la configuration" className="build-name" value={name} onChange={e => setName(e.target.value)} maxLength={80}/></div><span className="count">{chosen} / 9</span></div>
 <div className="component-list">{keys.map((c, i) => { const Icon = icons[c], p = build[c]; return <div className={'component-row ' + (p ? 'selected' : '')} key={c}><div className="part-icon"><Icon size={22}/></div><button className="part-main" onClick={() => setPicker(c)}><span className="part-category">{String(i + 1).padStart(2, '0')} · {categories[c]}</span><strong>{p ? p.name : 'Choisir ' + categories[c].toLowerCase()}</strong>{p && <small>{summary(p)}</small>}</button>{p ? <div className="row-actions"><button aria-label={'Détails ' + p.name} onClick={() => setDetail(p)}><Info size={17}/></button><button aria-label={'Retirer ' + categories[c]} onClick={() => setBuild(b => { const n = { ...b }; delete n[c]; return n; })}><Trash2 size={16}/></button></div> : <button className="add" aria-label={'Ajouter ' + categories[c]} onClick={() => setPicker(c)}><Plus size={19}/></button>}</div>; })}</div>
 <div className="assembly-footer"><span><ShieldCheck size={16}/>Sauvegarde locale automatique</span><button onClick={() => download({ schemaVersion: 1, name, parts: ids() }, 'riguno-config.json')}><Download size={16}/>Exporter</button></div></section>
 <section className="visual-panel"><Tabs defaultValue="3d"><div className="visual-head"><TabsList><TabsTrigger value="3d">Vue 3D</TabsTrigger><TabsTrigger value="analysis">Compatibilité <span className="tab-count">{errors.length + warnings.length}</span></TabsTrigger><TabsTrigger value="performance">Performances</TabsTrigger></TabsList></div>
 <TabsContent value="3d"><div className="scene-caption"><span className="eyebrow">ATELIER VIRTUEL</span><span>Volumes indicatifs · mm</span></div><Scene build={build} airflow={airflow} exploded={exploded}/>{!chosen && <p className="empty-scene">Ajoute tes composants ou charge un exemple pour commencer.</p>}<div className="visual-options"><label><Switch checked={airflow} onCheckedChange={setAirflow}/><Wind size={16}/>Flux d’air</label><label><Switch checked={exploded} onCheckedChange={setExploded}/><Layers size={16}/>Vue éclatée</label></div><p className="fine-print">{airflow ? 'Trajectoires illustratives avant → arrière. Ce schéma ne calcule ni température ni pression.' : 'Glisse pour tourner. Enveloppes génériques : les détails et points de fixation ne sont pas modélisés.'}</p></TabsContent>
 <TabsContent value="analysis"><div className="analysis-list">{report.map((r, i) => <div className={'check-item ' + r.level} key={i}>{r.level === 'ok' ? <Check size={18}/> : r.level === 'error' ? <TriangleAlert size={18}/> : <Info size={18}/>}<div><strong>{r.title}</strong><p>{r.detail}</p></div></div>)}</div></TabsContent>
 <TabsContent value="performance"><div className="performance"><h2>Les caractéristiques utiles</h2><p>Pas de pourcentage de bottleneck universel : le résultat dépend du jeu, de la résolution et des réglages.</p><div className="stat-grid"><div><span>Cœurs CPU</span><strong>{build.CPU?.spec.cores?.total ?? '—'}</strong></div><div><span>Mémoire vidéo</span><strong>{build.GPU?.spec.memory ?? '—'} <small>Go</small></strong></div><div><span>RAM installée</span><strong>{build.RAM?.spec.capacity ?? '—'} <small>Go</small></strong></div><div><span>Latence CAS théorique</span><strong>{build.RAM?.spec.cas_latency && build.RAM.spec.speed ? (2000 * build.RAM.spec.cas_latency / build.RAM.spec.speed).toFixed(1) : '—'} <small>ns</small></strong></div></div><p>Latence CAS = 2 000 × CL / débit MT/s. Elle ne représente pas la latence totale du système.</p><div className="notice"><Info size={20}/><p>Les benchmarks mesurés apparaissent dans la fiche de chaque composant quand une source datée a été importée. Aucun FPS n’est inventé.</p></div></div></TabsContent></Tabs>
 <div className="health"><ShieldCheck size={23}/><div><strong>{!chosen ? 'Votre configuration commence ici' : errors.length ? `${errors.length} incompatibilité(s) détectée(s)` : 'Aucune incompatibilité détectée'}</strong><p>{chosen ? `${warnings.length} remarque(s) · ${report.filter(x => x.level === 'unknown').length} contrôle(s) non vérifié(s)` : 'Choisissez chaque pièce dans le catalogue.'}</p></div></div>
 <div className="metrics"><div><span>Puissance estimée</span><strong>{watts ?? '—'} <small>W</small></strong></div><div><span>{quote.covered === chosen && chosen ? "Total des offres connues" : "Sous-total connu"}</span><strong>{quote.covered ? money(quote.total) : "—"}</strong><small>{quote.covered} / {chosen} pièces · ports par article</small></div></div>
 <div className="save-actions"><button className="primary" onClick={() => run(() => save())}><Save size={17}/>Enregistrer</button><button className="secondary" onClick={() => run(() => save(true))}><Share2 size={17}/>Partager</button></div></section></div>
 <footer><span>Riguno · Libre de configurer.</span><div><span>{meta ? new Intl.NumberFormat('fr-FR').format(meta.configurable) : '…'} références configurables</span><a href="https://github.com/buildcores/buildcores-open-db" target="_blank" rel="noreferrer">Données BuildCores · ODC-By</a><button onClick={() => setLegal(true)}>Conditions & confidentialité</button></div></footer></main>
 <Dialog open={!!picker} onOpenChange={o => !o && setPicker(null)}><DialogContent className="catalog-dialog"><DialogHeader><DialogTitle>{picker && categories[picker]}</DialogTitle><DialogDescription>Rechercher, comparer les caractéristiques et ajouter à votre configuration.</DialogDescription></DialogHeader><div className="catalog-controls"><div className="search-field"><Search size={18}/><input aria-label="Rechercher un composant" placeholder="Nom, modèle…" value={search} onChange={e => { setSearch(e.target.value); setLimit(36); }}/></div><Chooser label="Marque" value={brand} onChange={setBrand} items={[["all", "Toutes les marques"], ...Array.from(new Set(parts.map(p => p.brand))).filter(Boolean).sort().map(x => [x, x] as [
            string,
            string
        ])]}/></div><label className="filter-switch"><Switch checked={onlyCompatible} onCheckedChange={setOnlyCompatible}/>Masquer les incompatibilités détectées <small>Les cas inconnus restent visibles</small></label><div className="catalog-results">{loading ? <p>Chargement du catalogue local…</p> : <><span className="eyebrow">{filtered.length} COMPOSANTS</span><div className="product-grid">{filtered.slice(0, limit).map(p => { const Icon = icons[p.category]; return <article key={p.id} className="product-card"><div className="product-thumb">{p.image ? <img src={p.image} alt={p.name}/> : <Icon size={42} strokeWidth={1}/>}<span>{p.brand}</span></div>{p.imageCredit && <a className="photo-credit" href={p.imageCredit.url} target="_blank" rel="noreferrer">{p.imageCredit.author} · {p.imageCredit.license}</a>}<h3>{p.name}</h3><p>{summary(p)}</p><div><button className="secondary" onClick={() => setDetail(p)}>Détails</button><button className="primary" onClick={() => { setBuild({ ...build, [p.category]: p }); setPicker(null); toast.success('Composant ajouté'); }}><Plus size={16}/>Ajouter</button></div></article>; })}</div>{!filtered.length && <p>Aucun résultat. Essaie un autre nom ou retire les filtres.</p>}{filtered.length > limit && <button className="secondary load-more" onClick={() => setLimit(x => x + 36)}>Afficher la suite</button>}</>}</div></DialogContent></Dialog>
 <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}><DialogContent className="detail-dialog"><DialogHeader><DialogTitle>{detail?.name}</DialogTitle><DialogDescription>{detail && summary(detail)}</DialogDescription></DialogHeader>{detail && <Tabs defaultValue="offers"><TabsList><TabsTrigger value="offers">Marchands</TabsTrigger><TabsTrigger value="specs">Caractéristiques</TabsTrigger><TabsTrigger value="bench">Benchmarks</TabsTrigger></TabsList><TabsContent value="offers"><p className="fine-print">{prefs.region.toUpperCase()} · {prefs.currency} · tri par prix livré, frais connus en premier. Vérifier le total chez le marchand.</p>{prices?.offers?.length ? prices.offers.map((o: any) => <a className="offer" key={o.id} href={o.url} target="_blank" rel="noreferrer"><div><strong>{o.merchant}</strong><small>{o.in_stock ? 'En stock' : 'Indisponible'} · {new Date(o.observed_at).toLocaleString()}</small></div><strong>{money(o.amount + (o.shipping ?? 0))}<small>{o.shipping === null ? 'Frais de port inconnus' : 'Livraison incluse'}</small></strong><ArrowUpRight size={18}/></a>) : <div className="notice"><Info size={19}/><p>{priceError || 'Aucune offre fraîche collectée pour ce pays et cette devise. Les prix apparaîtront dès la connexion des flux marchands.'}</p></div>}{retailerLinks(detail, prefs.region).map(l => <a className="offer" key={l.url} href={l.url} target="_blank" rel="noreferrer"><span>{l.name}<small>{l.kind}</small></span><ArrowUpRight size={18}/></a>)}<h3>Historique des prix</h3>{prices?.history?.length ? <div className="history"><table><thead><tr><th>Date</th><th>Marchand</th><th>Hors livraison</th></tr></thead><tbody>{prices.history.map((h: any, i: number) => <tr key={i}><td>{new Date(h.observed_at).toLocaleDateString()}</td><td>{h.merchant}</td><td>{money(h.amount)}</td></tr>)}</tbody></table></div> : <p>L’historique commence à la première observation. Aucun ancien prix n’est reconstitué.</p>}</TabsContent><TabsContent value="specs"><div className="specs">{Object.entries(detail.spec).map(([k, v]) => <div key={k}><span>{k.replaceAll('_', ' ')}</span><strong>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? 'Non documenté')}</strong></div>)}</div><a href={detail.source} target="_blank" rel="noreferrer">Fiche source OpenDB <ArrowUpRight size={14}/></a>{detail.manufacturer && /^https:\/\//.test(detail.manufacturer) && <a className="manufacturer-link" href={detail.manufacturer} target="_blank" rel="noreferrer">Page fabricant <ArrowUpRight size={14}/></a>}</TabsContent><TabsContent value="bench">{prices?.benchmarks?.length ? prices.benchmarks.map((b: any) => <div className="check-item" key={b.id}><div><strong>{b.test} : {b.score} {b.unit}</strong><p>{b.context}</p><a href={b.source} target="_blank" rel="noreferrer">Source · {b.measured_at}</a></div></div>) : <p>Aucun benchmark sourcé importé pour cette référence. Les fréquences et le nombre de cœurs ne suffisent pas à prédire ses FPS.</p>}</TabsContent></Tabs>}</DialogContent></Dialog>
 <Dialog open={settings} onOpenChange={setSettings}><DialogContent><DialogHeader><DialogTitle>Vos préférences</DialogTitle><DialogDescription>Le pays choisit les offres marchands. Les prix restent dans la devise réellement collectée.</DialogDescription></DialogHeader><label>Pays des boutiques<Chooser label="Pays" value={prefs.region} onChange={v => setPrefs({ ...prefs, region: v })} items={[["fr", "France"], ["de", "Allemagne"], ["uk", "Royaume-Uni"], ["us", "États-Unis"]]}/></label><label>Devise<Chooser label="Devise" value={prefs.currency} onChange={v => setPrefs({ ...prefs, currency: v })} items={[["EUR", "Euro · EUR"], ["USD", "Dollar · USD"], ["GBP", "Livre · GBP"]]}/></label><label>Format des nombres<Chooser label="Format" value={prefs.language} onChange={v => setPrefs({ ...prefs, language: v })} items={[["fr", "Français"], ["en", "English"]]}/></label><label>Apparence<Chooser label="Thème" value={prefs.theme} onChange={v => setPrefs({ ...prefs, theme: v })} items={[["dark", "Sombre"], ["light", "Clair"], ["system", "Automatique"]]}/></label><button className="primary" onClick={() => run(async () => { if (user)
        await api('preferences', { preferences: prefs }); setSettings(false); toast.success('Préférences enregistrées'); })}>Enregistrer</button></DialogContent></Dialog>
 <Dialog open={account} onOpenChange={setAccount}><DialogContent className="account-dialog"><DialogHeader><DialogTitle>{user ? 'Mes configurations' : 'Votre espace Riguno'}</DialogTitle><DialogDescription>{user ? 'Configurations privées par défaut. Le partage public peut être retiré à tout moment.' : 'Votre configuration est déjà sauvegardée dans ce navigateur. Connectez-vous pour la retrouver sur vos appareils.'}</DialogDescription></DialogHeader>{!user ? (authAvailable ? <a className="primary" href="/signin-with-chatgpt?return_to=/" target="_top">Se connecter avec ChatGPT <ArrowUpRight size={17}/></a> : <div className="notice"><Info size={19}/><p>Les comptes ne sont pas encore activés sur cet hébergement. La sauvegarde locale et l’export restent disponibles.</p></div>) : <><p>{user.name}</p>{saved.length ? saved.map(b => <div className="saved-build" key={b.id}><button onClick={() => run(async () => { setBuild(await resolve(JSON.parse(b.parts))); setName(b.name); setAccount(false); })}><strong>{b.name}</strong><small>{b.public ? 'Partagée publiquement' : 'Privée'} · {b.updated_at}</small></button><button onClick={() => run(async () => { await api('privacy', { id: b.id, public: !b.public }); await refresh(); })}>{b.public ? 'Retirer le partage' : 'Rendre publique'}</button><button aria-label="Supprimer la configuration" onClick={() => run(async () => { await api('delete', { id: b.id }); await refresh(); })}><Trash2 size={16}/></button></div>) : <p>Aucune configuration enregistrée dans votre compte.</p>}<button className="secondary" onClick={() => run(async () => download(await api('export'), 'riguno-mes-donnees.json'))}>Exporter mes données</button><a href="/signout-with-chatgpt?return_to=/" target="_top">Se déconnecter</a><button className="secondary" onClick={() => setRemoveAccount(true)}>Supprimer mes données Riguno</button></>}</DialogContent></Dialog>
 <Dialog open={legal} onOpenChange={setLegal}><DialogContent className="detail-dialog"><DialogHeader><DialogTitle>Conditions & confidentialité</DialogTitle><DialogDescription>Version de développement · textes à compléter avant ouverture publique.</DialogDescription></DialogHeader><div className="legal-copy"><h3>Utilisation</h3><p>Riguno est un outil gratuit d’aide au choix. Les contrôles utilisent les données disponibles et ne garantissent pas le montage. Les schémas 3D et le flux d’air sont indicatifs. Consultez les manuels des fabricants avant tout achat.</p><h3>Prix et boutiques</h3><p>Les offres sont datées et susceptibles de changer. Le vendeur fixe les prix, la disponibilité, les taxes et la livraison. Riguno ne traite aucun paiement. Une offre avec frais inconnus ne constitue pas un total livré.</p><h3>Données personnelles</h3><p>La configuration et les préférences sont conservées dans votre navigateur. Après connexion, Riguno conserve votre identifiant de compte, vos préférences et vos configurations. Seules les configurations rendues publiques sont accessibles via un lien. Aucun outil publicitaire ou analytique n’est intégré.</p><h3>Vos données</h3><p>Vous pouvez exporter et supprimer vos configurations depuis votre compte. La suppression des données Riguno est disponible dans votre compte ; elle n’efface pas votre compte ChatGPT. L’identité de l’éditeur, son contact, l’hébergeur et la politique de conservation doivent être renseignés dans les documents du projet avant publication publique.</p><h3>Sources</h3><p>Base BuildCores OpenDB sous ODC-By 1.0. Code Riguno sous MIT. Les marques appartiennent à leurs titulaires.</p></div></DialogContent></Dialog>
 <AlertDialog open={removeAccount} onOpenChange={setRemoveAccount}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer vos données Riguno ?</AlertDialogTitle><AlertDialogDescription>Vos configurations privées et publiques ainsi que vos préférences serveur seront supprimées. Votre compte ChatGPT reste disponible.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => run(async () => { await api("deleteAccount"); setSaved([]); setAccount(false); toast.success("Données Riguno supprimées"); })}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </>;
}

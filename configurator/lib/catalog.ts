export const categories = { CPU: 'Processeur', Motherboard: 'Carte mère', GPU: 'Carte graphique', RAM: 'Mémoire vive', Storage: 'Stockage', PCCase: 'Boîtier', PSU: 'Alimentation', CPUCooler: 'Refroidissement', CaseFan: 'Ventilateurs' } as const;
export type Category = keyof typeof categories;
export type Part = {
    id: string;
    category: Category;
    name: string;
    brand: string;
    spec: Record<string, any>;
    source: string;
    manufacturer?: string;
    listings: {
        source: string;
        channel: string;
        source_product_id: string;
        verified?: boolean;
    }[];
    imageCredit?: {
        author: string;
        license: string;
        url: string;
    };
    image?: string;
};
export type Build = Partial<Record<Category, Part>>;
export type Check = {
    level: 'ok' | 'warning' | 'error' | 'unknown';
    title: string;
    detail: string;
};
export function checks(b: Build): Check[] {
    const out: Check[] = [];
    const add = (level: Check['level'], title: string, detail: string) => out.push({ level, title, detail });
    const c = b.CPU?.spec, m = b.Motherboard?.spec, r = b.RAM?.spec, g = b.GPU?.spec, k = b.PCCase?.spec, p = b.PSU?.spec, h = b.CPUCooler?.spec;
    const pair = (a: any, z: any, title: string) => { if (a && z)
        add(a === z ? 'ok' : 'error', title, `${a} / ${z}`);
    else
        add('unknown', title, 'Données manquantes ou composant non sélectionné.'); };
    if (c && m) {
        pair(c.socket, m.socket, 'Socket processeur');
        add('warning', 'Version du BIOS', 'Vérifier la liste de processeurs et la version minimale du BIOS chez le fabricant.');
    }
    if (m && r) {
        pair(m.memory?.ram_type, r.ram_type, 'Génération de mémoire');
        if (m.memory?.slots && r.modules?.quantity)
            add(r.modules.quantity > m.memory.slots ? 'error' : 'ok', 'Emplacements mémoire', `${r.modules.quantity} modules / ${m.memory.slots} emplacements`);
        if (m.memory?.max && r.capacity)
            add(r.capacity > m.memory.max ? 'error' : 'ok', 'Capacité mémoire', `${r.capacity} Go / ${m.memory.max} Go maximum`);
        if (r.form_factor?.includes('SODIMM'))
            add('warning', 'Format mémoire', 'Module SO-DIMM : vérifier le format physique accepté par la carte mère.');
    }
    if (c && r && c.specifications?.memory?.types?.length)
        add(c.specifications.memory.types.includes(r.ram_type) ? 'ok' : 'error', 'Mémoire du processeur', `${r.ram_type} / ${c.specifications.memory.types.join(', ')}`);
    if (k && m) {
        const v = k.supported_motherboard_form_factors;
        add(v?.length ? (v.includes(m.form_factor) ? 'ok' : 'error') : 'unknown', 'Format de carte mère', `${m.form_factor ?? 'Inconnu'} — boîtier : ${v?.join(', ') || 'non documenté'}`);
    }
    if (k && g) {
        const limit = k.max_video_card_length, len = g.length;
        add(limit && len ? (len > limit ? 'error' : 'ok') : 'unknown', 'Dégagement carte graphique', limit && len ? `${len} mm / ${limit} mm maximum · marge ${limit - len} mm hors radiateur et câbles` : 'Dimensions non documentées.');
        if (k.expansion_slots && g.case_expansion_slot_width)
            add(g.case_expansion_slot_width > k.expansion_slots ? 'error' : 'ok', 'Équerres PCIe', `${g.case_expansion_slot_width} slots / ${k.expansion_slots}`);
    }
    if (h && c) {
        add(h.cpu_sockets?.length ? (h.cpu_sockets.includes(c.socket) ? 'ok' : 'error') : 'unknown', 'Fixation du refroidissement', `${c.socket} — ${h.cpu_sockets?.join(', ') || 'non documentée'}`);
    }
    if (h && k) {
        if (h.water_cooled)
            add('unknown', 'Radiateur AIO', `${h.radiator_size ?? '?'} mm : position, épaisseur et dégagement RAM à vérifier dans les manuels.`);
        else
            add(h.height && k.max_cpu_cooler_height ? (h.height > k.max_cpu_cooler_height ? 'error' : 'ok') : 'unknown', 'Hauteur du ventirad', `${h.height ?? '?'} mm / ${k.max_cpu_cooler_height ?? '?'} mm maximum`);
    }
    if (p && k) {
        const f = k.supported_power_supply_form_factors;
        add(f?.length ? (f.includes(p.form_factor) ? 'ok' : 'error') : 'unknown', 'Format alimentation', `${p.form_factor ?? '?'} — ${f?.join(', ') || 'non documenté'}`);
    }
    const watts = power(b);
    if (p && watts)
        add(p.wattage < watts ? 'error' : p.wattage < watts * 1.3 ? 'warning' : 'ok', 'Marge de puissance', `${watts} W estimés · alimentation ${p.wattage} W · cible avec marge ${Math.ceil(watts * 1.3 / 50) * 50} W`);
    if (p && g) {
        const needed = g.power_connectors?.pcie_8_pin;
        const have = p.connectors?.pcie_6_plus_2_pin;
        if (needed && have !== undefined)
            add(have < needed ? 'error' : 'ok', 'Connecteurs PCIe 8 broches', `${needed} requis / ${have} disponibles`);
        if (g.power_connectors?.pcie_12VHPWR || g.power_connectors?.pcie_12V_2x6)
            add('warning', 'Câble 16 broches', 'Vérifier le câble natif compatible, sa puissance et le rayon de courbure. Ne pas réutiliser un câble modulaire d’une autre alimentation.');
    }
    if (b.Storage && m) {
        const s = b.Storage.spec;
        if (s.nvme)
            add(m.m2_slots?.some((x: any) => x.key === 'M' && String(x.interface).includes('PCIe')) ? 'warning' : 'unknown', 'Stockage M.2', 'Vérifier longueur, clé, génération PCIe et partage des lignes dans le manuel.');
    }
    if (r && r.modules?.quantity === 1)
        add('warning', 'Un seul module de RAM', 'Vérifier les possibilités de double canal avec un kit adapté à la carte mère.');
    add('unknown', 'Contrôle mécanique complet', 'Les enveloppes 3D sont indicatives. Câbles, connecteurs, VRM, RAM et montage des radiateurs ne sont pas certifiés.');
    return out;
}
export function power(b: Build) { const c = b.CPU?.spec?.specifications?.ppt || b.CPU?.spec?.specifications?.tdp, g = b.GPU?.spec?.tdp; return c && g ? Math.round(c + g + 75) : null; }
export function summary(p: Part) { const s = p.spec; switch (p.category) {
    case 'CPU': return `${s.cores?.total ?? '?'} cœurs · ${s.socket ?? '?'} · ${s.specifications?.tdp ?? '?'} W`;
    case 'GPU': return `${s.memory ?? '?'} Go · ${s.length ?? '?'} mm · ${s.tdp ?? '?'} W`;
    case 'RAM': return `${s.capacity ?? '?'} Go · ${s.ram_type ?? ''} ${s.speed ?? ''} · CL${s.cas_latency ?? '?'}`;
    case 'Motherboard': return `${s.socket ?? '?'} · ${s.form_factor ?? ''} · ${s.memory?.ram_type ?? ''}`;
    case 'PSU': return `${s.wattage ?? '?'} W · ${s.efficiency_rating ?? ''}`;
    case 'PCCase': return `${s.form_factor ?? ''} · GPU ${s.max_video_card_length ?? '?'} mm`;
    case 'Storage': return `${s.capacity ?? '?'} Go · ${s.interface ?? ''}`;
    case 'CPUCooler': return s.water_cooled ? `AIO ${s.radiator_size ?? '?'} mm` : `Ventirad ${s.height ?? '?'} mm`;
    default: return `${s.size ?? '?'} mm · ${s.max_airflow ?? s.min_airflow ?? '?'} CFM`;
} }
export function retailerLinks(p: Part, region: string) { const domains: Record<string, string> = { fr: 'fr', de: 'de', uk: 'co.uk', us: 'com' }; const a = p.listings.find(x => x.source === 'amazon' && x.channel === region && /^[A-Z0-9]{10}$/.test(x.source_product_id)); const links: {
    name: string;
    url: string;
    kind: string;
}[] = []; if (a)
    links.push({ name: `Amazon ${region.toUpperCase()}`, url: `https://www.amazon.${domains[region] || 'fr'}/dp/${a.source_product_id}`, kind: 'Fiche produit · prix à vérifier' }); return links; }

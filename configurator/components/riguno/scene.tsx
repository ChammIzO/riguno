'use client';
import { useEffect, useRef, useState } from 'react';
import type { Build } from '@/lib/catalog';
type V = [
    number,
    number,
    number
];
type Box = {
    name: string;
    center: V;
    size: V;
    color: string;
};
export default function Scene({ build, airflow, exploded }: {
    build: Build;
    airflow: boolean;
    exploded: boolean;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    const [angle, setAngle] = useState(-.65);
    const [zoom, setZoom] = useState(1);
    const drag = useRef<number | null>(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        let frame = 0;
        let stopped = false;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const draw = (time: number) => {
            if (stopped)
                return;
            const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(devicePixelRatio, 2);
            if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
                canvas.width = w * dpr;
                canvas.height = h * dpr;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const scale = Math.min(w / 650, h / 590) * zoom;
            const project = (v: V): [
                number,
                number,
                number
            ] => { const x = v[0] * Math.cos(angle) + v[2] * Math.sin(angle), z = -v[0] * Math.sin(angle) + v[2] * Math.cos(angle); return [w / 2 + x * scale, h * .48 + (v[1] * .93 - z * .35) * scale, z]; };
            const line = (a: V, b: V, color: string, width = 1) => { const p = project(a), q = project(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); };
            for (let x = -360; x <= 360; x += 40)
                line([x, 240, -320], [x, 240, 320], '#53677b20');
            for (let z = -320; z <= 320; z += 40)
                line([-360, 240, z], [360, 240, z], '#53677b20');
            const boxes: Box[] = [];
            const add = (name: string, center: V, size: V, color: string) => boxes.push({ name, center, size, color });
            const ex = exploded ? 80 : 0;
            if (build.PCCase) {
                add('Châssis', [0, 212, 0], [220, 16, 430], '#455468');
                add('Plateau', [98, 0, 0], [5, 425, 430], '#364152');
            }
            if (build.Motherboard)
                add('Carte mère', [82 + ex, -25, -25], [8, 305, 244], '#235563');
            if (build.CPU)
                add('CPU', [65 + ex, -87, -52], [12, 40, 40], '#b4c4d5');
            if (build.RAM) {
                for (let i = 0; i < Math.min(build.RAM.spec.modules?.quantity || 2, 4); i++)
                    add('RAM', [58 + ex, -40, 15 + i * 12], [28, 133, 6], '#63e8d2');
            }
            if (build.GPU)
                add('GPU', [-5, 55 + ex, 0], [110, Math.max(20, (build.GPU.spec.total_slot_width || 2) * 20.32), build.GPU.spec.length || 280], '#4c6c83');
            if (build.PSU)
                add('Alimentation', [0, 153 + ex, -105], [150, 86, build.PSU.spec.length || 150], '#333c4e');
            if (build.Storage)
                add('SSD', [68 + ex, 90, -15], [8, 22, 80], '#a3a99b');
            if (build.CPUCooler) {
                const s = build.CPUCooler.spec;
                if (s.water_cooled)
                    add('Radiateur', [0, -200 - ex, 0], [120, 30, s.radiator_size || 240], '#557181');
                else
                    add('Ventirad', [0 - ex, -78, -52], [s.height || 150, 120, 100], '#7e94a4');
            }
            const faces: {
                pts: V[];
                depth: number;
                color: string;
            }[] = [];
            for (const box of boxes) {
                const v: V[] = [];
                for (let i = 0; i < 8; i++)
                    v.push([box.center[0] + (i & 1 ? 1 : -1) * box.size[0] / 2, box.center[1] + (i & 2 ? 1 : -1) * box.size[1] / 2, box.center[2] + (i & 4 ? 1 : -1) * box.size[2] / 2]);
                for (const ids of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) {
                    const pts = ids.map(i => v[i]);
                    faces.push({ pts, depth: pts.reduce((a, p) => a + project(p)[2], 0) / 4, color: box.color });
                }
            }
            faces.sort((a, b) => a.depth - b.depth);
            faces.forEach(f => { ctx.beginPath(); f.pts.forEach((p, i) => { const v = project(p); if (i)
                ctx.lineTo(v[0], v[1]);
            else
                ctx.moveTo(v[0], v[1]); }); ctx.closePath(); ctx.fillStyle = f.color; ctx.fill(); ctx.strokeStyle = '#a9cee43a'; ctx.lineWidth = 1; ctx.stroke(); });
            if (build.PCCase) {
                for (const x of [-110, 110]) {
                    for (const y of [-220, 220])
                        line([x, y, -220], [x, y, 220], '#9cb5cc80', 2);
                    for (const z of [-220, 220])
                        line([x, -220, z], [x, 220, z], '#9cb5cc80', 2);
                }
                for (const y of [-220, 220])
                    for (const z of [-220, 220])
                        line([-110, y, z], [110, y, z], '#9cb5cc80', 2);
            }
            if (build.CaseFan) {
                for (const y of [-135, 0, 135]) {
                    const p = project([0, y, 200]);
                    ctx.beginPath();
                    ctx.ellipse(p[0], p[1], 40 * scale, 48 * scale, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = '#68e5cf';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(p[0], p[1], 9 * scale, 0, Math.PI * 2);
                    ctx.fillStyle = '#68e5cf';
                    ctx.fill();
                }
            }
            if (airflow) {
                for (let j = 0; j < 7; j++) {
                    const t = (time / 2300 + j / 7) % 1;
                    const a: V = [-20 + (j % 3) * 25, -100 + (j % 4) * 65, 260 - t * 510];
                    const b: V = [a[0], a[1], a[2] - 35];
                    line(a, b, t < .55 ? '#5ff3d9' : '#ffa267', 3);
                    const p = project(b);
                    ctx.beginPath();
                    ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
                    ctx.fillStyle = t < .55 ? '#5ff3d9' : '#ffa267';
                    ctx.fill();
                }
            }
            if (!reduce)
                frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        const resize = () => { if (reduce)
            draw(0); };
        window.addEventListener('resize', resize);
        return () => { stopped = true; cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
    }, [build, angle, zoom, airflow, exploded]);
    return <div className="scene"><canvas ref={ref} role="img" aria-label="Volumes 3D indicatifs des composants, tourner avec les boutons ou glisser" onPointerDown={e => { drag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current !== null) {
        setAngle(a => a + (e.clientX - drag.current!) * .008);
        drag.current = e.clientX;
    } }} onPointerUp={() => drag.current = null} onPointerCancel={() => drag.current = null}/><div className="scene-controls"><button aria-label="Tourner à gauche" onClick={() => setAngle(a => a - .3)}>↶</button><button aria-label="Réduire" onClick={() => setZoom(z => Math.max(.5, z - .1))}>−</button><span>3D</span><button aria-label="Agrandir" onClick={() => setZoom(z => Math.min(1.8, z + .1))}>+</button><button aria-label="Tourner à droite" onClick={() => setAngle(a => a + .3)}>↷</button></div></div>;
}

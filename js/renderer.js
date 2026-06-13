// CRITICAL: Define draw functions BEFORE any main script loads
const NODE_R = 14;
function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function bbox(n, p, d) {
    const xs = n.filter(i => p[i]).map(i => p[i][0]);
    const ys = n.filter(i => p[i]).map(i => p[i][1]);
    if (!xs.length) return null;
    const mx = Math.min(...xs), mx2 = Math.max(...xs);
    const my = Math.min(...ys), my2 = Math.max(...ys);
    return { x: mx - d, y: my - d, w: mx2 - mx + d * 2, h: my2 - my + d * 2 };
}
function drawMapBackground(c, p) {
    c.fillStyle = '#edf2e6'; c.fillRect(0, 0, CANVAS_W, CANVAS_H);
    c.strokeStyle = 'rgba(175,190,160,0.3)'; c.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 55) { c.beginPath();
        c.moveTo(x,0); c.lineTo(x,CANVAS_H); c.stroke(); }
    for (let y = 0; y < CANVAS_H; y += 55) { c.beginPath();
        c.moveTo(0,y); c.lineTo(CANVAS_W,y); c.stroke(); }
}
function drawRoads(c, g, p, e) {
    if (!window._edgeRouter) window._edgeRouter = new OrthogonalEdgeRouter(p, CANVAS_W, CANVAS_H);
    window._edgeRouter.nodePos = p;
    const d = new Set();
    for (const [u, nb] of Object.entries(g)) {
        for (const [v] of nb) {
            const k = u+'|'+v, r = v+'|'+u;
            if (d.has(k) || d.has(r)) continue; d.add(k);
            if (!p[u] || !p[v]) continue;
            const o = e && (e.has(k) || e.has(r));
            const rp = window._edgeRouter.routeEdge(u, v);
            const dist = Math.hypot(p[v][0]-p[u][0], p[v][1]-p[u][1]);
            const hw = o ? 6 : dist > 300 ? 5 : dist > 120 ? 4 : 3;
            c.fillStyle = o ? '#e03030' : dist > 300 ? '#9aaab8' : dist > 120 ? '#b0bece' : '#c2ceda';
            for (let w = -hw; w <= hw; w++) {
                for (let i = 0; i < rp.length - 1; i++) {
                    const p1 = rp[i], p2 = rp[i + 1];
                    const dx = p2.x - p1.x, dy = p2.y - p1.y;
                    const len = Math.hypot(dx, dy) + 0.1;
                    const nx = -dy / len, ny = dx / len;
                    const ox = Math.round(nx * w), oy = Math.round(ny * w);
                    for (const pt of bresenham(Math.round(p1.x+ox), Math.round(p1.y+oy), Math.round(p2.x+ox), Math.round(p2.y+oy))) {
                        c.fillRect(pt.x, pt.y, 1, 1); } } }
        }
    }
}
function drawNodes(c, p, s, d, st, rl, pa) {
    const pset = new Set(pa || []);
    for (const [n, [cx, cy]] of Object.entries(p)) {
        const z = nodeZone[n];
        let r = NODE_R, f, rg;
        if (n === s) { f='#FFD700'; rg='#7a5e00'; r=16; }
        else if (n === d) { f='#FF2020'; rg='#7f0000'; r=17; }
        else if (z === 'spbu') { f='#ffb347'; rg='#8a4000'; }
        else if (pset.has(n)) { f='#2ecc71'; rg='#1a6b38'; }
        else if (st && st.has(n)) { f='#9b59b6'; rg='#4a2080'; }
        else if (rl && rl.has(n)) { f='#3498db'; rg='#1a4f80'; }
        else if (z === 'kampus' || z === 'gerbang') { f='#27ae60'; rg='#1a5c38'; }
        else if (z === 'batu') { f='#e67e22'; rg='#7a3e00'; }
        else { f='#2980b9'; rg='#1a4f80'; }
        fillCircle(c, cx+2, cy+2, r+2, 'rgba(0,0,0,0.15)');
        fillCircle(c, cx, cy, r+2, rg); fillCircle(c, cx, cy, r, f);
        c.save(); c.font = (r+1)+'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        if (n === s) c.fillText('🚩', cx, cy);
        else if (n === d) c.fillText('🏁', cx, cy);
        c.restore(); c.save(); c.font = 'bold 10px monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
        const tw = c.measureText(n).width + 7; const ly = cy + r + 3;
        c.fillStyle = 'rgba(255,255,255,0.93)'; c.fillRect(cx - tw/2, ly, tw, 14);
        c.fillStyle = '#111827'; c.fillText(n, cx, ly+1); c.restore();
    }
}
function drawVehicle(c, x, y) {
    c.beginPath(); c.ellipse(x+2, y+3, 15, 10, 0, 0, 2*Math.PI);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill(); c.beginPath();
    c.arc(x, y, 15, 0, 2*Math.PI); c.fillStyle = '#1a2535'; c.fill();
    c.strokeStyle = '#FFD700'; c.lineWidth = 2.5; c.stroke();
    c.save(); c.font = '16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🚗', x, y); c.restore();
}
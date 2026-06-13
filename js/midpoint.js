// ============================================================
// midpoint.js — Algoritma Midpoint Circle Drawing
// Menggambar node/simpul dengan simetri 8-oktan
// Kompleksitas Waktu: O(r)
// ============================================================
function midpointCircle(cx, cy, r) {
    const pts = [];
    let x = r, y = 0, err = 0;
    while (x >= y) {
        pts.push(
            {x:cx+x,y:cy+y},{x:cx+y,y:cy+x},
            {x:cx-y,y:cy+x},{x:cx-x,y:cy+y},
            {x:cx-x,y:cy-y},{x:cx-y,y:cy-x},
            {x:cx+y,y:cy-x},{x:cx+x,y:cy-y}
        );
        y++; err += 1 + 2*y;
        if (2*(err-x)+1 > 0) { x--; err += 1-2*x; }
    }
    return pts;
}

function fillCircle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let ri = r; ri >= 1; ri--)
        for (const p of midpointCircle(cx, cy, ri))
            ctx.fillRect(p.x, p.y, 1, 1);
}
// ============================================================
// bresenham.js — Algoritma Bresenham Line Drawing
// Menggambar garis piksel dari (x0,y0) ke (x1,y1)
// Kompleksitas Waktu: O(max(|dx|, |dy|))
// ============================================================
function bresenham(x0, y0, x1, y1) {
    const pts = [];
    let dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    while (true) {
        pts.push({x, y});
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 <  dx) { err += dx; y += sy; }
    }
    return pts;
}
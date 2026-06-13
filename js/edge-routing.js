// ============================================================
// edge-routing.js — Efficient edge routing untuk minimize crossing
// Menggunakan orthogonal paths dan bundle optimization
// ============================================================

// ── ORTHOGONAL EDGE ROUTING: Hindari persilangan dengan jalur siku ──
class OrthogonalEdgeRouter {
    constructor(nodePos, canvasW, canvasH) {
        this.nodePos = nodePos;
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.grid = new SpatialGrid(canvasW, canvasH, 40);
        this.edgePaths = new Map();
    }

    // Route edge dengan jalur orthogonal (H-V-H atau V-H-V)
    // SELALU dimulai dari node center dan berakhir di node center
    routeEdge(node1, node2, cost = 'crossing') {
        const key = [node1, node2].sort().join('|');
        if (this.edgePaths.has(key)) return this.edgePaths.get(key);

        const [x1, y1] = this.nodePos[node1];
        const [x2, y2] = this.nodePos[node2];
        const dist = Math.hypot(x2 - x1, y2 - y1);

        // Jika dekat, langsung straight line
        if (dist < 150) {
            const path = [{x: x1, y: y1}, {x: x2, y: y2}];
            this.edgePaths.set(key, path);
            return path;
        }

        // Untuk jarak jauh, gunakan orthogonal path dengan offset kecil dari node
        // untuk menghindari langsung keluar dari circle node
        const offset = 18; // Node radius
        
        // Calculate direction vectors
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        
        // Midpoint untuk routing
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        
        // Paths dengan start/end point yang akurat dari node center
        const paths = [
            // H-V-H: horizontal - vertical - horizontal
            [{x: x1, y: y1}, {x: mx, y: y1}, {x: mx, y: y2}, {x: x2, y: y2}],
            // V-H-V: vertical - horizontal - vertical
            [{x: x1, y: y1}, {x: x1, y: my}, {x: x2, y: my}, {x: x2, y: y2}],
            // Offset H-V-H: dengan sedikit offset dari node untuk jarak panjang
            dist > 250 ? 
                [{x: x1, y: y1}, 
                 {x: x1 + (x2-x1) * 0.25, y: y1}, 
                 {x: x1 + (x2-x1) * 0.25, y: y2}, 
                 {x: x2, y: y2}] :
                null,
        ].filter(p => p !== null);

        let bestPath = paths[0];
        let bestCost = Infinity;

        for (const p of paths) {
            let cost = this.calculatePathCost(p, [node1, node2]);
            if (cost < bestCost) {
                bestCost = cost;
                bestPath = p;
            }
        }

        this.edgePaths.set(key, bestPath);
        return bestPath;
    }

    calculatePathCost(path, excludeNodes) {
        let cost = 0;

        // Penalti: panjang path
        for (let i = 0; i < path.length - 1; i++) {
            cost += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y) * 0.1;
        }

        // Penalti: jika path melewati banyak node lain atau terlalu dekat
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i], p2 = path[i + 1];
            for (const [n, pos] of Object.entries(this.nodePos)) {
                if (excludeNodes.includes(n)) continue;
                // Increased threshold dari 25 menjadi 40 untuk lebih agresif menghindari node
                if (this.pointNearSegment(pos[0], pos[1], p1.x, p1.y, p2.x, p2.y, 40)) {
                    cost += 50;
                }
            }
        }

        return cost;
    }

    pointNearSegment(px, py, x1, y1, x2, y2, threshold) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
        const nearX = x1 + t * dx;
        const nearY = y1 + t * dy;
        return Math.hypot(px - nearX, py - nearY) < threshold;
    }

    // Get full waypoint path untuk sequence of nodes (untuk vehicle animation)
    getPathWaypoints(nodePath) {
        if (!nodePath || nodePath.length < 2) return [];
        
        const allWaypoints = [];
        
        for (let i = 0; i < nodePath.length - 1; i++) {
            const node1 = nodePath[i];
            const node2 = nodePath[i + 1];
            
            // Get routed path untuk edge ini
            const edgePath = this.routeEdge(node1, node2);
            
            // Add semua waypoints, tapi skip last point untuk avoid duplicate junction
            for (let j = 0; j < edgePath.length - 1; j++) {
                const p = edgePath[j];
                // Snap to grid untuk accuracy
                allWaypoints.push({
                    x: Math.round(p.x * 10) / 10,
                    y: Math.round(p.y * 10) / 10
                });
            }
        }
        
        // Add last waypoint (destination)
        const lastNode = nodePath[nodePath.length - 1];
        const lastPos = this.nodePos[lastNode];
        if (lastPos) {
            allWaypoints.push({
                x: lastPos[0],
                y: lastPos[1]
            });
        }
        
        return allWaypoints;
    }

    clear() {
        this.edgePaths.clear();
    }
}

// ── EDGE BUNDLING: Kelompokkan edge yang sejajar untuk estetika ──
class EdgeBundle {
    constructor(edges, nodePos, threshold = 30) {
        this.edges = edges;
        this.nodePos = nodePos;
        this.threshold = threshold;
        this.bundles = [];
        this.computeBundles();
    }

    computeBundles() {
        const processed = new Set();
        
        for (let i = 0; i < this.edges.length; i++) {
            if (processed.has(i)) continue;
            
            const bundle = [this.edges[i]];
            processed.add(i);

            for (let j = i + 1; j < this.edges.length; j++) {
                if (processed.has(j)) continue;

                const sim = this.edgeSimilarity(this.edges[i], this.edges[j]);
                if (sim > 0.7) {
                    bundle.push(this.edges[j]);
                    processed.add(j);
                }
            }

            this.bundles.push(bundle);
        }
    }

    edgeSimilarity(e1, e2) {
        const [a1, b1] = e1;
        const [a2, b2] = e2;
        if (a1 === a2 || a1 === b2 || b1 === a2 || b1 === b2) return 0;

        const p1a = this.nodePos[a1];
        const p1b = this.nodePos[b1];
        const p2a = this.nodePos[a2];
        const p2b = this.nodePos[b2];

        const len1 = Math.hypot(p1b[0] - p1a[0], p1b[1] - p1a[1]);
        const len2 = Math.hypot(p2b[0] - p2a[0], p2b[1] - p2a[1]);
        
        // Direction similarity (dot product dari normalized direction)
        const dir1 = [(p1b[0] - p1a[0]) / len1, (p1b[1] - p1a[1]) / len1];
        const dir2 = [(p2b[0] - p2a[0]) / len2, (p2b[1] - p2a[1]) / len2];
        const dirSim = Math.abs(dir1[0] * dir2[0] + dir1[1] * dir2[1]);

        // Position similarity
        const midDist = Math.hypot(
            ((p1a[0] + p1b[0]) / 2) - ((p2a[0] + p2b[0]) / 2),
            ((p1a[1] + p1b[1]) / 2) - ((p2a[1] + p2b[1]) / 2)
        );
        const posSim = Math.max(0, 1 - midDist / 400);

        return dirSim * 0.6 + posSim * 0.4;
    }

    getBundleOffset(edgeIdx, bundleIdx) {
        const bundle = this.bundles.find(b => b.some((e, i) => 
            e === this.edges[edgeIdx] || (i === bundleIdx)
        ));
        if (!bundle) return 0;
        
        const idx = bundle.indexOf(this.edges[edgeIdx]);
        const offset = (idx - bundle.length / 2 + 0.5) * 3;
        return offset;
    }
}

// ── CROSSING MINIMIZATION: Reorder edge dalam setiap bundle ──
function minimizeEdgeCrossings(edges, nodePos, maxIterations = 20) {
    let current = [...edges];
    let bestOrder = [...current];
    let bestCrossings = countEdgeCrossings(current, nodePos);

    for (let iter = 0; iter < maxIterations; iter++) {
        // Random local swap
        for (let i = 0; i < current.length; i++) {
            const j = i + Math.floor(Math.random() * Math.min(5, current.length - i));
            if (j < current.length) {
                [current[i], current[j]] = [current[j], current[i]];
                
                const crossings = countEdgeCrossings(current, nodePos);
                if (crossings < bestCrossings) {
                    bestCrossings = crossings;
                    bestOrder = [...current];
                } else {
                    // Revert jika lebih buruk
                    [current[i], current[j]] = [current[j], current[i]];
                }
            }
        }
    }

    return bestOrder;
}

// ── BEZIER CURVE EDGE RENDERING: Smoother curves untuk bundled edges ──
function renderBezierEdge(ctx, p1, p2, controlPoints, style) {
    ctx.save();
    ctx.strokeStyle = style.color || '#b0bece';
    ctx.lineWidth = style.width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);

    if (controlPoints && controlPoints.length === 2) {
        const cp1 = controlPoints[0];
        const cp2 = controlPoints[1];
        ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], p2[0], p2[1]);
    } else {
        ctx.lineTo(p2[0], p2[1]);
    }

    ctx.stroke();
    ctx.restore();
}

// ── BUNDLE-AWARE POINT GENERATOR: Untuk edge yang di-bundle ──
function generateBundledEdgePoints(p1, p2, bundleOffset, isPath = false) {
    if (isPath) {
        // Straight path dengan offset untuk bundle
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;

        return [
            [p1[0] + nx * bundleOffset, p1[1] + ny * bundleOffset],
            [p2[0] + nx * bundleOffset, p2[1] + ny * bundleOffset]
        ];
    } else {
        // Bezier curve dengan control points offset
        const mx = (p1[0] + p2[0]) / 2;
        const my = (p1[1] + p2[1]) / 2;
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dist = Math.hypot(dx, dy);
        const nx = -dy / dist;
        const ny = dx / dist;

        const cp1 = [p1[0] + dx * 0.25 + nx * bundleOffset, p1[1] + dy * 0.25 + ny * bundleOffset];
        const cp2 = [p2[0] - dx * 0.25 + nx * bundleOffset, p2[1] - dy * 0.25 + ny * bundleOffset];

        return [cp1, cp2];
    }
}

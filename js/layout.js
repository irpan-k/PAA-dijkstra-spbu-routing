// ============================================================
// layout.js — Spatial Layout Algorithm untuk positioning optimal
// Gunakan struktur data yang efisien untuk menghindari edge crossing
// dan tampilan rapi saat node diacak
// ============================================================

// ── SPATIAL GRID: O(1) amortized collision detection ──────────
class SpatialGrid {
    constructor(width, height, cellSize = 60) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = Array(this.rows * this.cols).fill(null).map(() => []);
    }

    clear() {
        for (let i = 0; i < this.grid.length; i++) this.grid[i] = [];
    }

    insert(x, y, data, radius = 0) {
        const minC = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxC = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minR = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxR = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
        
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                this.grid[r * this.cols + c].push({x, y, data, radius});
            }
        }
    }

    query(x, y, radius) {
        const result = [];
        const minC = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxC = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minR = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxR = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
        
        const seen = new Set();
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                for (const item of this.grid[r * this.cols + c]) {
                    const key = item.data;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const dist = Math.hypot(item.x - x, item.y - y);
                        if (dist < radius + item.radius) result.push(item);
                    }
                }
            }
        }
        return result;
    }
}

// ── MIN PRIORITY QUEUE untuk Force-Directed Layout ──────────
class PriorityQueue {
    constructor() { this.items = []; }
    enqueue(item, priority) {
        this.items.push({item, priority});
        this.bubbleUp(this.items.length - 1);
    }
    dequeue() {
        if (!this.items.length) return null;
        const result = this.items[0];
        const end = this.items.pop();
        if (this.items.length) {
            this.items[0] = end;
            this.bubbleDown(0);
        }
        return result.item;
    }
    bubbleUp(idx) {
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (this.items[parent].priority <= this.items[idx].priority) break;
            [this.items[parent], this.items[idx]] = [this.items[idx], this.items[parent]];
            idx = parent;
        }
    }
    bubbleDown(idx) {
        const len = this.items.length;
        while (true) {
            let swap = null;
            const leftChild = 2 * idx + 1;
            const rightChild = 2 * idx + 2;
            
            if (leftChild < len && this.items[leftChild].priority < this.items[idx].priority)
                swap = leftChild;
            if (rightChild < len && this.items[rightChild].priority < this.items[swap || idx].priority)
                swap = rightChild;
            
            if (!swap) break;
            [this.items[swap], this.items[idx]] = [this.items[idx], this.items[swap]];
            idx = swap;
        }
    }
    size() { return this.items.length; }
}

// ── COLLISION PREVENTION: Multi-pass iterative relaxation ────────────
function optimizePositionSpacing(placed, minDist = 85, maxIterations = 5) {
    for (let iter = 0; iter < maxIterations; iter++) {
        let conflicts = 0;
        
        // Check all pairs and push apart if too close
        for (let i = 0; i < allNodes.length; i++) {
            for (let j = i + 1; j < allNodes.length; j++) {
                const a = allNodes[i];
                const b = allNodes[j];
                if (!(a in placed) || !(b in placed)) continue;
                
                const dx = placed[b][0] - placed[a][0];
                const dy = placed[b][1] - placed[a][1];
                const dist = Math.hypot(dx, dy);
                
                if (dist < minDist && dist > 0) {
                    conflicts++;
                    // Push nodes apart
                    const ratio = (minDist - dist) / (dist * 2);
                    const pushX = dx * ratio;
                    const pushY = dy * ratio;
                    
                    placed[a][0] -= pushX;
                    placed[a][1] -= pushY;
                    placed[b][0] += pushX;
                    placed[b][1] += pushY;
                    
                    // Keep nodes within bounds
                    const zoneA = nodeZone[a] || 'kota';
                    const zoneB = nodeZone[b] || 'kota';
                    const bA = ZONE_BOUNDS[zoneA] || ZONE_BOUNDS.kota;
                    const bB = ZONE_BOUNDS[zoneB] || ZONE_BOUNDS.kota;
                    
                    placed[a][0] = Math.max(bA.xMin, Math.min(bA.xMax, placed[a][0]));
                    placed[a][1] = Math.max(bA.yMin, Math.min(bA.yMax, placed[a][1]));
                    placed[b][0] = Math.max(bB.xMin, Math.min(bB.xMax, placed[b][0]));
                    placed[b][1] = Math.max(bB.yMin, Math.min(bB.yMax, placed[b][1]));
                }
            }
        }
        
        // If no conflicts found, we're done
        if (conflicts === 0) break;
    }
}

// ── MAIN: Randomize dengan layout optimization ────────────────
function randomizePositionsOptimized() {
    const placed = {};
    
    // Step 1: Random initial placement dalam zona
    for (const node of allNodes) {
        const b = ZONE_BOUNDS[nodeZone[node]] || ZONE_BOUNDS.kota;
        placed[node] = [
            randInt(b.xMin, b.xMax),
            randInt(b.yMin, b.yMax)
        ];
    }

    // Step 2: Optimize spacing dengan 1 iterasi cepat
    optimizePositionSpacing(placed, 85, 1);
    
    // Step 3: Update global positions
    nodePositions = placed;

    // Step 4: Rebuild graph dengan weight baru
    const g = {};
    for (const n of allNodes) g[n] = [];
    
    for (const [a, b, _] of EDGE_LIST) {
        if (!placed[a] || !placed[b]) continue;
        
        const px = Math.hypot(placed[b][0]-placed[a][0], placed[b][1]-placed[a][1]);
        const isLong = (nodeZone[a] !== nodeZone[b]) &&
                       (['kota','gerbang','kampus'].includes(nodeZone[a]) ||
                        ['kota','gerbang','kampus'].includes(nodeZone[b]));
        const scale = isLong ? 1/PX_PER_M_CITY : 1/PX_PER_M_LOCAL;
        const w = Math.round(px * scale / 50) * 50;
        const wFinal = Math.max(50, w);
        
        // Use adjacency tracking untuk O(1) lookup
        if (!g[a].some(x=>x[0]===b)) g[a].push([b, wFinal]);
        if (!g[b].some(x=>x[0]===a)) g[b].push([a, wFinal]);
    }
    graph = g;
    
    // Step 5: Clear edge router cache karena posisi berubah
    if (window._edgeRouter) {
        window._edgeRouter.clear();
    }
}

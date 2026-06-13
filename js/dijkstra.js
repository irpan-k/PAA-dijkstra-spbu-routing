// ============================================================
// dijkstra.js — Dijkstra + Min-Heap dengan rekaman steps
// Waktu: O((V+E) log V)  |  Ruang: O(V+E)
// ============================================================
class MinHeap {
    constructor() { this._h = []; }
    get size() { return this._h.length; }
    push(node, dist) { this._h.push({node,dist}); this._up(this._h.length-1); }
    pop() {
        const top=this._h[0], last=this._h.pop();
        if (this._h.length) { this._h[0]=last; this._down(0); }
        return top;
    }
    _up(i) {
        while (i>0) {
            const p=(i-1)>>1;
            if (this._h[p].dist<=this._h[i].dist) break;
            [this._h[p],this._h[i]]=[this._h[i],this._h[p]]; i=p;
        }
    }
    _down(i) {
        const n=this._h.length;
        while (true) {
            let s=i, l=2*i+1, r=2*i+2;
            if (l<n&&this._h[l].dist<this._h[s].dist) s=l;
            if (r<n&&this._h[r].dist<this._h[s].dist) s=r;
            if (s===i) break;
            [this._h[s],this._h[i]]=[this._h[i],this._h[s]]; i=s;
        }
    }
}

function dijkstra(graph, start, target) {
    const dist={}, prev={}, settled=new Set(), steps=[];
    for (const n of Object.keys(graph)) { dist[n]=Infinity; prev[n]=null; }
    dist[start]=0;
    const heap=new MinHeap(); heap.push(start,0);
    while (heap.size>0) {
        const {node:u, dist:d}=heap.pop();
        if (settled.has(u)) continue;
        settled.add(u);
        const relaxed=[];
        for (const [v,w] of (graph[u]||[])) {
            if (settled.has(v)) continue;
            const alt=d+w;
            if (alt<dist[v]) { dist[v]=alt; prev[v]=u; heap.push(v,alt); relaxed.push(v); }
        }
        steps.push({settled:u, relaxed:[...relaxed], distSnap:{...dist}});
        if (u===target) break;
    }
    const path=[]; let cur=target;
    while (cur!==null) { path.unshift(cur); cur=prev[cur]; if(path[0]===start) break; }
    if (path[0]!==start) return {distance:Infinity, path:[], steps};
    return {distance:dist[target], path, steps};
}

function findNearestSPBU(graph, spbuList, start) {
    let best={spbu:null, distance:Infinity, path:[], steps:[]};
    for (const spbu of spbuList) {
        if (spbu===start) continue;
        const res=dijkstra(graph,start,spbu);
        if (res.distance<best.distance)
            best={spbu, distance:res.distance, path:res.path, steps:res.steps};
    }
    return best;
}
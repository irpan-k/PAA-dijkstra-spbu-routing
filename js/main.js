// ============================================================
// main.js — Controller utama, 3 fase animasi
// ============================================================
const canvas=document.getElementById('mapCanvas');
const ctx=canvas.getContext('2d');

// ===== Drawing Functions (injected at top of main.js) =====
// NODE_R is already declared in index.html inline script

window.testFunc = function() { return "TEST"; };

function rrect(ctx, x, y, w, h, r) {
ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

function bbox(n,p,d) {
const xs=n.filter(i=>p[i]).map(i=>p[i][0]);const ys=n.filter(i=>p[i]).map(i=>p[i][1]);if(!xs.length)return null;const mx=Math.min(...xs),mx2=Math.max(...xs);const my=Math.min(...ys),my2=Math.max(...ys);return{x:mx-d,y:my-d,w:mx2-mx+d*2,h:my2-my+d*2};
}

function drawMapBackground(c,p) {
c.fillStyle='#edf2e6';c.fillRect(0,0,CANVAS_W,CANVAS_H);c.strokeStyle='rgba(175,190,160,0.3)';c.lineWidth=1;for(let x=0;x<CANVAS_W;x+=55){c.beginPath();c.moveTo(x,0);c.lineTo(x,CANVAS_H);c.stroke();}for(let y=0;y<CANVAS_H;y+=55){c.beginPath();c.moveTo(0,y);c.lineTo(CANVAS_W,y);c.stroke();}
}

function drawRoads(c,g,p,e) {
if(!window._edgeRouter)window._edgeRouter=new OrthogonalEdgeRouter(p,CANVAS_W,CANVAS_H);window._edgeRouter.nodePos=p;const d=new Set();for(const[u,nb]of Object.entries(g)){for(const[v]of nb){const k=u+'|'+v,r=v+'|'+u;if(d.has(k)||d.has(r))continue;d.add(k);if(!p[u]||!p[v])continue;const o=e&&(e.has(k)||e.has(r));const rp=window._edgeRouter.routeEdge(u,v);const dist=Math.hypot(p[v][0]-p[u][0],p[v][1]-p[u][1]);const hw=o?6:dist>300?5:dist>120?4:3;c.fillStyle=o?'#e03030':dist>300?'#9aaab8':dist>120?'#b0bece':'#c2ceda';for(let w=-hw;w<=hw;w++){for(let i=0;i<rp.length-1;i++){const p1=rp[i],p2=rp[i+1];const dx=p2.x-p1.x,dy=p2.y-p1.y;const len=Math.hypot(dx,dy)+0.1;const nx=-dy/len,ny=dx/len;const ox=Math.round(nx*w),oy=Math.round(ny*w);for(const pt of bresenham(Math.round(p1.x+ox),Math.round(p1.y+oy),Math.round(p2.x+ox),Math.round(p2.y+oy))){c.fillRect(pt.x,pt.y,1,1);}}}}}
}

function drawNodes(c,p,s,d,st,rl,pa) {
const pset=new Set(pa||[]);for(const[n,[cx,cy]]of Object.entries(p)){const z=nodeZone[n];let r=NODE_R,f,rg;if(n===s){f='#FFD700';rg='#7a5e00';r=16;}else if(n===d){f='#FF2020';rg='#7f0000';r=17;}else if(z==='spbu'){f='#ffb347';rg='#8a4000';}else if(pset.has(n)){f='#2ecc71';rg='#1a6b38';}else if(st&&st.has(n)){f='#9b59b6';rg='#4a2080';}else if(rl&&rl.has(n)){f='#3498db';rg='#1a4f80';}else if(z==='kampus'||z==='gerbang'){f='#27ae60';rg='#1a5c38';}else if(z==='batu'){f='#e67e22';rg='#7a3e00';}else{f='#2980b9';rg='#1a4f80';}fillCircle(c,cx+2,cy+2,r+2,'rgba(0,0,0,0.15)');fillCircle(c,cx,cy,r+2,rg);fillCircle(c,cx,cy,r,f);c.save();c.font=(r+1)+'px sans-serif';c.textAlign='center';c.textBaseline='middle';if(n===s)c.fillText('🚩',cx,cy);else if(n===d)c.fillText('🏁',cx,cy);c.restore();c.save();c.font='bold 10px monospace';c.textAlign='center';c.textBaseline='top';const tw=c.measureText(n).width+7;const ly=cy+r+3;c.fillStyle='rgba(255,255,255,0.93)';c.fillRect(cx-tw/2,ly,tw,14);c.fillStyle='#111827';c.fillText(n,cx,ly+1);c.restore();}
}

function drawVehicle(c,x,y) {
c.beginPath();c.ellipse(x+2,y+3,15,10,0,0,2*Math.PI);c.fillStyle='rgba(0,0,0,0.2)';c.fill();c.beginPath();c.arc(x,y,15,0,2*Math.PI);c.fillStyle='#1a2535';c.fill();c.strokeStyle='#FFD700';c.lineWidth=2.5;c.stroke();c.save();c.font='16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🚗',x,y);c.restore();
}

// ===== End Drawing Functions =====

function buildPathEdgeSet(path) {
    const e = new Set();
    if(!path) return e;
    for(let i=0;i<path.length-1;i++) {
        const a=path[i], b=path[i+1];
        e.add(a+'|'+b);
        e.add(b+'|'+a);
    }
    return e;
}

let currentSource='UMRAH', resultData=null;
let settledSet=new Set(), relaxedSet=new Set();
let currentPath=[], pathEdgeSet=new Set();
let vehiclePos=null, showVehicle=false;
let animPhase='idle', animFrame=null;
let scanIdx=0, lastTime=0, driveSegment=0, driveT=0;
let SCAN_DELAY=700;
const DRIVE_SPD=65;

function populateDropdown() {
    const sel=document.getElementById('startNode');
    sel.innerHTML='';
    for (const n of allNodes) {
        if (spbuList.includes(n)) continue;
        const o=document.createElement('option');
        o.value=n; o.textContent=n; sel.appendChild(o);
    }
    sel.value=currentSource;
}

function updateStats() {
    const seen=new Set(); let e=0;
    for (const[,nbrs] of Object.entries(graph))
        for (const[nb] of nbrs){const k=[...arguments].sort().join('|');if(!seen.has(k)){seen.add(k);e++;}}
    // simpler count
    let ec=0; const s2=new Set();
    for (const[n,nbrs] of Object.entries(graph))
        for(const[nb] of nbrs){const k=[n,nb].sort().join('|');if(!s2.has(k)){s2.add(k);ec++;}}
    document.getElementById('statV').textContent=allNodes.length;
    document.getElementById('statE').textContent=ec;
}

function setStatus(txt,color='#94a3b8'){
    const el=document.getElementById('statusBar');
    el.textContent=txt; el.style.color=color;
}

function showResult(data){
    const el=document.getElementById('result');
    if(!data||data.distance===Infinity){
        el.innerHTML='<span style="color:#ff6b6b">❌ Tidak ada SPBU yang dapat dijangkau dari <b>'+currentSource+'</b>.</span>';
        return;
    }
    el.innerHTML=
        `<div class="res-row">🚩 <b>Lokasi Awal:</b> ${currentSource}</div>`+
        `<div class="res-row">🏁 <b>SPBU Terdekat:</b> ${data.spbu}</div>`+
        `<div class="res-row">📏 <b>Total Jarak:</b> ${fmtDist(data.distance)}</div>`+
        `<div class="res-row">📍 <b>Jalur Terpendek:</b><br>&nbsp;&nbsp;&nbsp;${data.path.join(' → ')}</div>`+
        `<div class="res-row">🔍 <b>Urutan Eksplorasi Dijkstra:</b><br>&nbsp;&nbsp;&nbsp;${data.steps.map(s=>s.settled).join(' → ')}</div>`;
}

function render(){
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    drawMapBackground(ctx,nodePositions);
    drawRoads(ctx,graph,nodePositions,pathEdgeSet);
    drawNodes(ctx,nodePositions,currentSource,
        resultData?resultData.spbu:null,settledSet,relaxedSet,currentPath);
    if(showVehicle&&vehiclePos) drawVehicle(ctx,vehiclePos.x,vehiclePos.y);
}

function computeRoute(){
    resultData=findNearestSPBU(graph,spbuList,currentSource);
    currentPath=resultData.path||[];
    pathEdgeSet=new Set(); settledSet=new Set(); relaxedSet=new Set(); showVehicle=false;
    showResult(resultData);
}

function stopAll(){
    if(animFrame){cancelAnimationFrame(animFrame);animFrame=null;}
    animPhase='idle';
}

function resetView(){
    stopAll();
    pathEdgeSet=new Set(); settledSet=new Set(); relaxedSet=new Set(); showVehicle=false;
    document.getElementById('scanInfo').innerHTML=
        '<em>Tekan <b>Mulai Simulasi</b> untuk menjalankan visualisasi Dijkstra.</em>';
    render();
}

// FASE 1 — SCANNING
function startScanning(){
    if(!resultData||!resultData.steps||!resultData.steps.length){
        setStatus('❌ Tidak ada rute.','#ff6b6b'); return;
    }
    stopAll();
    pathEdgeSet=new Set(); settledSet=new Set(); relaxedSet=new Set(); showVehicle=false;
    scanIdx=0; animPhase='scanning'; lastTime=performance.now();
    setStatus('🔍 Fase 1 — Dijkstra men-scan simpul...','#74c0fc');
    function scanLoop(now){
        if(animPhase!=='scanning') return;
        if(now-lastTime<SCAN_DELAY){animFrame=requestAnimationFrame(scanLoop);return;}
        lastTime=now;
        if(scanIdx>=resultData.steps.length){
            relaxedSet=new Set();
            setStatus('✅ Fase 2 — Jalur terpendek ditemukan!','#2ecc71');
            setTimeout(startHighlight,600); return;
        }
        const step=resultData.steps[scanIdx];
        settledSet.add(step.settled); relaxedSet=new Set(step.relaxed);
        updateScanPanel(step,scanIdx); render(); scanIdx++;
        animFrame=requestAnimationFrame(scanLoop);
    }
    animFrame=requestAnimationFrame(scanLoop);
}

function updateScanPanel(step,idx){
    const rows=Object.entries(step.distSnap)
        .filter(([,d])=>d<Infinity).sort(([,a],[,b])=>a-b)
        .map(([n,d])=>`<span class="${resultData.path.includes(n)?'hi':''}">${n}: ${fmtDist(d)}</span>`)
        .join(' | ');
    document.getElementById('scanInfo').innerHTML=
        `<b>Langkah ${idx+1}/${resultData.steps.length}</b>`+
        ` — Settle: <b style="color:#c084fc">${step.settled}</b><br>`+
        `Relaksasi: <b style="color:#60c8f8">${step.relaxed.length?step.relaxed.join(', '):'(tidak ada)'}</b><br>`+
        `<small style="line-height:1.9">${rows}</small>`;
}

// FASE 2 — HIGHLIGHT
function startHighlight(){
    currentPath=resultData.path; pathEdgeSet=buildPathEdgeSet(currentPath); render();
    document.getElementById('scanInfo').innerHTML=
        `<b style="color:#2ecc71">✅ Jalur ditemukan!</b><br>`+
        `<b>${currentPath.join(' → ')}</b><br>Total: <b>${fmtDist(resultData.distance)}</b>`;
    setTimeout(startDriving,1200);
}

// FASE 3 — DRIVE
function startDriving(){
    if(currentPath.length<2) return;
    
    // Get full waypoint path dari edge router (termasuk intermediate points)
    let waypoints = [];
    if (window._edgeRouter) {
        waypoints = window._edgeRouter.getPathWaypoints(currentPath);
    }
    
    // Fallback: jika router tidak tersedia, gunakan node positions
    if (!waypoints || waypoints.length === 0) {
        waypoints = currentPath.map(n => ({
            x: nodePositions[n][0],
            y: nodePositions[n][1]
        }));
    }
    
    driveSegment = 0;
    driveT = 0;
    showVehicle = true;
    vehiclePos = {...waypoints[0]};
    animPhase = 'driving';
    lastTime = performance.now();
    setStatus('🚗 Fase 3 — Kendaraan menuju ' + resultData.spbu + '...', '#FFD700');
    
    function driveLoop(now){
        if(animPhase !== 'driving') return;
        
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        
        // Current segment
        const p1 = waypoints[driveSegment];
        const p2 = waypoints[driveSegment + 1];
        
        // Distance untuk segment ini
        const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
        
        // Update progress along segment
        driveT += (DRIVE_SPD * dt) / segDist;
        
        // Move ke next segment jika selesai
        if(driveT >= 1){
            driveSegment++;
            driveT = 0;
            
            // Selesai?
            if(driveSegment >= waypoints.length - 1){
                vehiclePos = {...waypoints[waypoints.length - 1]};
                render();
                animPhase = 'idle';
                setStatus('🎉 Tiba di ' + resultData.spbu + '!', '#2ecc71');
                document.getElementById('scanInfo').innerHTML =
                    `<b style="color:#2ecc71">✅ Tiba di ${resultData.spbu}!</b><br>` +
                    `Jarak: <b>${fmtDist(resultData.distance)}</b><br>` +
                    `Jalur: ${currentPath.join(' → ')}`;
                return;
            }
        }
        
        // Interpolate position
        const cp1 = waypoints[driveSegment];
        const cp2 = waypoints[driveSegment + 1];
        vehiclePos = {
            x: cp1.x + (cp2.x - cp1.x) * driveT,
            y: cp1.y + (cp2.y - cp1.y) * driveT
        };
        
        render();
        animFrame = requestAnimationFrame(driveLoop);
    }
    
    animFrame = requestAnimationFrame(driveLoop);
}

// Events
document.getElementById('startNode').addEventListener('change',e=>{
    currentSource=e.target.value; computeRoute(); resetView();
    setStatus('📍 Lokasi awal: '+currentSource,'#94a3b8');
});
document.getElementById('btnRandomSrc').addEventListener('click',()=>{
    const ns=allNodes.filter(n=>!spbuList.includes(n));
    currentSource=ns[Math.floor(Math.random()*ns.length)];
    document.getElementById('startNode').value=currentSource;
    computeRoute(); resetView();
    setStatus('🎲 Diacak: '+currentSource,'#FFD700');
});
document.getElementById('btnRandomMap').addEventListener('click',()=>{
    stopAll(); randomizePositions(); updateStats(); computeRoute(); resetView();
    setStatus('🔀 Posisi & bobot diacak!','#FFD700');
});
document.getElementById('btnStart').addEventListener('click',()=>{
    SCAN_DELAY=parseInt(document.getElementById('speedSlider').value);
    computeRoute();
    if(!resultData||!resultData.spbu){setStatus('❌ Tidak ada rute.','#ff6b6b');return;}
    startScanning();
});
document.getElementById('speedSlider').addEventListener('input',e=>{
    SCAN_DELAY=parseInt(e.target.value);
    document.getElementById('speedLabel').textContent=e.target.value+' ms';
});

// Init
populateDropdown(); updateStats(); computeRoute(); render();
setStatus('⬅️ Pilih lokasi awal lalu tekan Mulai Simulasi','#94a3b8');
document.getElementById('scanInfo').innerHTML=
    '<em>Tekan <b>Mulai Simulasi</b> untuk menjalankan visualisasi Dijkstra.</em>';
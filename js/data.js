// ============================================================
// data.js  —  Graf Peta UMRAH & Sekitarnya (Tanjungpinang)

// Node   : 18  (15 lokasi + 3 SPBU)
// Edge   : 33  (undirected, bobot dalam METER)

const CANVAS_W = 1100;
const CANVAS_H = 680;
const NODE_R   = 14;

const allNodes = [
    'UMRAH', 'Masjid Bahrul Ulum', 'FTTK', 'FIKP', 'UPA TIK',
    'Bengkel Surya Motor', 'Puskesmas Kampung Bugis',
    'Taman Budaya Raja Ali Haji',
    'RSUP Raja Ahmad Tabib', 'Klinik Mata SMEC',
    'Polresta Tanjungpinang', 'KODIM 0315', 'Hotel Halim',
    'Hotel CK', 'Morning Bakery',
    'SPBU Batu 7', 'SPBU Batu 8 Atas', 'SPBU RSUP',
];

const spbuList = ['SPBU Batu 7', 'SPBU Batu 8 Atas', 'SPBU RSUP'];

const nodeZone = {
    'UMRAH':                      'gerbang',
    'Masjid Bahrul Ulum':         'kampus',
    'FTTK':                       'kampus',
    'FIKP':                       'kampus',
    'UPA TIK':                    'kampus',
    'Bengkel Surya Motor':        'kota',
    'Puskesmas Kampung Bugis':    'kota',
    'Taman Budaya Raja Ali Haji': 'kota',
    'RSUP Raja Ahmad Tabib':      'kota',
    'Klinik Mata SMEC':           'kota',
    'Polresta Tanjungpinang':     'batu',
    'KODIM 0315':                 'batu',
    'Hotel Halim':                'batu',
    'Hotel CK':                   'batu',
    'Morning Bakery':             'batu',
    'SPBU Batu 7':                'spbu',
    'SPBU Batu 8 Atas':          'spbu',
    'SPBU RSUP':                  'spbu',
};

// ── EDGE LIST BERSIH ─────────────────────────────────────────
// Bobot tetap dari data nyata.
const EDGE_LIST = [
    // ── Dalam Kampus ──
    ['UMRAH',                      'Masjid Bahrul Ulum',          120],
    ['Masjid Bahrul Ulum',         'FTTK',                        110],
    ['Masjid Bahrul Ulum',         'FIKP',                        180],
    ['Masjid Bahrul Ulum',         'UPA TIK',                     220],
    ['FTTK',                       'FIKP',                        110],
    ['FTTK',                       'UPA TIK',                     120],
    ['FIKP',                       'UPA TIK',                     450],

    // ── UMRAH → Kota (node tetangga, tidak jauh) ──
    ['UMRAH',                      'Bengkel Surya Motor',         1400],
    ['UMRAH',                      'Puskesmas Kampung Bugis',     1200],
    ['UMRAH',                      'Taman Budaya Raja Ali Haji',  1300],
    ['UMRAH',                      'RSUP Raja Ahmad Tabib',       10000],

    // ── Antar Kota (lokal) ──
    ['Bengkel Surya Motor',        'RSUP Raja Ahmad Tabib',       8600],
    ['Bengkel Surya Motor',        'SPBU RSUP',                   9800],
    ['Puskesmas Kampung Bugis',    'Taman Budaya Raja Ali Haji',  900],
    ['Puskesmas Kampung Bugis',    'RSUP Raja Ahmad Tabib',       9500],
    ['Taman Budaya Raja Ali Haji', 'RSUP Raja Ahmad Tabib',       9600],

    // ── RSUP → Kawasan Batu (node tetangga) ──
    ['RSUP Raja Ahmad Tabib',      'SPBU RSUP',                   500],
    ['RSUP Raja Ahmad Tabib',      'Klinik Mata SMEC',            2800],
    ['RSUP Raja Ahmad Tabib',      'Hotel Halim',                 1200],
    ['RSUP Raja Ahmad Tabib',      'Polresta Tanjungpinang',      1800],
    ['RSUP Raja Ahmad Tabib',      'SPBU Batu 7',                 2400],
    ['RSUP Raja Ahmad Tabib',      'SPBU Batu 8 Atas',            2800],

    ['Klinik Mata SMEC',           'Hotel Halim',                 1800],
    ['Klinik Mata SMEC',           'SPBU RSUP',                   2800],
    ['Polresta Tanjungpinang',     'KODIM 0315',                  600],
    ['KODIM 0315',                 'Hotel Halim',                 850],
    ['Hotel Halim',                'Hotel CK',                    900],
    ['Hotel CK',                   'Morning Bakery',              1100],

    ['Hotel Halim',                'SPBU Batu 7',                 700],
    ['KODIM 0315',                 'SPBU Batu 7',                 650],
    ['Polresta Tanjungpinang',     'SPBU Batu 7',                 1400],
    ['Hotel CK',                   'SPBU Batu 8 Atas',            550],
    ['Morning Bakery',             'SPBU Batu 8 Atas',            1600],
];

function buildGraph() {
    const g = {};
    for (const n of allNodes) g[n] = [];
    for (const [a, b, w] of EDGE_LIST) {
        if (!g[a].find(x => x[0] === b)) g[a].push([b, w]);
        if (!g[b].find(x => x[0] === a)) g[b].push([a, w]);
    }
    return g;
}
let graph = buildGraph();

function fmtDist(m) {
    return m >= 1000 ? (m/1000).toFixed(1)+' km' : m+' m';
}

// ── POSISI DEFAULT ────────────────────────────────────────────

const defaultPositions = {
    // Kampus (kiri)
    'FTTK':                        [145, 145],
    'Masjid Bahrul Ulum':          [220, 270],
    'FIKP':                        [100, 340],
    'UPA TIK':                     [310, 350],
    'UMRAH':                       [135, 480],

    // Kota Barat (tengah-kiri)
    'Bengkel Surya Motor':         [440, 120],
    'Puskesmas Kampung Bugis':     [410, 310],
    'Taman Budaya Raja Ali Haji':  [400, 470],

    // RSUP & Klinik (tengah)
    'Klinik Mata SMEC':            [590, 195],
    'RSUP Raja Ahmad Tabib':       [590, 390],

    'Polresta Tanjungpinang':      [720, 310],
    'KODIM 0315':                  [800, 215],
    'Hotel Halim':                 [875, 310],
    'Hotel CK':                    [935, 185],
    'Morning Bakery':              [970, 420],

    // SPBU (kanan)
    'SPBU Batu 7':                 [975, 310],
    'SPBU Batu 8 Atas':           [1010, 110],
    'SPBU RSUP':                   [730, 490],
};

let nodePositions = {};
function resetToDefault() {
    for (const k in defaultPositions)
        nodePositions[k] = [...defaultPositions[k]];
}
resetToDefault();

// ── ACAK POSISI + BOBOT BARU ──────────────────────────────────
// Saat posisi diacak, bobot juga diacak (proporsional terhadap
// jarak pixel antar node × skala) agar tampilan tetap konsisten.
const MIN_DIST = 90;
function randInt(a, b) { return Math.floor(Math.random()*(b-a+1))+a; }

const ZONE_BOUNDS = {
    gerbang: { xMin:  60, xMax: 250, yMin: 60, yMax: 620 },
    kampus:  { xMin:  60, xMax: 370, yMin: 60, yMax: 620 },
    kota:    { xMin: 360, xMax: 640, yMin: 60, yMax: 620 },
    batu:    { xMin: 640, xMax: 995, yMin: 60, yMax: 620 },
    spbu:    { xMin: 700, xMax: 1040, yMin: 60, yMax: 620 },
};

// Skala pixel → meter: pada layout default,
// 1 pixel ≈ 16 meter (kampus), 120 meter (kota-antar)
const PX_PER_M_LOCAL  = 0.07;   // dalam kampus & kawasan lokal
const PX_PER_M_CITY   = 0.045;  // antar kota

function randomizePositions() {
    randomizePositionsOptimized();
}
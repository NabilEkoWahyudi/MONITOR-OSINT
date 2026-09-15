const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Allowed CORS origins ───────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173', // vite preview
  'http://localhost:3001',
];
if (process.env.CORS_ORIGIN) {
  ALLOWED_ORIGINS.push(...process.env.CORS_ORIGIN.split(','));
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// ─── Simple Rate Limiter (in-memory) ────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 120; // max requests per window per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { start: now, count: 0 };
    rateLimitMap.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }
  next();
}

// Clean up rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(ip);
  }
}, 300000);

// Apply rate limit to API routes
app.use('/api', rateLimit);

// ─── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ─── Simple In-Memory Cache ─────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds default cache to prevent rate-limiting

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < item.ttl) {
    return item.data;
  }
  return null;
}

function setCached(key, data, ttl = CACHE_TTL_MS) {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// ─── Generic CORS Proxy ─────────────────────────────────────────────
// GET /api/proxy?url=<encoded_url>
app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });

  // Whitelist of allowed domains for security
  const ALLOWED_DOMAINS = [
    'opensky-network.org',
    'earthquake.usgs.gov',
    'api.wheretheiss.at',
    'celestrak.org',
    'tle.ivanstanojevic.me',
    'api.rainviewer.com',
    'eonet.gsfc.nasa.gov',
    'api.worldbank.org',
    'api.gdeltproject.org',
    'nominatim.openstreetmap.org',
    'overpass-api.de',
    'api.planespotters.net',
    'api.rss2json.com',
    'rsshub.app',
    'feeds.bbci.co.uk',
    'feeds.reuters.com',
    'www.aljazeera.com',
    'rss.dw.com',
    'feeds.france24.com',
    'www.voanews.com',
    'en.wikipedia.org',
    'www.submarinecablemap.com',  // TeleGeography cable routes
    'www.cisa.gov',               // CISA KEV feed
  ];


  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const allowed = ALLOWED_DOMAINS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d));
  if (!allowed) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  // Check cache first
  const cachedResponse = getCached(url);
  if (cachedResponse) {
    return res.status(200).send(cachedResponse);
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MONITOR-OSINT/28 (Educational Research Tool)',
        'Accept': 'application/json, text/xml, text/plain, */*',
      },
      timeout: 10000,
    });

    // Only cache successful responses
    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).send(body);
    }

    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();

    // If XML, try to parse to JSON
    if (contentType.includes('xml') || body.trim().startsWith('<')) {
      try {
        const result = await xml2js.parseStringPromise(body, { explicitArray: false });
        setCached(url, result);
        return res.json(result);
      } catch {
        setCached(url, body);
        return res.set('Content-Type', 'text/xml').send(body);
      }
    }

    // Try JSON parse
    try {
      const parsed = JSON.parse(body);
      setCached(url, parsed);
      return res.json(parsed);
    } catch {
      setCached(url, body);
      return res.set('Content-Type', contentType).send(body);
    }
  } catch (e) {
    console.error('[proxy error]', url, e.message);
    res.status(502).json({ error: e.message });
  }
});

// ─── RSS Aggregator ─────────────────────────────────────────────────
// POST /api/rss  body: { sources: [{url, label, cls}] }
app.post('/api/rss', async (req, res) => {
  const { sources } = req.body;
  if (!Array.isArray(sources)) return res.status(400).json({ error: 'sources must be array' });

  const results = await Promise.allSettled(sources.map(async (src) => {
    // Use rss2json.com as bridge (no XML parsing needed)
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.url)}`;
    const r = await fetch(apiUrl, { timeout: 8000 });
    const data = await r.json();
    if (!data.items) return [];
    return data.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link || item.url || '#',
      pubDate: item.pubDate || '',
      source: src.label,
      cls: src.cls || 'source-ap',
    }));
  }));

  const allItems = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Sort by date descending
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Deduplicate by title prefix
  const seen = new Set();
  const unique = allItems.filter(i => {
    const k = i.title.substring(0, 30).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  res.json({ items: unique });
});

// ─── TLE Fetch ──────────────────────────────────────────────────────
app.get('/api/tle/:norad', async (req, res) => {
  const { norad } = req.params;
  if (!/^\d+$/.test(norad)) return res.status(400).json({ error: 'Invalid NORAD ID' });
  try {
    const r = await fetch(`https://tle.ivanstanojevic.me/api/tle/${norad}`, { timeout: 8000 });
    const data = await r.json();
    if (data && data.line1 && data.line2) {
      return res.json({ tle1: data.line1, tle2: data.line2, name: data.name });
    }
    res.status(404).json({ error: 'TLE not found' });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ─── Multi-Satellite Positions (server-side SGP4 via satellite.js) ──
const satLib = require('satellite.js');

// Cache TLE data 30 minutes (TLE changes slowly)
const tleCacheTTL = 30 * 60 * 1000;

async function getTLE(norad) {
  const key = 'tle_' + norad;
  const cached = getCached(key);
  if (cached) return cached;
  try {
    const r = await fetch(`https://tle.ivanstanojevic.me/api/tle/${norad}`, { timeout: 8000 });
    const d = await r.json();
    if (d && d.line1 && d.line2) {
      const tle = { line1: d.line1, line2: d.line2, name: d.name };
      setCached(key, tle, tleCacheTTL);
      return tle;
    }
  } catch (_) {}
  return null;
}

// GET /api/positions?ids=25544,20580,43013,...
app.get('/api/positions', async (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'Missing ids param' });

  const noradList = ids.split(',').filter(id => /^\d+$/.test(id)).slice(0, 12);
  const results = {};

  await Promise.allSettled(noradList.map(async (norad) => {
    const tle = await getTLE(norad);
    if (!tle) return;
    try {
      const satrec = satLib.twoline2satrec(tle.line1, tle.line2);
      const now = new Date();
      const pv = satLib.propagate(satrec, now);
      if (!pv.position || typeof pv.position.x !== 'number') return;
      const gmst = satLib.gstime(now);
      const geo = satLib.eciToGeodetic(pv.position, gmst);
      const vel = pv.velocity
        ? Math.sqrt(pv.velocity.x**2 + pv.velocity.y**2 + pv.velocity.z**2) * 3600 // km/s → km/h
        : null;
      results[norad] = {
        lat:  satLib.degreesLat(geo.latitude),
        lng:  satLib.degreesLong(geo.longitude),
        alt:  Math.round(geo.height * 10) / 10,  // km, 1 decimal
        vel:  vel ? Math.round(vel) : null,        // km/h
        name: tle.name,
      };
    } catch (_) {}
  }));

  res.json(results);
});


// ─── Socket.io & Blockchain Ledger ──────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

const LEDGER_FILE = path.join(__dirname, 'ledger.json');
let ledger = [];
let previousHash = 'GENESIS_BLOCK_' + '0'.repeat(50);

// Load existing ledger if available
if (fs.existsSync(LEDGER_FILE)) {
  try {
    ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
    if (ledger.length > 0) {
      previousHash = ledger[ledger.length - 1].hash;
    }
  } catch (e) {
    console.error('Error loading ledger:', e.message);
  }
}

function persistLedger() {
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
}

io.on('connection', (socket) => {
  console.log(`[socket] Client connected: ${socket.id}`);
  socket.emit('ledger:init', ledger); // sync to new client

  socket.on('msg:send', ({ text, from }) => {
    // Generate authoritative server-side hash
    const hash = crypto.createHash('sha256').update(text.trim() + previousHash).digest('hex');
    const block = {
      block: ledger.length + 1,
      from,
      text: text.trim(),
      time: new Date().toUTCString().substring(17, 22),
      hash,
      prevHash: previousHash,
    };
    
    ledger.push(block);
    previousHash = hash;
    persistLedger();
    
    io.emit('msg:new', block);
  });
});

// ─── Start Server ───────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 MONITOR Backend running at http://localhost:${PORT}`);
  console.log(`   CORS: http://localhost:5173`);
  console.log(`   Endpoints:`);
  console.log(`     GET  /api/health`);
  console.log(`     GET  /api/proxy?url=<encoded>`);
  console.log(`     POST /api/rss`);
  console.log(`     GET  /api/tle/:norad`);
  console.log(`   Socket.io Enabled\n`);
});

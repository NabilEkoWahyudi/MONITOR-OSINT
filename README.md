# MONITOR OSINT 

> **Global Intelligence Dashboard** — Real-time situational awareness platform untuk monitoring konflik dunia, penerbangan, fasilitas nuklir, satelit, ekonomi makro, dan intelijen geospasial.

![Stack](https://img.shields.io/badge/Vue-3.4-42b883?style=flat-square&logo=vue.js) ![Stack](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js) ![Stack](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet) ![Stack](https://img.shields.io/badge/Socket.io-4.8-black?style=flat-square&logo=socket.io) ![Stack](https://img.shields.io/badge/Pinia-2.1-f7d336?style=flat-square)

---

## 📡 Deskripsi

MONITOR OSINT adalah dashboard intelijen sumber terbuka berbasis web yang menggabungkan berbagai feed data publik ke dalam satu antarmuka real-time. Dibangun dengan arsitektur **Vue 3 (frontend) + Node.js/Express (backend)** setelah migrasi dari single-file HTML monolitik 292KB.

Aplikasi ini dirancang untuk kalangan peneliti, jurnalis, dan analis geopolitik yang membutuhkan gambaran situasi global secara langsung dari sumber-sumber terbuka (OSINT).

---

## ✨ Fitur Utama

### 🗺️ Peta Interaktif (Leaflet)
- **Zona Konflik Aktif** — Overlay conflict zones dengan tingkat ancaman (CRITICAL / HIGH / ELEVATED)
- **Intel Hotspots** — Titik-titik ketegangan geopolitik global
- **Aviation Tracking (ADS-B)** — Pesawat live via OpenSky Network dengan heading & altitude
- **Fasilitas Nuklir** — Senjata nuklir & reaktor nuklir global
- **Pangkalan Militer** — Major military bases dari berbagai negara
- **Global Peace Index (GPI) 2025** — Peta perdamaian per-negara dengan data World Bank
- **Earthquake Monitor** — Gempa bumi real-time via USGS ≥ M4.5
- **Satellite Tracker** — ISS, Hubble, NOAA-20, dan lainnya via TLE
- **EONET Hazards** — Natural hazards via NASA Earth Observatory
- **GDELT Protests** — Protes & demonstrasi global via GDELT
- **Undersea Cables** — Peta kabel bawah laut global
- **Weather Satellite** — Infrared satellite imagery via RainViewer API

### 📊 Panel Intelijen
| Panel | Keterangan |
|---|---|
| **DEFCON Widget** | Indikator level kesiapan nuklir |
| **LiveMetrics** | Statistik real-time (quake count, conflict count, sparklines) |
| **Incident Feed** | Ringkasan zona konflik & hotspot aktif |
| **GPI Dashboard** | Ranking perdamaian global interaktif |
| **Callsign Tracker** | Lacak callsign penerbangan spesifik via ADS-B |
| **Region Quick Fly** | Navigasi cepat ke region di peta |
| **Geo Search** | Cari lokasi via Nominatim (OpenStreetMap) |
| **Layers Control** | Toggle semua layer peta |

### 💹 Ekonomi
- **World Bank Macro** — GDP, populasi, trade, CO2 global
- **National Target** — Data makroekonomi per-negara saat klik marker GPI
- **Economic Dashboard** — Modal full-screen dengan tab Global / Regional / National

### 🌐 Media Hub
- **Live Streams** — 27+ channel berita internasional langsung di browser (CNN, Al Jazeera, DW, Kompas TV, dll.)
- **Live Webcams** — 40+ webcam 24/7 dari seluruh dunia (Tokyo, Gaza, Makkah, ISS, dll.)
- **OSINT Chat** — Secure multi-user real-time chat dengan blockchain-inspired hash ledger via Socket.io

### 🔒 Keamanan & Stabilitas
- CORS proxy backend untuk melewati CORS restriction API eksternal
- Domain whitelist dengan SSRF protection
- Rate limiting 120 req/menit per IP
- Socket cleanup & memory leak prevention
- Global error boundary (tidak ada white screen crash)
- XSS sanitasi untuk semua data dari API eksternal

---

## 🏗️ Arsitektur

```
monitor/
├── frontend/                    # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── App.vue              # Root layout & global state
│   │   ├── main.js              # Entry point
│   │   ├── style.css            # Global design system (1900+ baris)
│   │   ├── components/
│   │   │   ├── layout/          # NewsTicker, LeftPanel, RightPanel, CoordBar, ApiStatusBar
│   │   │   ├── map/             # MapView, CyberCanvas, MapControls
│   │   │   ├── dashboard/       # GeoSearch, LayersControl, SatelliteTracker,
│   │   │   │                    #   CallsignTracker, GpiDashboard, LiveMetrics, dll.
│   │   │   └── panels/          # IntelFeed, IntelDisplay, EconPanel, EconModal,
│   │   │                        #   MarketPanel, ChatPanel, MediaHub
│   │   ├── composables/
│   │   │   ├── useMap.js        # Core map logic, layer management, API fetching
│   │   │   ├── useChat.js       # Socket.io chat + blockchain ledger
│   │   │   └── useAudio.js      # Web Audio API beep sounds
│   │   ├── stores/
│   │   │   ├── mapStore.js      # Map instance, visibility flags, UI state (Pinia)
│   │   │   ├── intelStore.js    # Intel feed, ticker, quake/conflict counts
│   │   │   └── econStore.js     # World Bank data, country selection
│   │   └── data/
│   │       ├── conflictZones.js # Zona konflik & intel hotspots
│   │       ├── nuclearFacilities.js
│   │       ├── militaryBases.js
│   │       ├── gpiData.js       # GPI 2025 rankings
│   │       └── satConfig.js     # NORAD IDs satelit
│   ├── index.html
│   ├── vite.config.js
│   └── .env                     # Environment variables (lihat bagian Konfigurasi)
│
└── backend/                     # Node.js + Express proxy server
    ├── server.js                # API proxy, RSS aggregator, Socket.io, ledger
    ├── ledger.json              # Chat blockchain ledger (auto-generated)
    └── package.json
```

---

## 🚀 Cara Menjalankan

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 1. Clone & Install

```bash
# Install backend dependencies
cd monitor/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Jalankan Backend

```bash
cd monitor/backend
npm start           # Production
# atau
npm run dev         # Development (nodemon auto-reload)
```

Backend berjalan di `http://localhost:3001`

### 3. Jalankan Frontend

```bash
cd monitor/frontend
npm run dev
```

Frontend berjalan di `http://localhost:5173`

> ⚠️ **Penting:** Backend **harus** berjalan sebelum frontend agar proxy API dan chat WebSocket berfungsi.

### 4. Build Production

```bash
cd monitor/frontend
npm run build
# Output di: frontend/dist/
```

---

## ⚙️ Konfigurasi

Salin dan sesuaikan file `.env` di dalam folder `frontend/`:

```env
# frontend/.env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

Untuk production deployment dengan domain custom:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com
```

Backend juga membaca `CORS_ORIGIN` untuk mengizinkan origin tambahan:

```env
# backend/.env (optional)
PORT=3001
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🌐 API yang Digunakan

Semua API eksternal diakses **melalui backend proxy** untuk menghindari CORS restriction.

| API | Data | Endpoint |
|---|---|---|
| [OpenSky Network](https://opensky-network.org/) | Live aviation ADS-B | `opensky-network.org/api/states/all` |
| [USGS Earthquake](https://earthquake.usgs.gov/) | Gempa bumi real-time | `earthquake.usgs.gov/earthquakes/feed` |
| [NASA EONET](https://eonet.gsfc.nasa.gov/) | Natural hazards | `eonet.gsfc.nasa.gov/api/v3/events` |
| [NASA DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) | Space weather | `kauai.ccmc.gsfc.nasa.gov/DONKI` |
| [World Bank](https://data.worldbank.org/) | Ekonomi makro global | `api.worldbank.org/v2/country` |
| [RainViewer](https://www.rainviewer.com/api.html) | Weather satellite | `api.rainviewer.com/public` |
| [wheretheiss.at](https://wheretheiss.at/) | Posisi ISS real-time | `api.wheretheiss.at/v1/satellites/25544` |
| [TLE API](https://tle.ivanstanojevic.me/) | TLE data satelit | `tle.ivanstanojevic.me/api/tle` |
| [Nominatim OSM](https://nominatim.openstreetmap.org/) | Geocoding / Geo search | `nominatim.openstreetmap.org/search` |
| [GDELT](https://api.gdeltproject.org/) | Protes & events global | `api.gdeltproject.org/api/v2/geo` |
| [rss2json](https://rss2json.com/) | RSS feed aggregator | `api.rss2json.com/v1/api.json` |

---

## 🛠️ Tech Stack

### Frontend
| Package | Versi | Kegunaan |
|---|---|---|
| Vue | 3.4 | Reactive UI framework |
| Pinia | 2.1 | State management |
| Leaflet | 1.9 | Interactive map |
| Socket.io-client | 4.8 | Real-time WebSocket chat |
| Vite | 5.0 | Build tool & dev server |

### Backend
| Package | Versi | Kegunaan |
|---|---|---|
| Express | 4.18 | HTTP server & routing |
| Socket.io | 4.8 | WebSocket server |
| node-fetch | 2.7 | HTTP client untuk proxy |
| xml2js | 0.6 | RSS/XML parsing |
| cors | 2.8 | CORS header management |
| dotenv | 16.3 | Environment variable loading |
| nodemon | 3.0 | Dev auto-reload |

---

## 🔒 Keamanan

- **SSRF Protection** — Domain whitelist dengan validasi `hostname === d || hostname.endsWith('.' + d)` mencegah subdomain bypass
- **Rate Limiting** — 120 request per menit per IP pada semua `/api/*` endpoints
- **CORS Restricted** — Backend hanya menerima request dari origin yang diizinkan
- **XSS Prevention** — Semua data API di-escape sebelum dirender via `v-html`
- **Socket.io Auth** — CORS origin restriction pada WebSocket server
- **Secure Context** — Chain verification hash menggunakan `crypto.subtle` (Web Crypto API)
- **Cache Policy** — Hanya response HTTP 2xx yang di-cache (TTL 15 detik)

---

## 📱 Kompatibilitas Browser & Device

| Browser | Status |
|---|---|
| Chrome / Edge (latest) | ✅ Full support |
| Firefox (latest) | ✅ Full support |
| Safari 16+ | ✅ Full support |
| Safari < 16 | ⚠️ Webkit backdrop-filter terbatas |
| Mobile Chrome | ✅ Responsive layout (≤768px) |
| Mobile Safari | ✅ Touch targets 36px min |

**Responsive Breakpoints:**
- `≥ 1280px` — Desktop full layout (dual panel + map)
- `≤ 1280px` — Panel dipersempit ke 280px
- `≤ 1024px` — Right panel disembunyikan, map melebar
- `≤ 768px` — Layout vertikal stacked, CRT overlay dinonaktifkan
- `≤ 480px` — Font & spacing mobile-optimized

**Aksesibilitas:** Mendukung `prefers-reduced-motion` — semua animasi dinonaktifkan jika user memilih reduced motion di sistem operasi.

---

## 📁 Struktur Data Statis

Data geospasial disimpan sebagai module JavaScript di `frontend/src/data/`:

| File | Isi |
|---|---|
| `conflictZones.js` | 8 zona konflik aktif + 8 intel hotspot global |
| `nuclearFacilities.js` | Fasilitas nuklir & senjata nuklir per-negara |
| `militaryBases.js` | Pangkalan militer mayor global |
| `gpiData.js` | Global Peace Index 2025, ranking 163 negara |
| `satConfig.js` | Konfigurasi satelit (NORAD ID, nama, warna) |

---

## 💬 OSINT Chat — Blockchain Ledger

Fitur chat menggunakan arsitektur **Server-Authoritative Blockchain**:

1. Setiap pesan yang dikirim menjadi sebuah **block** dengan SHA-256 hash
2. Setiap block menyimpan `prevHash` dari block sebelumnya
3. Server menyimpan ledger ke `backend/ledger.json`
4. Client dapat memverifikasi integritas rantai via **⛓️ AUDIT LEDGER**
5. Jika ada block yang dimanipulasi, status berubah menjadi `⚠️ Tampered at block N`

---

## 📺 Media Hub

Media Hub menyediakan akses ke:
- **27+ Live News Streams** — Dari 8 region: Americas, Europe, Asia, MENA, Africa, Oceania, Space
- **40+ Live Webcams** — Kota-kota besar, landmark, alam, dan ISS Earth view
- Semua stream di-load **on-demand** (klik untuk load) untuk menghemat bandwidth

> ⚠️ Beberapa stream mungkin memerlukan VPN jika diakses dari wilayah tertentu.

---

## 🤝 Kontribusi

Pull request, issue report, dan saran sangat disambut. Beberapa area yang bisa dikembangkan:

- Integrasi API market data real-time (commodities, indices)
- Time filter untuk layer earthquake & GDELT
- Dedikasi Vue component untuk menggantikan inline HTML di `useMap.js`
- Nginx/Caddy reverse proxy config untuk production deployment

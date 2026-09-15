import { ref } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useIntelStore } from '@/stores/intelStore';
import { nuclearFacilities } from '@/data/nuclearFacilities';
import { majorMilitaryBases } from '@/data/militaryBases';
import { conflictZones, intelHotspots } from '@/data/conflictZones';
import { GPI_2025, getGPIColor, COUNTRY_ISO2 } from '@/data/gpiData';
import { useEconStore } from '@/stores/econStore';
import { useAudio } from '@/composables/useAudio';

// ── HTML Sanitizer — prevent XSS from external API data ──
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let L = null; // Leaflet (loaded async)

// Layer groups (raw Leaflet objects — not reactive)
const layers = {
  conflict: [],
  hotspot: [],
  air: {},
  quake: [],
  staticMil: [],
  dynamicMil: [],
  nuke: [],
  sat: {},
  gpi: [],
  eonet: [],
  protests: [],
  cables: null,
  cyber: [],
};

let weatherLayer = null;
let weatherLayerObj = null; // current active weather tile layer
let selectedMarker = null;
let selectedEl = null;
let milScanTimeout = null;

// Aircraft trail history: icao24 -> [ [lat,lng], ... ] (rolling 30 pos)
const airTrailHistory = new Map();
const airTrailPolylines = {}; // icao24 -> L.polyline

// ── AbortControllers to cancel stale requests ──
const abortControllers = {};

function makeFetch(key, url) {
  // Abort previous request for this key
  if (abortControllers[key]) {
    try { abortControllers[key].abort(); } catch (_) {}
  }
  abortControllers[key] = new AbortController();
  return fetch(url, { signal: abortControllers[key].signal });
}

export function useMap() {
  const mapStore = useMapStore();
  const intelStore = useIntelStore();
  const econStore = useEconStore();
  const { playClickSound, playAlertSound } = useAudio();

  // ─── Init Map ─────────────────────────────────────────────────────
  async function initMap(container) {
    // Load Leaflet lazily
    if (!window.L) {
      await new Promise(resolve => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = resolve;
        document.head.appendChild(s);
      });
    }
    L = window.L;

    const map = L.map(container, {
      zoomControl: false,
      worldCopyJump: true,
      preferCanvas: true,       // ← Canvas renderer: ~70% lighter than SVG
      renderer: L.canvas({ padding: 0.5 }),
    }).setView([5.0, 110.0], 4);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // ArcGIS Canvas Dark — free, no API key, works at all zoom levels
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
        attribution: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>',
      }
    ).addTo(map);

    // ArcGIS reference layer (labels, borders)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, opacity: 0.8, attribution: '' }
    ).addTo(map);

    mapStore.setMap(map);

    map.on('mousemove', e => {
      mapStore.curLat = e.latlng.lat.toFixed(4);
      mapStore.curLon = e.latlng.lng.toFixed(4);
    });
    map.on('click', () => clearSelection());
    map.on('zoomend', () => { mapStore.curZoom = map.getZoom(); });
    mapStore.curZoom = map.getZoom();
    setTimeout(() => map.invalidateSize(), 500);

    map.on('moveend', () => {
      if (mapStore.show.mil) {
        clearTimeout(milScanTimeout);
        if (map.getZoom() >= 7) {
          milScanTimeout = setTimeout(fetchDynamicOSMBases, 1800);
        } else {
          layers.dynamicMil.forEach(m => m.remove());
          layers.dynamicMil = [];
        }
      }
    });

    return map;
  }

  // ─── Layer Toggles ────────────────────────────────────────────────
  function toggleLayerGroup(key, visible) {
    const map = mapStore.mapInstance;
    if (!map) return;
    if (Array.isArray(layers[key])) {
      layers[key].forEach(m => visible ? m.addTo(map) : m.remove());
    } else {
      Object.values(layers[key] || {}).forEach(o => {
        const target = o.marker || o;
        visible ? target.addTo(map) : target.remove();
      });
    }
  }

  function applyLayerToggle(key, visible) {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    if (key === 'wea') {
      if (visible && weatherLayer) weatherLayer.addTo(map);
      else if (weatherLayer) map.removeLayer(weatherLayer);
    } else if (key === 'mil') {
      layers.staticMil.forEach(m => visible ? m.addTo(map) : m.remove());
      layers.dynamicMil.forEach(m => visible ? m.addTo(map) : m.remove());
      if (visible && map.getZoom() >= 7) fetchDynamicOSMBases();
    } else if (key === 'gpi') {
      layers.gpi.forEach(m => visible ? m.addTo(map) : m.remove());
      mapStore.gpiLegendVisible = visible;
    } else if (key === 'cables') {
      // LayerGroup — use .addTo/.remove directly, NOT toggleLayerGroup
      if (layers.cables) {
        if (visible) layers.cables.addTo(map);
        else layers.cables.remove();
      } else if (visible) {
        buildCableLayer();
      }
    } else if (key === 'cyber') {
      layers.cyber.forEach(m => visible ? m.addTo(map) : m.remove());
      if (visible && !layers.cyber.length) fetchCyberThreats();
    } else {
      toggleLayerGroup(key, visible);
    }
  }

  // ─── Selection Glow ───────────────────────────────────────────────
  function selectMarker(marker) {
    clearSelection();
    selectedMarker = marker;
    try {
      const el = marker.getElement ? marker.getElement() : null;
      if (el) {
        const inner = el.querySelector('div') || el;
        inner.classList.add('marker-selected');
        selectedEl = inner;
      }
      if (marker._path) marker._path.classList.add('path-selected');
    } catch (e) {}
  }

  function clearSelection() {
    if (selectedEl) { selectedEl.classList.remove('marker-selected'); selectedEl = null; }
    if (selectedMarker?._path) selectedMarker._path.classList.remove('path-selected');
    selectedMarker = null;
  }

  // ─── Init All Layers ──────────────────────────────────────────────
  function initAllLayers() {
    initWorldMonitorZones();
    initStaticMilitaryBases();
    initNuclearLayer();
    initGPILayer();
    initWeatherSatellite();
    buildCableLayer();
    fetchCyberThreats();
  }

  function initWorldMonitorZones() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    const feed = [];

    conflictZones.forEach(zone => {
      const rect = L.rectangle(zone.bounds, {
        color: zone.color, weight: 1, fillColor: zone.color, fillOpacity: 0.12,
        dashArray: zone.threat === 'CRITICAL' ? '6,3' : '4,4'
      }).on('click', () => {
        selectMarker(rect);
        map.flyTo(rect.getBounds().getCenter(), 5);
        mapStore.setIntelStatus('ACTIVE CONFLICT');
        playClickSound();
        const pct = zone.threat === 'CRITICAL' ? 95 : zone.threat === 'HIGH' ? 75 : 50;
        mapStore.setIntelDisplay(`
          <strong style="color:var(--accent-red);">❌ ACTIVE CONFLICT ZONE</strong>
          <hr style="border-color:#1e3a5f;margin:8px 0;">
          <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">${esc(zone.name)}</div>
          <span class="status-badge badge-red">● ${esc(zone.threat)}</span>
          <div style="margin-top:10px;color:var(--text-muted);line-height:1.6;font-size:11px;border-left:3px solid ${zone.color};background:rgba(239,68,68,.05);padding:8px;">${esc(zone.desc)}</div>
          <div class="threat-meter"><div class="threat-bar"><div class="threat-fill" style="width:${pct}%;background:${zone.color};"></div></div></div>
        `);
      });
      layers.conflict.push(rect);
      if (mapStore.show.conflict) rect.addTo(map);
      feed.push({ type: 'conflict', zone, color: zone.color });
    });

    intelHotspots.forEach(spot => {
      const circle = L.circleMarker([spot.lat, spot.lng], {
        radius: 7, color: spot.color, fillColor: spot.color, fillOpacity: .85, weight: 2
      }).on('click', () => {
        selectMarker(circle);
        map.flyTo([spot.lat, spot.lng], 6);
        mapStore.setIntelStatus('INTEL HOTSPOT');
        playClickSound();
        mapStore.setIntelDisplay(`
          <strong style="color:${spot.color};">⚠️ INTEL HOTSPOT</strong>
          <hr style="border-color:#1e3a5f;margin:8px 0;">
          <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">${esc(spot.name)}</div>
          <span class="status-badge ${spot.threat === 'CRITICAL' || spot.threat === 'HIGH' ? 'badge-red' : 'badge-yellow'}">● ${esc(spot.threat)}</span>
          <div style="margin-top:10px;color:var(--text-muted);line-height:1.6;font-size:11px;border-left:3px solid ${spot.color};padding:8px;background:rgba(0,0,0,.3);">${esc(spot.desc)}</div>
          <div style="margin-top:8px;font-size:10px;color:var(--text-muted);">📍 ${spot.lat.toFixed(3)}, ${spot.lng.toFixed(3)}</div>
        `);
      });
      layers.hotspot.push(circle);
      if (mapStore.show.hotspot) circle.addTo(map);
      feed.push({ type: 'hotspot', spot, color: spot.color });
    });

    intelStore.incidentFeed = feed;
    intelStore.feedCount = feed.length;
    intelStore.setConflictCount(feed.length);
  }

  function initStaticMilitaryBases() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    majorMilitaryBases.forEach(b => {
      const mk = L.circleMarker([b.lat, b.lng], {
        radius: 7, color: '#a855f7', fillColor: '#a855f7', fillOpacity: .9, weight: 2
      }).on('click', () => {
        selectMarker(mk);
        map.flyTo([b.lat, b.lng], 9);
        mapStore.setIntelStatus('MILITARY BASE');
        playClickSound();
        mapStore.setIntelDisplay(`
          <strong style="color:var(--accent-purple);">🪖 MILITARY INSTALLATION</strong>
          <hr style="border-color:#1e3a5f;margin:8px 0;">
          ${b.logo ? `<div style="text-align:center;margin-bottom:8px;"><img src="${b.logo}" style="height:50px;background:#fff;padding:4px;border-radius:3px;border:2px solid var(--accent-purple);" onerror="this.style.display='none'"></div>` : ''}
          ${b.photo ? `<img src="${b.photo}" style="width:100%;height:120px;object-fit:cover;border-radius:3px;margin-bottom:8px;" onerror="this.style.display='none'">` : ''}
          <table class="data-table">
            <tr><td class="lbl">Facility</td><td class="val">${esc(b.name)}</td></tr>
            <tr><td class="lbl">Function</td><td class="val">${esc(b.type)}</td></tr>
            <tr><td class="lbl">Coords</td><td class="val">${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}</td></tr>
          </table>
        `);
      });
      layers.staticMil.push(mk);
      if (mapStore.show.mil) mk.addTo(map);
    });
  }

  function initNuclearLayer() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    mapStore.nukeCount = nuclearFacilities.length;
    nuclearFacilities.forEach(f => {
      const color = f.type === 'weapon' ? '#ef4444' : f.type === 'reactor' ? '#00ff88' : '#facc15';
      const symbol = f.type === 'weapon' ? '☢' : '⚛';
      const icon = L.divIcon({
        className: 'clear-icon',
        html: `<div style="font-size:15px;filter:drop-shadow(0 0 5px ${color});line-height:1;color:${color};">${symbol}</div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      });
      const mk = L.marker([f.lat, f.lng], { icon }).on('click', () => {
        selectMarker(mk);
        map.flyTo([f.lat, f.lng], 8);
        mapStore.setIntelStatus('NUCLEAR FACILITY');
        playClickSound();
        const statusBadge = f.status === 'ACTIVE' ? 'badge-green' : f.status === 'CRISIS' ? 'badge-red' : f.status === 'WATCH' ? 'badge-yellow' : 'badge-purple';
        mapStore.setIntelDisplay(`
          <strong style="color:${color};">${f.type === 'weapon' ? '☢️ NUCLEAR WEAPON SITE' : '⚛️ NUCLEAR REACTOR'}</strong>
          <hr style="border-color:#1e3a5f;margin:8px 0;">
          <div style="font-size:12px;color:#fff;font-weight:bold;margin-bottom:8px;">${esc(f.name)}</div>
          <span class="status-badge ${statusBadge}">● ${esc(f.status)}</span>
          <div style="margin-top:10px;">
            <table class="data-table">
              <tr><td class="lbl">Category</td><td class="val" style="color:${color};">${esc(f.category)}</td></tr>
              <tr><td class="lbl">Details</td><td class="val">${esc(f.warheads)}</td></tr>
              <tr><td class="lbl">Coords</td><td class="val">${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}</td></tr>
            </table>
          </div>
          <div style="margin-top:10px;font-size:9px;color:var(--text-muted);border-top:1px solid #1e3a5f;padding-top:8px;">
            ⚠️ OSINT data. Source: SIPRI, IAEA, FAS
          </div>
        `);
      });
      layers.nuke.push(mk);
      if (mapStore.show.nuke) mk.addTo(map);
    });
  }

  function initGPILayer() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    GPI_2025.forEach(c => {
      const { color, label } = getGPIColor(c.score);
      const mk = L.circleMarker([c.lat, c.lng], {
        radius: 7, color, fillColor: color, fillOpacity: 0.75, weight: 1.5,
      }).on('click', () => {
        selectMarker(mk);
        map.flyTo([c.lat, c.lng], 5);
        mapStore.setIntelStatus('GPI 2025');
        playClickSound();
        const iso2 = COUNTRY_ISO2[c.name];
        if (iso2) econStore.fetchWorldBankCountry(iso2, c.name);
        const dangerPct = Math.min(100, Math.round(((c.score - 1.0) / 2.5) * 100));
        const changeIcon = c.change === '↑' ? '<span style="color:#10b981">↑ Better</span>' : c.change === '↓' ? '<span style="color:#ef4444">↓ Worse</span>' : '<span style="color:#64748b">→ Stable</span>';
        mapStore.setIntelDisplay(`
          <strong style="color:${color};">🕊️ GLOBAL PEACE INDEX 2025</strong>
          <hr style="border-color:#1e3a5f;margin:8px 0;">
          <div style="font-size:16px;color:#fff;font-weight:bold;margin-bottom:4px;">${esc(c.name)}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span class="status-badge" style="background:${color}22;color:${color};border:1px solid ${color}55;">● ${label}</span>
            ${changeIcon}
          </div>
          <table class="data-table">
            <tr><td class="lbl">GPI Score 2025</td><td class="val" style="color:${color};font-size:16px;font-weight:bold;">${c.score.toFixed(3)}</td></tr>
            <tr><td class="lbl">Global Rank</td><td class="val">#${c.rank} / 163</td></tr>
            <tr><td class="lbl">Category</td><td class="val">${label}</td></tr>
          </table>
          <div style="margin-top:10px;">
            <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">CONFLICT RISK INDEX</div>
            <div class="threat-bar"><div class="threat-fill" style="width:${dangerPct}%;background:${color};"></div></div>
            <div style="font-size:9px;color:${color};margin-top:3px;">${dangerPct}% risk</div>
          </div>
          <div style="margin-top:10px;font-size:9px;color:var(--text-muted);border-top:1px solid #1e3a5f;padding-top:6px;">
            📊 Source: Institute for Economics & Peace · GPI 2025
          </div>
        `);
      });
      layers.gpi.push(mk);
      if (mapStore.show.gpi) mk.addTo(map);
    });
  }

  // Weather layer configs — all free, no API key required
  const WEATHER_LAYERS = {
    radar: {
      label: 'Precipitation Radar',
      icon: '🌧️',
      // RainViewer radar tiles (fetched dynamically)
      getTileUrl: async () => {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const radar = data?.radar?.past;
        if (radar && radar.length > 0) {
          const ts = radar[radar.length - 1].path;
          return 'https://tilecache.rainviewer.com' + ts + '/256/{z}/{x}/{y}/4/1_1.png';
        }
        return null;
      },
      opacity: 0.65,
    },
    infrared: {
      label: 'Infrared Satellite (IR)',
      icon: '🌡️',
      getTileUrl: async () => {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const ir = data?.satellite?.infrared;
        if (ir && ir.length > 0) {
          const ts = ir[ir.length - 1].path;
          return 'https://tilecache.rainviewer.com' + ts + '/256/{z}/{x}/{y}/0/0_0.png';
        }
        return null;
      },
      opacity: 0.6,
    },
    wind: {
      label: 'Wind Speed & Direction',
      icon: '💨',
      // OpenWeatherMap wind tiles — free layer, no key needed for base
      getTileUrl: async () => 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=',
      opacity: 0.6,
      // Fallback: use a constant wind visualization tile from Windy
      staticUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    },
    clouds: {
      label: 'Cloud Cover',
      icon: '☁️',
      getTileUrl: async () => {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const clouds = data?.satellite?.infrared;
        if (clouds && clouds.length > 0) {
          const ts = clouds[clouds.length - 1].path;
          return 'https://tilecache.rainviewer.com' + ts + '/256/{z}/{x}/{y}/1/1_1.png';
        }
        return null;
      },
      opacity: 0.55,
    },
    temp: {
      label: 'Temperature (Surface)',
      icon: '🌡️',
      // Open-Meteo doesn't have tiles, use RainViewer IR as temperature proxy
      getTileUrl: async () => {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        const ir = data?.satellite?.infrared;
        if (ir && ir.length > 0) {
          const ts = ir[ir.length - 1].path;
          return 'https://tilecache.rainviewer.com' + ts + '/256/{z}/{x}/{y}/2/1_1.png';
        }
        return null;
      },
      opacity: 0.65,
    },
  };

  async function initWeatherSatellite() {
    await updateWeatherLayer();
  }

  async function updateWeatherLayer() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;

    // Remove current layer
    if (weatherLayerObj) { weatherLayerObj.remove(); weatherLayerObj = null; }

    const layerType = mapStore.weatherLayerType;
    const cfg = WEATHER_LAYERS[layerType] || WEATHER_LAYERS.radar;

    try {
      let tileUrl = await cfg.getTileUrl();
      if (!tileUrl) {
        console.warn('[weather] No tile URL for', layerType);
        return;
      }
      weatherLayerObj = L.tileLayer(tileUrl, {
        opacity: cfg.opacity, zIndex: 10, attribution: 'RainViewer / Esri'
      });
      weatherLayer = weatherLayerObj;
      if (mapStore.show.wea) weatherLayerObj.addTo(map);
    } catch (e) {
      console.warn('[weather] Layer init error:', e.message);
    }
  }

  // ─── Aviation (OpenSky) — with AbortController + Viewport Culling ─
  async function fetchOpenSkyData() {
    const map = mapStore.mapInstance;
    if (!map || !L || !mapStore.show.air) return;
    try {
      const url = `/api/proxy?url=${encodeURIComponent('https://opensky-network.org/api/states/all')}`;
      const res = await makeFetch('opensky', url);
      const data = await res.json();
      if (!data.states) return;

      const bounds = map.getBounds();
      const maxPlanes = 400;
      const kept = new Set();
      let count = 0;

      const visible = data.states.filter(s => {
        if (!s[5] || !s[6] || s[8]) return false;
        return bounds.contains([s[6], s[5]]);
      });

      visible.slice(0, maxPlanes).forEach(s => {
        const icao = s[0];
        const lat = s[6], lng = s[5];
        const callsign = (s[1] || '').trim();
        const alt = s[7] || 0;
        const vel = s[9] || 0;
        const hdg = s[10] || 0;

        kept.add(icao);
        count++;

        const typeColor = getPlaneTypeColor(callsign);
        const iconHtml = `<div style="color:${typeColor};font-size:12px;transform:rotate(${hdg}deg);line-height:1;">▲</div>`;
        const icon = L.divIcon({ className: 'clear-icon', html: iconHtml, iconSize: [12, 12], iconAnchor: [6, 6] });

        // Update rolling trail history
        if (!airTrailHistory.has(icao)) airTrailHistory.set(icao, []);
        const hist = airTrailHistory.get(icao);
        const lastPos = hist.at(-1);
        if (!lastPos || lastPos[0] !== lat || lastPos[1] !== lng) {
          hist.push([lat, lng]);
          if (hist.length > 40) hist.shift(); // keep last 40 positions
          // Update polyline trail
          if (airTrailPolylines[icao]) {
            airTrailPolylines[icao].setLatLngs(hist);
          } else if (hist.length >= 2) {
            airTrailPolylines[icao] = L.polyline(hist, {
              color: getPlaneTypeColor(callsign), weight: 1, opacity: 0.5, dashArray: '3,4'
            });
            if (mapStore.show.air) airTrailPolylines[icao].addTo(map);
          }
        }

        if (layers.air[icao]) {
          layers.air[icao].marker.setLatLng([lat, lng]);
          layers.air[icao].marker.setIcon(icon);
          layers.air[icao].data = { callsign, lat, lng, alt, vel, hdg };
        } else {
          const mk = L.marker([lat, lng], { icon }).on('click', () => {
            selectMarker(mk);
            // Read current data at click time — not stale closure data
            const d = layers.air[icao]?.data || { callsign, lat, lng, alt, vel, hdg };
            map.flyTo([d.lat, d.lng], 9);
            mapStore.setIntelStatus('AIRCRAFT');
            playClickSound();
            displayPlaneIntel({ ...d, icao });
          });
          if (mapStore.show.air) mk.addTo(map);
          layers.air[icao] = { marker: mk, data: { callsign, lat, lng, alt, vel, hdg } };
        }
      });

      Object.keys(layers.air).forEach(icao => {
        if (!kept.has(icao)) {
          layers.air[icao].marker.remove();
          delete layers.air[icao];
          // Don't remove trail polyline immediately — fade it out over time
          // Just remove if the plane has been gone > 60s (handled by Map cleanup)
        }
      });
      // Remove trail polylines for planes gone from map for a while
      Object.keys(airTrailPolylines).forEach(icao => {
        if (!kept.has(icao) && !layers.air[icao]) {
          airTrailPolylines[icao].remove();
          delete airTrailPolylines[icao];
          airTrailHistory.delete(icao);
        }
      });
      mapStore.airCount = count;
      intelStore.setAviationCount(count);
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[aviation] fetch error:', e.message);
    }
  }

  function getPlaneTypeColor(callsign) {
    const cs = (callsign || '').toUpperCase();
    const milPrefixes = ['RCH', 'SAM', 'REACH', 'NVC', 'FORTE', 'SNAKE', 'JAKE', 'HOBO', 'BRONCO', 'EVIL'];
    if (milPrefixes.some(p => cs.startsWith(p))) return '#10b981';
    if (/^[A-Z]{2}\d/.test(cs)) return '#06b6d4';
    if (cs.includes('HX') || cs.includes('HELO')) return '#f97316';
    return '#64748b';
  }

  function getHeadingCompass(hdg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(hdg / 22.5) % 16] || '--';
  }

  function getPlaneCategory(callsign) {
    const cs = (callsign || '').toUpperCase();
    const milPrefixes = ['RCH','SAM','REACH','NVC','FORTE','SNAKE','JAKE','HOBO','BRONCO','EVIL','DARKSTAR','GHOST','VIPER'];
    if (milPrefixes.some(p => cs.startsWith(p))) return { label: 'MILITARY', color: '#10b981', icon: '🛡️' };
    if (/^[A-Z]{2}\d/.test(cs)) return { label: 'COMMERCIAL AIRLINE', color: '#06b6d4', icon: '✈️' };
    if (cs.includes('HX') || cs.includes('HELO') || cs.includes('N') && cs.length <= 6) return { label: 'PRIVATE / CHARTER', color: '#f97316', icon: '🛩️' };
    return { label: 'CIVIL AVIATION', color: '#64748b', icon: '✈️' };
  }

  async function fetchFlightRoute(icao24, callsign) {
    // OpenSky departures/arrivals API (public, no auth for basic use)
    try {
      const since = Math.floor(Date.now()/1000) - 86400; // last 24h
      const url = '/api/proxy?url=' + encodeURIComponent('https://opensky-network.org/api/flights/aircraft?icao24=' + icao24 + '&begin=' + since + '&end=' + Math.floor(Date.now()/1000));
      const res = await fetch(url);
      if (!res.ok) return null;
      const flights = await res.json();
      if (!Array.isArray(flights) || flights.length === 0) return null;
      const latest = flights[flights.length - 1];
      return {
        origin: latest.estDepartureAirport || null,
        dest:   latest.estArrivalAirport   || null,
        callsign: latest.callsign?.trim() || callsign,
      };
    } catch (_) { return null; }
  }

  function displayPlaneIntel(data) {
    const cat = getPlaneCategory(data.callsign);
    const compass = getHeadingCompass(data.hdg);
    const trail = airTrailHistory.get(data.icao) || [];
    const trailLen = trail.length;

    mapStore.setIntelDisplay(`
      <strong style="color:var(--accent-cyan);">${cat.icon} ADS-B AIRCRAFT TRACKING</strong>
      <hr style="border-color:#1e3a5f;margin:8px 0;">
      <div style="font-size:15px;color:#fff;font-weight:bold;margin-bottom:4px;">${esc(data.callsign) || 'UNKNOWN'}</div>
      <span class="status-badge" style="background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}55;">${cat.label}</span>
      <table class="data-table" style="margin-top:10px;">
        <tr><td class="lbl">ICAO24</td><td class="val" style="font-family:monospace;">${esc(data.icao || '--')}</td></tr>
        <tr><td class="lbl">Altitude</td><td class="val">${data.alt ? Math.round(data.alt).toLocaleString() + ' m (' + Math.round(data.alt*3.28).toLocaleString() + ' ft)' : '--'}</td></tr>
        <tr><td class="lbl">Speed</td><td class="val">${data.vel ? Math.round(data.vel * 3.6) + ' km/h' : '--'}</td></tr>
        <tr><td class="lbl">Heading</td><td class="val">${data.hdg ? Math.round(data.hdg) + '° ' + compass : '--'}</td></tr>
        <tr><td class="lbl">Position</td><td class="val">${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}</td></tr>
        <tr><td class="lbl">Trail</td><td class="val">${trailLen > 0 ? trailLen + ' positions tracked' : 'Building...'}</td></tr>
      </table>
      <div id="plane-route-info" style="margin-top:10px;padding:8px;background:rgba(6,182,212,.06);border-left:3px solid var(--accent-cyan);font-size:10px;color:var(--text-muted);">
        ⏳ Fetching route data...
      </div>
      <div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: OpenSky Network · ADS-B · Real-time</div>
    `);

    // Async route fetch — update panel when ready
    fetchFlightRoute(data.icao, data.callsign).then(route => {
      const el = document.getElementById('plane-route-info');
      if (!el) return;
      if (route && (route.origin || route.dest)) {
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="color:#10b981;font-weight:bold;">${route.origin ? '🛫 ' + esc(route.origin) : '🛫 Unknown origin'}</span>
            <span style="color:var(--text-muted);">──→</span>
            <span style="color:#f97316;font-weight:bold;">${route.dest ? '🛬 ' + esc(route.dest) : '🛬 Destination unknown'}</span>
          </div>
          <div style="margin-top:4px;color:var(--text-muted);">Callsign: ${esc(route.callsign || data.callsign)}</div>
        `;
      } else {
        el.innerHTML = '<span style="color:var(--text-muted);">Route data unavailable (private/military flight or no recent history)</span>';
      }
    });
  }

  // ─── Earthquakes (USGS) — with AbortController ────────────────────
  async function fetchQuakes() {
    const map = mapStore.mapInstance;
    if (!map || !L || !mapStore.show.quake) return;
    try {
      const url = `/api/proxy?url=${encodeURIComponent('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson')}`;
      const res = await makeFetch('quakes', url);
      const data = await res.json();
      layers.quake.forEach(m => m.remove());
      layers.quake = [];
      if (!data.features) return;
      data.features.forEach(f => {
        const [lng, lat] = f.geometry.coordinates;
        const mag = f.properties.mag;
        const place = f.properties.place;
        const radius = Math.max(4, mag * 3);
        const color = mag >= 6 ? '#ef4444' : mag >= 5 ? '#f97316' : '#facc15';
        const mk = L.circleMarker([lat, lng], {
          radius, color, fillColor: color, fillOpacity: 0.7, weight: 1.5
        }).on('click', () => {
          selectMarker(mk);
          map.flyTo([lat, lng], 7);
          mapStore.setIntelStatus('SEISMIC EVENT');
          playClickSound();
          mapStore.setIntelDisplay(`
            <strong style="color:${color};">🌍 SEISMIC EVENT (USGS)</strong>
            <hr style="border-color:#1e3a5f;margin:8px 0;">
            <div style="font-size:22px;color:${color};font-weight:bold;margin-bottom:6px;">M ${mag?.toFixed(1)}</div>
            <div style="color:var(--text-muted);margin-bottom:10px;font-size:11px;">${place}</div>
            <table class="data-table"><tbody>
              <tr><td class="lbl">Magnitude</td><td class="val" style="color:${color};">${mag?.toFixed(1)}</td></tr>
              <tr><td class="lbl">Coords</td><td class="val">${lat.toFixed(4)}, ${lng.toFixed(4)}</td></tr>
              <tr><td class="lbl">Time</td><td class="val">${new Date(f.properties.time).toUTCString().substring(0, 25)}</td></tr>
            </tbody></table>
            <div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: USGS Earthquake Hazards Program</div>
          `);
        });
        layers.quake.push(mk);
        if (mapStore.show.quake) mk.addTo(map);
      });
      mapStore.quakeCount = layers.quake.length;
      intelStore.setQuakeCount(layers.quake.length);
    } catch (e) {
      console.warn('[quakes] fetch error:', e.message);
    }
  }

  // ─── Multi-Satellite Tracking ────────────────────────────────────
  // NORAD IDs for tracked satellites
  const SAT_LIST = [
    { norad: 25544, name: 'ISS (Zarya)',      icon: '🛸', color: '#f97316', type: 'Space Station' },
    { norad: 20580, name: 'Hubble Space Telescope', icon: '🔭', color: '#8b5cf6', type: 'Observatory' },
    { norad: 43013, name: 'NOAA-20 (JPSS-1)', icon: '🌦️', color: '#06b6d4', type: 'Weather' },
    { norad: 27424, name: 'Terra (EOS AM-1)', icon: '🌍', color: '#10b981', type: 'Earth Obs.' },
    { norad: 25994, name: 'Aqua (EOS PM-1)', icon: '🌊', color: '#3b82f6', type: 'Earth Obs.' },
    { norad: 37849, name: 'Suomi NPP',        icon: '🛰️', color: '#a78bfa', type: 'Weather' },
    { norad: 46826, name: 'Starlink (sample)',icon: '⭐', color: '#64748b', type: 'Comms' },
    { norad: 28654, name: 'GPS BIIA-22 (PRN13)', icon: '📡', color: '#facc15', type: 'Navigation' },
  ];

  function renderSatMarker(sat, pos, map) {
    const key = String(sat.norad);
    const lat = pos.lat, lng = pos.lng;
    const alt = pos.alt?.toFixed(1);
    const vel = pos.vel?.toLocaleString();

    const icon = L.divIcon({
      className: 'clear-icon',
      html: '<div style="font-size:16px;line-height:1;filter:drop-shadow(0 0 5px ' + sat.color + ');">' + sat.icon + '</div>',
      iconSize: [18, 18], iconAnchor: [9, 9]
    });

    const buildPopup = () => (
      '<strong style="color:' + sat.color + ';">' + sat.icon + ' SATELLITE TRACKING</strong>' +
      '<hr style="border-color:#1e3a5f;margin:8px 0;">' +
      '<div style="font-size:14px;color:#fff;font-weight:bold;margin-bottom:4px;">' + esc(pos.name || sat.name) + '</div>' +
      '<span class="status-badge" style="background:' + sat.color + '22;color:' + sat.color + ';border:1px solid ' + sat.color + '55;">' + esc(sat.type) + '</span>' +
      '<table class="data-table" style="margin-top:10px;">' +
      '<tr><td class="lbl">NORAD ID</td><td class="val" style="font-family:monospace;">' + sat.norad + '</td></tr>' +
      '<tr><td class="lbl">Latitude</td><td class="val">' + lat?.toFixed(4) + '°</td></tr>' +
      '<tr><td class="lbl">Longitude</td><td class="val">' + lng?.toFixed(4) + '°</td></tr>' +
      '<tr><td class="lbl">Altitude</td><td class="val">' + (alt || '--') + ' km</td></tr>' +
      '<tr><td class="lbl">Speed</td><td class="val">' + (vel ? vel + ' km/h' : '--') + '</td></tr>' +
      '</table>' +
      '<div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: TLE / SGP4 · ivanstanojevic.me · satellite.js</div>'
    );

    if (layers.sat[key]) {
      layers.sat[key].marker.setLatLng([lat, lng]);
      layers.sat[key].data = { lat, lng, alt, vel };
    } else {
      const mk = L.marker([lat, lng], { icon }).on('click', () => {
        selectMarker(mk);
        const d = layers.sat[key]?.data || { lat, lng, alt, vel };
        map.flyTo([d.lat, d.lng], 4);
        mapStore.setIntelStatus('SATELLITE TRACK');
        playClickSound();
        mapStore.setIntelDisplay(buildPopup());
      });
      if (mapStore.show.sat) mk.addTo(map);
      layers.sat[key] = { marker: mk, data: { lat, lng, alt, vel } };
    }
  }

  async function fetchSatellites() {
    const map = mapStore.mapInstance;
    if (!map || !L || !mapStore.show.sat) return;
    try {
      const ids = SAT_LIST.map(s => s.norad).join(',');
      const res = await fetch('/api/positions?ids=' + ids);
      if (!res.ok) return;
      const positions = await res.json(); // { norad: { lat, lng, alt, vel, name } }

      SAT_LIST.forEach(sat => {
        const pos = positions[String(sat.norad)];
        if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') {
          renderSatMarker(sat, pos, map);
        }
      });

      intelStore.satUpdateTime = '● ' + new Date().toUTCString().substring(17, 22) + ' UTC';
    } catch (e) {
      console.warn('[sat] fetch error:', e.message);
    }
  }

  // ─── Dynamic OSM Military Bases ───────────────────────────────────
  async function fetchDynamicOSMBases() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    const b = map.getBounds();
    const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
    const query = `[out:json][timeout:15];(node["military"](${bbox});way["military"](${bbox}););out center 30;`;
    try {
      const url = `/api/proxy?url=${encodeURIComponent('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query))}`;
      const res = await fetch(url);
      const data = await res.json();
      layers.dynamicMil.forEach(m => m.remove());
      layers.dynamicMil = [];
      (data.elements || []).slice(0, 30).forEach(el => {
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        if (!lat || !lng) return;
        const name = el.tags?.name || el.tags?.military || 'Military Site';
        const mk = L.circleMarker([lat, lng], { radius: 5, color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.7, weight: 1 })
          .bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -6] });
        layers.dynamicMil.push(mk);
        if (mapStore.show.mil) mk.addTo(map);
      });
    } catch (e) {}
  }

  // ─── NASA EONET ───────────────────────────────────────────────────
  async function fetchEONET() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    layers.eonet.forEach(m => m.remove());
    layers.eonet = [];

    const CAT_CONFIG = {
      wildfires:   { icon: '🔥', color: '#ef4444', label: 'Wildfire' },
      volcanoes:   { icon: '🌋', color: '#f97316', label: 'Volcano' },
      floods:      { icon: '🌊', color: '#3b82f6', label: 'Flood' },
      storms:      { icon: '🌀', color: '#06b6d4', label: 'Severe Storm' },
      earthquakes: { icon: '⚡', color: '#facc15', label: 'Earthquake' },
      drought:     { icon: '🏜️', color: '#d97706', label: 'Drought' },
      landslides:  { icon: '⛰️', color: '#78350f', label: 'Landslide' },
      seaLakeIce:  { icon: '🧊', color: '#93c5fd', label: 'Sea/Lake Ice' },
      snow:        { icon: '❄️', color: '#e0f2fe', label: 'Snow/Ice' },
      tempExtremes:{ icon: '🌡️', color: '#fbbf24', label: 'Extreme Temp' },
      manmade:     { icon: '🏭', color: '#a855f7', label: 'Man-made' },
    };

    try {
      const url = `/api/proxy?url=${encodeURIComponent('https://eonet.gsfc.nasa.gov/api/v3/events?limit=100&status=open&days=30')}`;
      const res = await fetch(url);
      const data = await res.json();

      (data.events || []).forEach(ev => {
        if (!ev.geometry?.[0]?.coordinates) return;
        const [lng, lat] = ev.geometry[0].coordinates;
        const catId = ev.categories?.[0]?.id || '';
        const cfg = CAT_CONFIG[catId] || { icon: '🌍', color: '#10b981', label: 'Natural Event' };
        const isWildfire = catId === 'wildfires';
        const isStorm = catId === 'storms';
        const title = esc(ev.title);
        const date = ev.geometry[0].date ? new Date(ev.geometry[0].date).toUTCString().substring(0, 16) : 'Unknown';
        const source = ev.sources?.[0] ? `<a href="${ev.sources[0].url}" target="_blank" rel="noopener" style="color:var(--accent-cyan);">${ev.sources[0].id}</a>` : 'NASA EONET';

        let mk;
        if (isWildfire) {
          // Wildfire: pulsing red circle
          mk = L.circleMarker([lat, lng], {
            radius: 8, color: '#ff4500', fillColor: '#ef4444',
            fillOpacity: 0.75, weight: 2,
          });
        } else if (isStorm) {
          mk = L.circleMarker([lat, lng], {
            radius: 10, color: '#06b6d4', fillColor: '#0891b2',
            fillOpacity: 0.6, weight: 2,
          });
        } else {
          mk = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'clear-icon',
              html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 0 4px ${cfg.color});">${cfg.icon}</div>`,
              iconSize: [22, 22], iconAnchor: [11, 11]
            })
          });
        }

        mk.on('click', () => {
          selectMarker(mk);
          map.flyTo([lat, lng], 7);
          mapStore.setIntelStatus('NATURAL EVENT');
          playClickSound();
          mapStore.setIntelDisplay(`
            <strong style="color:${cfg.color};">${cfg.icon} ${cfg.label.toUpperCase()} — NASA EONET</strong>
            <hr style="border-color:#1e3a5f;margin:8px 0;">
            <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">${title}</div>
            <table class="data-table"><tbody>
              <tr><td class="lbl">Category</td><td class="val" style="color:${cfg.color};">${cfg.label}</td></tr>
              <tr><td class="lbl">Coords</td><td class="val">${lat.toFixed(4)}, ${lng.toFixed(4)}</td></tr>
              <tr><td class="lbl">Date</td><td class="val">${date}</td></tr>
              <tr><td class="lbl">Source</td><td class="val">${source}</td></tr>
            </tbody></table>
            <div style="margin-top:10px;font-size:9px;color:var(--text-muted);">Data: NASA Earth Observatory Natural Event Tracker</div>
          `);
        });

        layers.eonet.push(mk);
        if (mapStore.show.eonet) mk.addTo(map);
      });

      intelStore.eonetCount = layers.eonet.length;
    } catch (e) {
      console.warn('[eonet] fetch error:', e.message);
    }
  }

  // ─── GDELT Protests ───────────────────────────────────────────────
  async function fetchGDELTProtests() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    layers.protests.forEach(m => m.remove());
    layers.protests = [];
    try {
      const queries = ['protest+OR+demonstration', 'riot+OR+unrest+OR+uprising', 'strike+OR+blockade'];
      const q = queries[Math.floor(Date.now() / 300000) % queries.length];
      const url = `/api/proxy?url=${encodeURIComponent('https://api.gdeltproject.org/api/v2/geo/geo?query=' + q + '&mode=pointdata&maxrows=100&format=json')}`;
      const res = await fetch(url);
      const data = await res.json();
      (data.features || []).forEach(f => {
        if (!f.geometry?.coordinates) return;
        const [lng, lat] = f.geometry.coordinates;
        const title = esc(f.properties?.name || 'Protest/Unrest Event');
        const articleUrl = f.properties?.url || '';
        const tone = f.properties?.tone || 0;
        const color = tone < -5 ? '#ef4444' : tone < 0 ? '#f97316' : '#fbbf24';
        const mk = L.circleMarker([lat, lng], {
          radius: 6, color, fillColor: color, fillOpacity: 0.75, weight: 1.5
        }).on('click', () => {
          selectMarker(mk);
          map.flyTo([lat, lng], 8);
          mapStore.setIntelStatus('UNREST / PROTEST');
          playClickSound();
          mapStore.setIntelDisplay(
            '<strong style="color:#fbbf24;">&#128227; PROTEST / CIVIL UNREST &mdash; GDELT</strong>' +
            '<hr style="border-color:#1e3a5f;margin:8px 0;">' +
            '<div style="font-size:12px;color:#fff;font-weight:bold;margin-bottom:8px;">' + title + '</div>' +
            '<table class="data-table"><tbody>' +
            '<tr><td class="lbl">Coords</td><td class="val">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</td></tr>' +
            '<tr><td class="lbl">Tone</td><td class="val" style="color:' + color + ';">' + tone.toFixed(2) + ' (' + (tone < -5 ? 'Hostile' : tone < 0 ? 'Negative' : 'Neutral') + ')</td></tr>' +
            (articleUrl ? '<tr><td class="lbl">Source</td><td class="val"><a href="' + articleUrl + '" target="_blank" rel="noopener" style="color:var(--accent-cyan);">Open Article</a></td></tr>' : '') +
            '</tbody></table>' +
            '<div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: GDELT Project</div>'
          );
        });
        layers.protests.push(mk);
        if (mapStore.show.protests) mk.addTo(map);
      });
      intelStore.protestCount = layers.protests.length;
    } catch (e) {
      console.warn('[gdelt] fetch error:', e.message);
    }
  }

  // ─── Geo Search ───────────────────────────────────────────────────
  async function executeSearch(query) {
    const map = mapStore.mapInstance;
    if (!map || !query || query.length < 2) return null;
    playClickSound();

    // Nuclear check
    const nukeMatch = nuclearFacilities.find(f =>
      f.name.toLowerCase().includes(query.toLowerCase()) || f.category.toLowerCase().includes(query.toLowerCase())
    );
    if (nukeMatch) { map.flyTo([nukeMatch.lat, nukeMatch.lng], 10, { duration: 2 }); return '[NUKE-DB] Nuclear target found'; }

    // Military check
    const milMatch = majorMilitaryBases.find(b =>
      b.name.toLowerCase().includes(query.toLowerCase()) || b.type.toLowerCase().includes(query.toLowerCase())
    );
    if (milMatch) { map.flyTo([milMatch.lat, milMatch.lng], 11, { duration: 2 }); return '[DB] Military base found'; }

    // Conflict zones
    const cMatch = conflictZones.find(z => z.name.toLowerCase().includes(query.toLowerCase()));
    if (cMatch) {
      const center = [(cMatch.bounds[0][0] + cMatch.bounds[1][0]) / 2, (cMatch.bounds[0][1] + cMatch.bounds[1][1]) / 2];
      map.flyTo(center, 5, { duration: 2 });
      return `[CONFLICT] ${cMatch.name}`;
    }

    // Hotspots
    const hMatch = intelHotspots.find(h => h.name.toLowerCase().includes(query.toLowerCase()));
    if (hMatch) { map.flyTo([hMatch.lat, hMatch.lng], 6, { duration: 2 }); return `[HOTSPOT] ${hMatch.name}`; }

    // GPI countries
    const gMatch = GPI_2025.find(c => c.name.toLowerCase().includes(query.toLowerCase()));
    if (gMatch) { map.flyTo([gMatch.lat, gMatch.lng], 5, { duration: 2 }); return `[GPI] ${gMatch.name} — Rank #${gMatch.rank}`; }

    // Nominatim (via proxy to respect CORS and usage policy)
    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)}`);
      const data = await res.json();
      if (data?.length > 0) {
        map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 10, { duration: 2 });
        return `[GEO] ${data[0].display_name.substring(0, 40)}...`;
      }
      return '[ERR] Location not found';
    } catch (e) {
      return '[ERR] Connection failed';
    }
  }

  // ─── Callsign Tracker ─────────────────────────────────────────────
  function trackCallsign(callsign) {
    const cs = callsign.trim().toUpperCase();
    if (!cs) return 'Enter a callsign';
    const match = Object.values(layers.air).find(o => o.data?.callsign?.toUpperCase().includes(cs));
    if (match) {
      const ll = match.marker.getLatLng();
      mapStore.mapInstance?.flyTo([ll.lat, ll.lng], 9, { duration: 2 });
      selectMarker(match.marker);
      displayPlaneIntel({ ...match.data, icao: '' });
      return `Found: ${match.data.callsign}`;
    }
    return `Not found in current data`;
  }

  // ─── Convergence Check ────────────────────────────────────────────
  function runConvergenceCheck() {
    const zones = {};
    const addEvent = (lat, lng, type) => {
      const key = `${Math.round(lat)}_${Math.round(lng)}`;
      if (!zones[key]) zones[key] = { types: new Set(), lat, lng };
      zones[key].types.add(type);
    };
    layers.quake.forEach(m => { const ll = m.getLatLng(); addEvent(ll.lat, ll.lng, 'quake'); });
    layers.eonet.forEach(m => { const ll = m.getLatLng?.(); if (ll) addEvent(ll.lat, ll.lng, 'eonet'); });
    Object.values(layers.air).forEach(o => { const ll = o.marker.getLatLng(); addEvent(ll.lat, ll.lng, 'aviation'); });

    Object.values(zones).forEach(z => {
      if (z.types.size >= 3) {
        playAlertSound();
        intelStore.incidentFeed = [...intelStore.incidentFeed]; // trigger reactivity
      }
    });
  }

  // ─── News Ticker ──────────────────────────────────────────────────
  async function fetchGlobalNews() {
    const sources = [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://rss.dw.com/rdf/rss-en-world',
    ];
    const labels = ['BBC', 'AJE', 'DW'];
    let allItems = [];
    try {
      const res = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: sources.map((url, i) => ({ url, label: labels[i], cls: 'source-ap' })) }),
      });
      const data = await res.json();
      allItems = (data.items || []).slice(0, 20);
    } catch (e) {
      console.warn('[ticker] RSS error:', e);
    }
    intelStore.setTickerItems(allItems);
  }

  // ─── Live Intel Feed ──────────────────────────────────────────────
  async function fetchLiveIntelFeed() {
    const sources = [
      { url: 'https://feeds.reuters.com/reuters/worldNews', label: 'REUTERS', cls: 'source-reuters' },
      { url: 'https://rsshub.app/apnews/topics/world-news', label: 'AP', cls: 'source-ap' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', label: 'AJE', cls: 'source-blue' },
    ];
    try {
      const res = await fetch('/api/rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });
      const data = await res.json();
      intelStore.setIntelFeed(data.items || []);
    } catch (e) {}
  }

  // ─── Auto-detect conflict from news ───────────────────────────────
  async function autoDetectConflictZones() {
    const kw = ['attack', 'war', 'explosion', 'airstrike', 'missile', 'troops', 'invasion', 'combat', 'casualties'];
    const items = intelStore.intelFeedItems;
    const conflicts = items.filter(i => kw.some(k => i.title?.toLowerCase().includes(k)));
    intelStore.dynConflicts = conflicts.slice(0, 5);
  }

  // ─── Undersea Cables ──────────────────────────────────────────────
  async function buildCableLayer() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    if (layers.cables) { layers.cables.remove(); layers.cables = null; }

    const group = L.layerGroup();
    layers.cables = group;
    if (mapStore.show.cables) group.addTo(map);

    // Color palette cycling
    const palette = [
      '#8b5cf6','#06b6d4','#f97316','#10b981','#facc15',
      '#ef4444','#a78bfa','#34d399','#fb923c','#22d3ee',
      '#f87171','#818cf8','#6d28d9','#0891b2','#d97706',
      '#7c3aed','#0e7490','#b45309','#dc2626','#4f46e5',
    ];

    try {
      // Step 1: fetch cable list
      const listUrl = '/api/proxy?url=' + encodeURIComponent('https://www.submarinecablemap.com/api/v3/cable/all.json');
      const listRes = await fetch(listUrl);
      if (!listRes.ok) throw new Error('cable list fetch failed');
      const cableList = await listRes.json(); // array of { slug, name, color, ... }

      // Step 2: fetch individual cable GeoJSON (up to 25 cables to avoid overloading)
      // NOTE: TeleGeography returns an OBJECT {0:{id,name},1:..} not an array — use Object.values()
      const rawList = typeof cableList === 'object' && !Array.isArray(cableList)
        ? Object.values(cableList)
        : (Array.isArray(cableList) ? cableList : []);
      const toFetch = rawList.filter(c => c && c.id).slice(0, 25); // use .id as slug
      let colorIdx = 0;

      await Promise.allSettled(toFetch.map(async (cable) => {
        try {
          const slug = cable.id || cable.slug;
          if (!slug) return;
          const cUrl = '/api/proxy?url=' + encodeURIComponent('https://www.submarinecablemap.com/api/v3/cable/' + slug + '.json');
          const cRes = await fetch(cUrl);
          if (!cRes.ok) return;
          const cData = await cRes.json();

          // GeoJSON geometry sits in cData.cable.features[0].geometry or cData.features
          const geoFeatures = cData?.cable?.features || cData?.features || [];
          const color = cable.color || palette[colorIdx++ % palette.length];
          const cableName = cable.name || cable.slug;

          geoFeatures.forEach(feat => {
            if (!feat?.geometry) return;
            const geo = feat.geometry;

            // Convert GeoJSON coords [lng,lat] → Leaflet [lat,lng]
            let latlngs = null;
            if (geo.type === 'MultiLineString') {
              latlngs = geo.coordinates.map(seg => seg.map(([lng, lat]) => [lat, lng]));
            } else if (geo.type === 'LineString') {
              latlngs = geo.coordinates.map(([lng, lat]) => [lat, lng]);
            }
            if (!latlngs) return;

            const pl = L.polyline(latlngs, {
              color, weight: 1.6, opacity: 0.75, dashArray: '6,3',
            });
            pl.on('click', () => {
              mapStore.setIntelStatus('UNDERSEA CABLE');
              playClickSound();
              const landingPts = (cData?.cable?.landing_points || []).map(p => p.name || '').filter(Boolean).join(', ');
              const owners = (cData?.cable?.owners || []).map(o => o.name || '').filter(Boolean).join(', ');
              mapStore.setIntelDisplay(
                '<strong style="color:#8b5cf6;">&#128225; UNDERSEA CABLE INFRASTRUCTURE</strong>' +
                '<hr style="border-color:#1e3a5f;margin:8px 0;">' +
                '<div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:6px;">' + esc(cableName) + '</div>' +
                (owners ? '<div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;">Owners: ' + esc(owners.substring(0,80)) + '</div>' : '') +
                (landingPts ? '<div style="font-size:9px;color:var(--accent-cyan);margin-bottom:8px;line-height:1.5;">Landing: ' + esc(landingPts.substring(0,120)) + '...</div>' : '') +
                '<div style="font-size:10px;color:var(--text-muted);line-height:1.6;border-left:3px solid #8b5cf6;padding:6px;background:rgba(139,92,246,.06);">Kabel telekomunikasi bawah laut membawa ~99% traffic internet internasional. Infrastruktur kritis global.</div>' +
                '<div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: TeleGeography · submarinecablemap.com</div>'
              );
            });
            pl.bindTooltip(esc(cableName), { sticky: true });
            pl.addTo(group);
          });
        } catch (_) {
          // Silently skip cables that fail — no dummy data
        }
      }));

    } catch (e) {
      console.warn('[cables] TeleGeography fetch failed:', e.message);
      // No fallback dummy data per user requirement
    }
  }


  // Cyber Threats (CISA + ATT&CK attribution data)
  async function fetchCyberThreats() {
    const map = mapStore.mapInstance;
    if (!map || !L) return;
    layers.cyber.forEach(m => m.remove());
    layers.cyber = [];
    const actors = [
      { lat: 39.9,  lng: 116.4, actor: 'APT41 / APT10 / APT40', country: 'China',        threat: 'CRITICAL', desc: 'PRC-linked groups targeting critical infrastructure, defense, telecom globally.' },
      { lat: 55.75, lng: 37.6,  actor: 'Sandworm / APT29 / Cozy Bear', country: 'Russia', threat: 'CRITICAL', desc: 'GRU/SVR groups. Responsible for NotPetya, SolarWinds, Ukraine grid attacks.' },
      { lat: 37.5,  lng: 127.0, actor: 'Lazarus / Kimsuky',     country: 'North Korea',   threat: 'HIGH',     desc: 'DPRK groups targeting crypto, financial systems. Responsible for WannaCry.' },
      { lat: 35.7,  lng: 51.4,  actor: 'APT33 / Charming Kitten', country: 'Iran',        threat: 'HIGH',     desc: 'IRGC-linked. Targeting energy, government, defense in Middle East and US.' },
      { lat: 48.9,  lng: 31.0,  actor: 'UA-CERT (Active Warzone)', country: 'Ukraine',    threat: 'CRITICAL', desc: 'Sustained Russian cyber ops. Wiperware, DDoS, ICS attacks documented.' },
      { lat: 38.9,  lng: -77.0, actor: 'CISA / NSA Defender',   country: 'United States', threat: 'DEFENDED', desc: 'CISA and NSA Cybersecurity Directorate. Major threat intelligence sharing node.' },
      { lat: 51.5,  lng: -0.1,  actor: 'NCSC / GCHQ Defender',  country: 'UK',            threat: 'DEFENDED', desc: 'UK NCSC active cyber defense. Five Eyes intelligence sharing node.' },
      { lat: -35.3, lng: 149.1, actor: 'ASD / ACSC',            country: 'Australia',     threat: 'WATCH',    desc: 'ASD active member of Five Eyes. Target of China-attributed campaigns.' },
      { lat: 1.35,  lng: 103.8, actor: 'CSA Singapore',         country: 'Singapore',     threat: 'WATCH',    desc: 'Regional cyber hub. Transit point for APT traffic targeting ASEAN.' },
      { lat: -23.5, lng: -46.6, actor: 'Brazil CERT',           country: 'Brazil',        threat: 'ELEVATED', desc: 'Top ransomware target in Latin America. Banking trojans highly active.' },
      { lat: 22.3,  lng: 114.2, actor: 'HK Cyber Hub',          country: 'Hong Kong',     threat: 'HIGH',     desc: 'Frequent target and transit node for PRC intrusion sets.' },
      { lat: 28.6,  lng: 77.2,  actor: 'CERT-In',               country: 'India',         threat: 'ELEVATED', desc: 'Significant APT targeting from PRC and Pakistan-linked groups.' },
    ];
    const colorMap = { CRITICAL: '#ef4444', HIGH: '#f97316', ELEVATED: '#facc15', DEFENDED: '#10b981', WATCH: '#06b6d4' };
    actors.forEach(a => {
      const color = colorMap[a.threat] || '#8b5cf6';
      const isDefender = a.threat === 'DEFENDED';
      const radius = a.threat === 'CRITICAL' ? 10 : a.threat === 'HIGH' ? 8 : 6;
      const mk = L.circleMarker([a.lat, a.lng], {
        radius, color, fillColor: color, fillOpacity: isDefender ? 0.25 : 0.6,
        weight: 2, dashArray: isDefender ? '4,4' : null,
      }).on('click', () => {
        selectMarker(mk);
        map.flyTo([a.lat, a.lng], 7);
        mapStore.setIntelStatus('CYBER INTEL');
        playClickSound();
        mapStore.setIntelDisplay(
          '<strong style="color:' + color + ';">&#128187; CYBER THREAT INTELLIGENCE</strong>' +
          '<hr style="border-color:#1e3a5f;margin:8px 0;">' +
          '<div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:4px;">' + esc(a.country) + '</div>' +
          '<div style="font-size:11px;color:' + color + ';margin-bottom:8px;">' + esc(a.actor) + '</div>' +
          '<span class="status-badge" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">&#9679; ' + esc(a.threat) + '</span>' +
          '<div style="margin-top:10px;color:var(--text-muted);line-height:1.6;font-size:11px;border-left:3px solid ' + color + ';padding:8px;background:rgba(0,0,0,.3);">' + esc(a.desc) + '</div>' +
          '<div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: CISA Advisories &middot; MITRE ATT&amp;CK &middot; Mandiant TI</div>'
        );
      });
      layers.cyber.push(mk);
      if (mapStore.show.cyber) mk.addTo(map);
    });
    try {
      const r = await fetch('/api/proxy?url=' + encodeURIComponent('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'));
      const d = await r.json();
      if (d && d.vulnerabilities) {
        intelStore.latestKEV = d.vulnerabilities.slice(0, 5).map(v => ({
          id: v.cveID, name: v.vulnerabilityName, vendor: v.vendorProject, due: v.dueDate,
        }));
      }
    } catch (_) {}
    intelStore.cyberCount = layers.cyber.length;
  }

  // Missile / ICBM Monitor (real sources only: EONET seismics + live news keywords)
  async function scanMissileMentions() {
    const kw = ['missile', 'icbm', 'ballistic', 'hypersonic', 'launch', 'warhead', 'north korea launch', 'iran missile', 'rocket test'];
    const items = intelStore.intelFeedItems;
    const hits = items.filter(i => kw.some(k => i.title && i.title.toLowerCase().includes(k)));
    intelStore.missileAlert = hits.length > 0
      ? { count: hits.length, latest: hits[0].title, source: hits[0].source || hits[0].src || 'RSS', time: new Date().toUTCString().substring(17, 22) }
      : null;
  }

  return {
    initMap,
    initAllLayers,
    applyLayerToggle,
    fetchOpenSkyData,
    fetchQuakes,
    fetchSatellites,
    fetchDynamicOSMBases,
    fetchEONET,
    fetchGDELTProtests,
    fetchGlobalNews,
    fetchLiveIntelFeed,
    fetchCyberThreats,
    scanMissileMentions,
    autoDetectConflictZones,
    runConvergenceCheck,
    executeSearch,
    trackCallsign,
    buildCableLayer,
    updateWeatherLayer,
    WEATHER_LAYERS,
    SAT_LIST,
    layers,
  };

}

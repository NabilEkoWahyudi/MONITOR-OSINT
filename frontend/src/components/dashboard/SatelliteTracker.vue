<template>
  <div class="panel-box">
    <div class="panel-title">🛰️ SATELLITE TRACKER (TLE)
      <span style="font-size:9px;color:var(--accent-orange);margin-left:4px;">{{ intelStore.satUpdateTime }}</span>
    </div>
    <div style="font-size:9px;color:var(--text-muted);margin-bottom:6px;">Real-time API (wheretheiss.at)</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;">
      <button class="rfb" style="padding:4px;font-size:10px;text-align:left;border-left:3px solid #f97316;" @click="track('ISS')">
        <div style="color:#f97316;">ISS (ZARYA) 🛸</div>
      </button>
      <button v-for="s in SATELLITES.filter(x => !x.primary)" :key="s.norad" class="rfb"
        style="padding:4px;font-size:9px;text-align:left;" :style="{ borderLeft: `2px solid ${s.color}` }"
        @click="trackSat(s.norad, s.name)">
        <div :style="{ color: s.color }">{{ s.name }} {{ s.icon }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import { useIntelStore } from '@/stores/intelStore';
import { useMap } from '@/composables/useMap';
import { SATELLITES } from '@/data/satConfig';

const mapStore = useMapStore();
const intelStore = useIntelStore();
const mapComposable = useMap();

function track(id) {
  if (id === 'ISS') {
    const mk = mapComposable.layers.sat.ISS?.marker;
    if (mk) {
      const ll = mk.getLatLng();
      mapStore.flyTo(ll.lat, ll.lng, 4);
      mapStore.setIntelStatus('ISS TRACK');
      mapStore.setIntelDisplay(`
        <strong style="color:#f97316;">🛸 ISS — ORBITAL TRACK</strong>
        <hr style="border-color:#1e3a5f;margin:8px 0;">
        <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">International Space Station</div>
        <table class="data-table">
          <tr><td class="lbl">Latitude</td><td class="val">${ll.lat.toFixed(4)}°</td></tr>
          <tr><td class="lbl">Longitude</td><td class="val">${ll.lng.toFixed(4)}°</td></tr>
        </table>
        <div style="margin-top:8px;font-size:9px;color:var(--text-muted);">Source: wheretheiss.at · Live API</div>
      `);
    }
  }
}

async function trackSat(norad, name) {
  mapStore.setIntelStatus('TRACKING');
  mapStore.setIntelDisplay(`
    <strong style="color:var(--accent-orange);">🛰️ SATELLITE TRACKING</strong>
    <hr style="border-color:#1e3a5f;margin:8px 0;">
    <div style="font-size:13px;color:#fff;font-weight:bold;margin-bottom:8px;">${name}</div>
    <div style="font-size:11px;color:var(--text-muted);">NORAD ID: ${norad}</div>
    <div style="margin-top:10px;font-size:11px;color:var(--accent-yellow);">⚠️ API Tracking untuk satelit ini dinonaktifkan sementara untuk mengurangi beban rate limit. ISS tetap live.</div>
  `);
}
</script>

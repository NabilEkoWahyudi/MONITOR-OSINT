<template>
  <!-- Status Bar -->
  <div id="api-status-bar">
    <div class="status-label">⬡ SYS</div>
    <div v-for="api in apis" :key="api.id" class="api-indicator" :class="api.status" :title="api.label">
      <span class="api-dot"></span>
      <span class="api-name">{{ api.label }}</span>
    </div>
    <div class="status-spacer"></div>
    <div class="api-indicator" :class="connStatus">
      <span class="api-dot"></span>
      <span class="api-name">NET</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useIntelStore } from '@/stores/intelStore';

const intelStore = useIntelStore();

const apis = ref([
  { id: 'opensky', label: 'OPENSKY', status: 'pending' },
  { id: 'usgs', label: 'USGS', status: 'pending' },
  { id: 'eonet', label: 'EONET', status: 'pending' },
  { id: 'iss', label: 'ISS', status: 'pending' },
  { id: 'gdelt', label: 'GDELT', status: 'pending' },
  { id: 'rss', label: 'RSS', status: 'pending' },
]);

const connStatus = ref('pending');
let timer = null;

async function ping(url, id) {
  try {
    const r = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
    const api = apis.value.find(a => a.id === id);
    if (api) api.status = r.ok ? 'ok' : 'warn';
  } catch {
    const api = apis.value.find(a => a.id === id);
    if (api) api.status = 'error';
  }
}

async function checkAll() {
  connStatus.value = navigator.onLine ? 'ok' : 'error';
  ping('https://opensky-network.org/api/states/all?lamin=0&lomin=0&lamax=1&lomax=1', 'opensky');
  ping('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', 'usgs');
  ping('https://eonet.gsfc.nasa.gov/api/v3/events?limit=1', 'eonet');
  ping('https://api.wheretheiss.at/v1/satellites/25544', 'iss');
  ping('https://api.gdeltproject.org/api/v2/geo/geo?query=world&mode=pointdata&maxrows=1&format=json', 'gdelt');
  // RSS check via backend health
  try {
    const r = await fetch('/api/health');
    const api = apis.value.find(a => a.id === 'rss');
    if (api) api.status = r.ok ? 'ok' : 'error';
  } catch {
    const api = apis.value.find(a => a.id === 'rss');
    if (api) api.status = 'error';
  }
}

onMounted(() => {
  checkAll();
  timer = setInterval(checkAll, 60000); // re-check every 60s
});
onUnmounted(() => clearInterval(timer));
</script>

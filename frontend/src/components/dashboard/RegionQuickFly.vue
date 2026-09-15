<template>
  <div class="panel-box" style="padding:8px 10px;">
    <div class="panel-title" style="cursor:pointer;" @click="open = !open">
      🗺️ REGION QUICK-FLY
      <span style="font-size:10px;color:var(--accent-cyan);">{{ open ? '▲' : '▼' }}</span>
    </div>
    <div v-if="open" style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:6px;">
      <button v-for="r in regions" :key="r.label" class="rfb" @click="fly(r)">{{ r.label }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMapStore } from '@/stores/mapStore';

const open = ref(false);
const mapStore = useMapStore();

const regions = [
  { label: '🌐 GLOBAL', lat: 20, lng: 0, zoom: 2 },
  { label: '🇪🇺 EUROPE', lat: 50, lng: 15, zoom: 4 },
  { label: '🕌 MENA', lat: 26, lng: 45, zoom: 5 },
  { label: '🀄 E.ASIA', lat: 35, lng: 105, zoom: 4 },
  { label: '🌏 SE ASIA', lat: 3, lng: 115, zoom: 4 },
  { label: '🏔️ S.ASIA', lat: 20, lng: 80, zoom: 4 },
  { label: '🌍 AFRICA', lat: 5, lng: 20, zoom: 4 },
  { label: '🗽 N.AM', lat: 40, lng: -100, zoom: 4 },
  { label: '🌎 S.AM', lat: -15, lng: -60, zoom: 4 },
  { label: '☭ C.ASIA', lat: 55, lng: 65, zoom: 4 },
  { label: '🦘 OCEANIA', lat: -25, lng: 135, zoom: 4 },
  { label: '🧊 ARCTIC', lat: 65, lng: 25, zoom: 4 },
];

function fly(r) {
  mapStore.flyTo(r.lat, r.lng, r.zoom);
}
</script>

<template>
  <div id="map-container">
    <div id="map" ref="mapEl"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMap } from '@/composables/useMap';
import { useEconStore } from '@/stores/econStore';

const mapEl = ref(null);
const mapComposable = useMap();
const econStore = useEconStore();

// Track intervals for cleanup
const intervals = [];

onMounted(async () => {
  // Init the Leaflet map
  await mapComposable.initMap(mapEl.value);

  // Init all static layers
  mapComposable.initAllLayers();

  // Start data fetches (fetchGlobalNews is called by NewsTicker only)
  mapComposable.fetchQuakes();
  mapComposable.fetchOpenSkyData();
  mapComposable.fetchSatellites();
  mapComposable.fetchLiveIntelFeed();
  econStore.fetchWorldBankMacro();

  // Recurring intervals — store references for cleanup
  intervals.push(setInterval(mapComposable.fetchQuakes, 90000));
  intervals.push(setInterval(mapComposable.fetchOpenSkyData, 15000));
  intervals.push(setInterval(mapComposable.fetchSatellites, 10000));
  intervals.push(setInterval(mapComposable.fetchLiveIntelFeed, 300000));
  intervals.push(setInterval(mapComposable.autoDetectConflictZones, 600000));
  intervals.push(setInterval(mapComposable.runConvergenceCheck, 300000));

  // Missile keyword scan — runs after intel feed, and every 5 min
  intervals.push(setInterval(mapComposable.scanMissileMentions, 300000));

  // Delayed starts for non-critical layers
  setTimeout(mapComposable.fetchEONET, 3000);
  setTimeout(mapComposable.fetchGDELTProtests, 12000);
  // Scan missiles after first intel feed loads
  setTimeout(mapComposable.scanMissileMentions, 15000);

  intervals.push(setInterval(mapComposable.fetchEONET, 1800000));       // 30 min
  intervals.push(setInterval(mapComposable.fetchGDELTProtests, 600000)); // 10 min
  intervals.push(setInterval(mapComposable.fetchCyberThreats, 1800000)); // 30 min

});

onUnmounted(() => {
  // Clear all intervals to prevent memory leaks during HMR
  intervals.forEach(id => clearInterval(id));
  intervals.length = 0;
});
</script>


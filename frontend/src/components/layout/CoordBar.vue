<template>
  <div id="coord-bar">
    <div>LAT: <span>{{ mapStore.curLat }}</span></div>
    <div>LON: <span>{{ mapStore.curLon }}</span></div>
    <div>ZOOM: <span>{{ mapStore.curZoom }}</span></div>
    <div>✈️ <span>{{ mapStore.airCount }}</span></div>
    <div>☢️ <span>{{ mapStore.nukeCount }}</span></div>
    <div>🌍 <span>{{ mapStore.quakeCount }}</span></div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
const mapStore = useMapStore();
</script>

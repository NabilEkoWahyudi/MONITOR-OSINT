<template>
  <div id="map-controls">
    <button class="map-ctrl-btn" :id="'btn-dim'" :class="{ 'dim-active': mapStore.dimMode }" @click="mapStore.toggleDim()">
      {{ mapStore.dimMode ? '☀️ BRIGHT' : '🌙 DIM' }}
    </button>
    <button class="map-ctrl-btn" id="btn-audio" :class="{ active: mapStore.audioEnabled }" @click="audio.toggleAudio()">
      {{ mapStore.audioEnabled ? '🔔 LIVE' : '🔔 MUTE' }}
    </button>
    <button class="map-ctrl-btn" id="btn-econ"
      style="background:rgba(250,204,21,.12);border-color:rgba(250,204,21,.4);color:#facc15;font-weight:bold;"
      @click="mapStore.econModalOpen = true; mapStore.econModalTab = 'global'">
      📊 ECON
    </button>
    <button class="map-ctrl-btn" :class="{ active: mapStore.cyberActive }" @click="mapStore.cyberActive = !mapStore.cyberActive">
      ⚡ CYBER
    </button>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import { useAudio } from '@/composables/useAudio';

const mapStore = useMapStore();
const audio = useAudio();
</script>

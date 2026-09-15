<template>
  <!-- Weather layer type switcher — shown when 'wea' layer is active -->
  <div v-if="mapStore.show.wea" id="weather-control-panel">
    <div class="wc-title">🛰️ WEATHER SATELLITE</div>
    <div class="wc-grid">
      <button
        v-for="(cfg, key) in weatherLayers"
        :key="key"
        class="wc-btn"
        :class="{ active: mapStore.weatherLayerType === key }"
        @click="switchLayer(key)"
        :title="cfg.label"
      >
        <span class="wc-icon">{{ cfg.icon }}</span>
        <span class="wc-label">{{ cfg.label }}</span>
      </button>
    </div>
    <div class="wc-source">Source: RainViewer · Updated ~2min</div>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useMap } from '@/composables/useMap';
import { useMapStore } from '@/stores/mapStore';

const mapStore = useMapStore();
const mapComposable = useMap();
const weatherLayers = mapComposable.WEATHER_LAYERS;

async function switchLayer(type) {
  mapStore.weatherLayerType = type;
  await mapComposable.updateWeatherLayer();
}

// Re-apply layer when wea is toggled on
watch(() => mapStore.show.wea, (val) => {
  if (val) mapComposable.updateWeatherLayer();
});
</script>

<style scoped>
#weather-control-panel {
  position: absolute;
  bottom: 40px;
  left: 350px;
  z-index: 900;
  background: rgba(3, 9, 22, 0.92);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 6px;
  padding: 10px;
  backdrop-filter: blur(12px);
  min-width: 240px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6);
}

.wc-title {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--accent-cyan, #06b6d4);
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(6,182,212,0.15);
  padding-bottom: 6px;
}

.wc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-bottom: 6px;
}

.wc-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  color: #94a3b8;
}

.wc-btn:hover {
  background: rgba(6,182,212,0.1);
  border-color: rgba(6,182,212,0.3);
  color: #e2f0ff;
}

.wc-btn.active {
  background: rgba(6,182,212,0.15);
  border-color: rgba(6,182,212,0.6);
  color: #06b6d4;
  box-shadow: 0 0 8px rgba(6,182,212,0.2);
}

.wc-icon {
  font-size: 16px;
  line-height: 1;
}

.wc-label {
  font-size: 8px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.2;
}

.wc-source {
  font-size: 8px;
  color: rgba(148,163,184,0.5);
  text-align: right;
}
</style>

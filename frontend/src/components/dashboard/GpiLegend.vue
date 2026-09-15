<template>
  <div class="panel-box" v-if="mapStore.gpiLegendVisible">
    <div class="panel-title">🕊️ GPI 2025 LEGEND
      <span style="font-size:9px;color:var(--accent-green);">IEP Official</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px;font-size:10px;">
      <div v-for="cat in categories" :key="cat.color" style="display:flex;align-items:center;gap:8px;">
        <div :style="{ width: '14px', height: '14px', background: cat.color, borderRadius: '2px' }"></div>
        <span style="color:var(--text-muted);">{{ cat.label }}</span>
      </div>
    </div>
    <div style="font-size:9px;color:var(--text-muted);margin-top:6px;border-top:1px solid var(--border-color);padding-top:5px;">
      Source: Institute for Economics & Peace · GPI 2025 (163 countries)
    </div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
const mapStore = useMapStore();
const categories = [
  { color: '#1a6b3c', label: 'Very High Peace (1.0–1.5)' },
  { color: '#2d9e5f', label: 'High Peace (1.5–2.0)' },
  { color: '#facc15', label: 'Medium Peace (2.0–2.5)' },
  { color: '#f97316', label: 'Low Peace (2.5–3.0)' },
  { color: '#ef4444', label: 'Very Low Peace (3.0+)' },
];
</script>

<template>
  <div class="panel-box">
    <div class="panel-title">INTELLIGENCE LAYERS</div>
    <label v-for="layer in layers" :key="layer.key" class="toggle-btn">
      <input type="checkbox" v-model="mapStore.show[layer.key]" @change="onToggle(layer.key)">
      <span class="layer-label" :style="{ color: layer.color }">{{ layer.label }}</span>
      <span v-if="layer.count" style="font-size:9px;color:var(--text-muted);margin-left:4px;">{{ layer.count }}</span>
    </label>

    <!-- New layers section -->
    <div style="border-top:1px solid var(--border-color);margin:6px 0 4px;padding-top:6px;">
      <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted);margin-bottom:5px;">── NEW INTELLIGENCE LAYERS ──</div>
      <label class="toggle-btn">
        <input type="checkbox" v-model="mapStore.show.eonet" @change="onToggle('eonet')">
        <span class="layer-label" style="color:#f97316;">🔥 Natural Events (NASA)</span>
        <span style="color:var(--text-muted);font-size:9px;margin-left:4px;">{{ intelStore.eonetCount || '' }}</span>
      </label>
      <label class="toggle-btn">
        <input type="checkbox" v-model="mapStore.show.cables" @change="onToggle('cables')">
        <span class="layer-label" style="color:#8b5cf6;">📡 Undersea Cables</span>
      </label>
      <label class="toggle-btn">
        <input type="checkbox" v-model="mapStore.show.protests" @change="onToggle('protests')">
        <span class="layer-label" style="color:#fbbf24;">📣 Protests / Unrest</span>
        <span style="color:var(--text-muted);font-size:9px;margin-left:4px;">{{ intelStore.protestCount || '' }}</span>
      </label>
      <label class="toggle-btn">
        <input type="checkbox" v-model="mapStore.show.cyber" @change="onToggle('cyber')">
        <span class="layer-label" style="color:#ef4444;">💻 Cyber Threats (APT)</span>
        <span style="color:var(--text-muted);font-size:9px;margin-left:4px;">{{ intelStore.cyberCount || '' }}</span>
      </label>
    </div>

    <!-- Missile/ICBM Alert -->
    <div v-if="intelStore.missileAlert" style="border-top:1px solid var(--border-color);margin:4px 0;padding-top:6px;">
      <div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);border-radius:3px;padding:6px 8px;">
        <div style="font-size:9px;color:#ef4444;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">
          ⚠ MISSILE/ICBM MENTION DETECTED ({{ intelStore.missileAlert.count }})
        </div>
        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">{{ intelStore.missileAlert.latest }}</div>
        <div style="font-size:8px;color:#ef4444;margin-top:2px;">{{ intelStore.missileAlert.source }} · {{ intelStore.missileAlert.time }} UTC</div>
      </div>
    </div>

    <!-- Time filter -->
    <div style="border-top:1px solid var(--border-color);margin:4px 0;padding-top:6px;">
      <div style="font-size:9px;letter-spacing:1px;color:var(--text-muted);margin-bottom:5px;">── EVENT TIME FILTER ──</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;">
        <button v-for="tf in timeFilters" :key="tf.key" class="time-filter-btn" :class="{ active: mapStore.timeFilter === tf.key }"
          @click="mapStore.setTimeFilter(tf.key)">{{ tf.label }}</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import { useIntelStore } from '@/stores/intelStore';
import { useMap } from '@/composables/useMap';

const mapStore = useMapStore();
const intelStore = useIntelStore();
const mapComposable = useMap();

const layers = [
  { key: 'conflict', label: '❌ Active Conflict Zones', color: 'var(--accent-red)' },
  { key: 'hotspot', label: '⚠️ Intel Hotspots', color: 'var(--accent-yellow)' },
  { key: 'air', label: '✈️ Live Aviation (OpenSky)', color: 'var(--accent-cyan)' },
  { key: 'mil', label: '🪖 Military Bases', color: 'var(--accent-purple)' },
  { key: 'nuke', label: '☢️ Nuclear Facilities', color: 'var(--accent-nuke)' },
  { key: 'sat', label: '🛰️ Satellite Tracker (ISS)', color: 'var(--accent-orange)' },
  { key: 'quake', label: '🌍 Seismic Activity (USGS)', color: 'var(--text-main)' },
  { key: 'wea', label: '🌦️ Weather Satellite (IR)', color: 'var(--text-main)' },
  { key: 'gpi', label: '🕊️ GPI 2025 Peace Index', color: '#10b981' },
];

const timeFilters = [
  { key: '1h', label: '1H' }, { key: '6h', label: '6H' }, { key: '24h', label: '24H' },
  { key: '48h', label: '48H' }, { key: '7d', label: '7D' }, { key: 'all', label: 'ALL' },
];

function onToggle(key) {
  mapComposable.applyLayerToggle(key, mapStore.show[key]);
}
</script>

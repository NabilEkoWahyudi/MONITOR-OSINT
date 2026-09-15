<template>
  <div id="left-panel">
    <div class="osint-header">
      <h1>MONITOR <span style="font-size:10px;color:var(--text-muted);">v28</span></h1>
      <div style="display:flex;gap:6px;align-items:center;">
        <span id="audio-indicator" style="font-size:10px;" :style="{ color: mapStore.audioEnabled ? 'var(--accent-green)' : 'var(--text-muted)' }">🔔</span>
        <span class="live-indicator">● LIVE</span>
      </div>
    </div>

    <UtcClock />
    <DefconWidget />
    <LiveMetrics />
    <GpiDashboard />
    <RegionQuickFly />
    <GeoSearch />
    <CallsignTracker />
    <LayersControl />
    <GpiLegend />
    <SatelliteTracker />
    <LiveNews />

    <div style="font-size:10px;padding:4px 0;color:var(--text-muted);border-top:1px solid var(--border-color);margin-top:4px;">
      <span id="sys-status-mil">[RADAR] Standby...</span>
    </div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import UtcClock from '@/components/dashboard/UtcClock.vue';
import GpiDashboard from '@/components/dashboard/GpiDashboard.vue';
import RegionQuickFly from '@/components/dashboard/RegionQuickFly.vue';
import GeoSearch from '@/components/dashboard/GeoSearch.vue';
import CallsignTracker from '@/components/dashboard/CallsignTracker.vue';
import LayersControl from '@/components/dashboard/LayersControl.vue';
import GpiLegend from '@/components/dashboard/GpiLegend.vue';
import SatelliteTracker from '@/components/dashboard/SatelliteTracker.vue';
import LiveNews from '@/components/dashboard/LiveNews.vue';
import LiveMetrics from '@/components/dashboard/LiveMetrics.vue';
import DefconWidget from '@/components/dashboard/DefconWidget.vue';

const mapStore = useMapStore();
</script>

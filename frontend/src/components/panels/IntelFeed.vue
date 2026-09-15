<template>
  <div style="height:100%;display:flex;flex-direction:column;">
    <!-- Conflict / Hotspot feed -->
    <div style="flex:1;overflow-y:auto;border-bottom:1px solid var(--border-color);margin-bottom:10px;padding-bottom:10px;">
      <div style="font-size:10px;color:var(--accent-red);font-weight:bold;margin-bottom:8px;position:sticky;top:0;background:var(--bg-panel);padding:4px 0;z-index:2;">
        🚨 INCIDENT FEED ({{ intelStore.feedCount }})
      </div>
      <div id="incident-feed">
        <div v-for="(item, idx) in intelStore.incidentFeed" :key="idx" class="feed-item" :style="{ borderLeftColor: item.color }"
          @click="flyTo(item)">
          <b>{{ item.type === 'conflict' ? '❌ [WAR]' : '⚠️ [INTEL]' }} {{ item.zone?.name || item.spot?.name }}</b>
          <span class="feed-time">Threat: {{ item.zone?.threat || item.spot?.threat }}</span>
        </div>
      </div>
    </div>

    <!-- Live RSS feed -->
    <div style="flex:1;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg-panel);padding:4px 0;z-index:2;margin-bottom:8px;">
        <div style="font-size:10px;color:var(--accent-cyan);font-weight:bold;">📡 LIVE GLOBAL FEED</div>
        <div style="font-size:9px;color:var(--text-muted);" id="intel-feed-time">{{ intelStore.intelFeedTime }}</div>
      </div>
      <div id="live-intel-feed" style="font-size:11px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;">
        <div v-if="intelStore.intelFeedItems.length === 0" style="font-style:italic;">Intercepting data...</div>
        <div v-for="(item, idx) in intelStore.intelFeedItems" :key="idx" class="intel-item"
          @click="openUrl(item.link)">
          <div class="intel-src" :class="item.cls">{{ item.source || item.src }}</div>
          <div class="intel-title">{{ item.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIntelStore } from '@/stores/intelStore';
import { useMapStore } from '@/stores/mapStore';

const intelStore = useIntelStore();
const mapStore = useMapStore();

function flyTo(item) {
  let lat, lng;
  if (item.type === 'conflict') {
    lat = (item.zone.bounds[0][0] + item.zone.bounds[1][0]) / 2;
    lng = (item.zone.bounds[0][1] + item.zone.bounds[1][1]) / 2;
    mapStore.flyTo(lat, lng, 5);
  } else {
    lat = item.spot.lat;
    lng = item.spot.lng;
    mapStore.flyTo(lat, lng, 6);
  }
}

function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

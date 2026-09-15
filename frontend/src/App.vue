<template>
  <div id="app-root" :class="{ 'dim-mode': mapStore.dimMode }">
    <!-- Dim overlay -->
    <div id="dim-overlay"></div>

    <!-- Toast notification system -->
    <ToastSystem ref="toastRef" />

    <!-- News Ticker (top bar) -->
    <NewsTicker />

    <!-- Main Layout -->
    <div id="layout">
      <!-- Left Panel -->
      <LeftPanel />

      <!-- Map + Canvas -->
      <div id="map-area">
        <MapView />
        <CyberCanvas />
        <MapControls />
        <CoordBar />
        <!-- Weather layer type switcher (visible when wea is active) -->
        <WeatherControl />
        <!-- API Status Bar (bottom of map area) -->
        <ApiStatusBar />
      </div>

      <!-- Right Panel -->
      <RightPanel />
    </div>

    <!-- Media Hub Toggle Button (replaces old chat button) -->
    <button id="chat-toggle-btn" @click="mediaHubOpen = !mediaHubOpen">
      📡 MEDIA HUB
      <span v-if="chatComposable.unreadCount.value > 0" class="unread-badge">
        {{ chatComposable.unreadCount.value }}
      </span>
    </button>

    <!-- Media Hub (unified: streams, webcams, chat) -->
    <MediaHub :visible="mediaHubOpen" :chat="chatComposable" @close="mediaHubOpen = false" />

    <!-- Econ Modal -->
    <EconModal />

    <!-- EONET Legend -->
    <div id="eonet-legend" :style="{ display: mapStore.show.eonet ? 'block' : 'none' }">
      <div style="color:#f97316;letter-spacing:1px;margin-bottom:5px;font-weight:bold;">🌍 NASA EONET — GLOBAL</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;color:var(--text-muted);">
        <span>🔥 Wildfire</span><span>🌋 Volcano</span>
        <span>🌊 Flood</span><span>🌀 Storm</span>
        <span>🌪️ Cyclone</span><span>⚡ Earthquake</span>
        <span>🏜️ Drought</span><span>⛰️ Landslide</span>
        <span>🧊 Sea Ice</span><span>❄️ Snow</span>
      </div>
      <div style="margin-top:5px;color:#64748b;font-size:8px;">Source: NASA EONET v3 · No Key · Global</div>
    </div>

    <!-- Cyber Legend -->
    <div id="cyber-legend" :style="{ display: mapStore.cyberActive ? 'block' : 'none' }">
      <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;letter-spacing:1px;">CYBER ATTACKS (SIMULATED)</div>
      <div class="cyber-legend-item"><div class="cyber-dot" style="background:#ef4444;"></div> DDoS / Botnet</div>
      <div class="cyber-legend-item"><div class="cyber-dot" style="background:#a855f7;"></div> Ransomware</div>
      <div class="cyber-legend-item"><div class="cyber-dot" style="background:#facc15;"></div> Phishing / APT</div>
      <div class="cyber-legend-item"><div class="cyber-dot" style="background:#06b6d4;"></div> Recon / Scan</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onErrorCaptured } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { useIntelStore } from '@/stores/intelStore';
import { useEconStore } from '@/stores/econStore';
import { useMap } from '@/composables/useMap';
import { useChat } from '@/composables/useChat';

import NewsTicker from '@/components/layout/NewsTicker.vue';
import LeftPanel from '@/components/layout/LeftPanel.vue';
import RightPanel from '@/components/layout/RightPanel.vue';
import CoordBar from '@/components/layout/CoordBar.vue';
import ApiStatusBar from '@/components/layout/ApiStatusBar.vue';
import ToastSystem from '@/components/layout/ToastSystem.vue';
import MapView from '@/components/map/MapView.vue';
import CyberCanvas from '@/components/map/CyberCanvas.vue';
import MapControls from '@/components/map/MapControls.vue';
import MediaHub from '@/components/panels/MediaHub.vue';
import EconModal from '@/components/panels/EconModal.vue';
import WeatherControl from '@/components/dashboard/WeatherControl.vue';

const mapStore = useMapStore();
const intelStore = useIntelStore();
const econStore = useEconStore();
const mapComposable = useMap();
const chatComposable = useChat();
const toastRef = ref(null);
const mediaHubOpen = ref(false);

onMounted(async () => {
  chatComposable.initChat();

  setTimeout(() => {
    toastRef.value?.addToast('info', 'SISTEM ONLINE', 'MONITOR OSINT v28 aktif. Semua layer siap.', 7000);
  }, 2000);

  setTimeout(() => {
    toastRef.value?.addToast('success', 'MEDIA HUB READY', 'Live streams, webcams & chat tersedia di tombol MEDIA HUB', 8000);
  }, 4000);
});

onUnmounted(() => {
  // Clean up chat socket to prevent zombie connections
  chatComposable.destroy();
});

// Global error boundary — catch component errors, show toast instead of white screen
onErrorCaptured((err, instance, info) => {
  console.error('[App Error]', err, info);
  toastRef.value?.addToast('critical', 'SYSTEM ERROR', `Component error: ${err.message || 'Unknown error'}`, 10000);
  return false; // Prevent error from propagating (avoids white screen)
});
</script>

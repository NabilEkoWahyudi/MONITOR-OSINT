<template>
  <div id="right-panel">
    <div class="osint-header">
      <h1 style="color:var(--accent-yellow);">INTEL HQ</h1>
      <span id="intel-status" class="status-badge badge-cyan">{{ mapStore.intelStatus }}</span>
    </div>

    <!-- TAB BAR -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: mapStore.activeTab === 'target' }" @click="mapStore.setActiveTab('target')">🎯 TARGET</button>
      <button class="tab-btn" :class="{ active: mapStore.activeTab === 'intel' }" @click="mapStore.setActiveTab('intel')">📡 INTEL</button>
      <button class="tab-btn" :class="{ active: mapStore.activeTab === 'market' }" @click="mapStore.setActiveTab('market')">📈 MARKET</button>
      <button class="tab-btn" :class="{ active: mapStore.activeTab === 'econ' }" @click="mapStore.setActiveTab('econ')">🌐 ECON</button>
    </div>

    <!-- TAB: TARGET -->
    <div class="tab-pane" :class="{ active: mapStore.activeTab === 'target' }" style="flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
      <IntelDisplay />
    </div>

    <!-- TAB: INTEL FEED -->
    <div class="tab-pane" :class="{ active: mapStore.activeTab === 'intel' }" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
      <IntelFeed />
    </div>

    <!-- TAB: MARKET -->
    <div class="tab-pane" :class="{ active: mapStore.activeTab === 'market' }" style="flex:1;overflow-y:auto;">
      <MarketPanel />
    </div>

    <!-- TAB: ECON -->
    <div class="tab-pane" :class="{ active: mapStore.activeTab === 'econ' }" style="flex:1;overflow-y:auto;">
      <EconPanel />
    </div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import IntelDisplay from '@/components/panels/IntelDisplay.vue';
import IntelFeed from '@/components/panels/IntelFeed.vue';
import MarketPanel from '@/components/panels/MarketPanel.vue';
import EconPanel from '@/components/panels/EconPanel.vue';

const mapStore = useMapStore();
</script>

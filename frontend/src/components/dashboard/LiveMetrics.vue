<template>
  <div class="panel-box spark-widget">
    <div class="panel-title">📊 LIVE METRICS</div>
    <div class="spark-row">
      <div class="spark-info">
        <div class="spark-label">✈️ Pesawat Aktif</div>
        <div class="spark-val" style="color:var(--accent-cyan)">{{ intelStore.planeCount || '—' }}</div>
      </div>
      <SparkLine :data="intelStore.planeHistory" color="#06b6d4" :width="110" :height="36"/>
    </div>
    <div class="spark-row">
      <div class="spark-info">
        <div class="spark-label">🌍 Gempa (4.5+)</div>
        <div class="spark-val" style="color:var(--accent-orange)">{{ intelStore.quakeCount || '—' }}</div>
      </div>
      <SparkLine :data="intelStore.quakeHistory" color="#f97316" :width="110" :height="36"/>
    </div>
    <div class="spark-row">
      <div class="spark-info">
        <div class="spark-label">❌ Zona Konflik</div>
        <div class="spark-val" style="color:var(--accent-red)">{{ intelStore.conflictCount || '—' }}</div>
      </div>
      <SparkLine :data="intelStore.conflictHistory" color="#ef4444" :width="110" :height="36"/>
    </div>
  </div>
</template>

<script setup>
import SparkLine from './SparkLine.vue';
import { useIntelStore } from '@/stores/intelStore';
const intelStore = useIntelStore();
</script>

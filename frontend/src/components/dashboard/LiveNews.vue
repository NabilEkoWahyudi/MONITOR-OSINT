<template>
  <div class="panel-box">
    <div class="panel-title">📰 GDELT / LIVE NEWS (BETA)</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;">Deteksi insiden & konflik global via NLP</div>
    <div v-if="intelStore.dynConflicts.length === 0" style="color:var(--text-muted);font-size:10px;font-style:italic;">
      Menunggu scanning berita...
    </div>
    <div v-else style="display:flex;flex-direction:column;gap:5px;">
      <div v-for="(c, i) in intelStore.dynConflicts" :key="i"
        style="font-size:10px;padding:5px;background:rgba(239,68,68,.1);border-left:2px solid var(--accent-red);cursor:pointer;"
        @click="openUrl(c.link)">
        <div style="color:var(--text-main);line-height:1.4;">{{ c.title }}</div>
        <div style="color:var(--accent-red);font-size:8px;margin-top:3px;font-weight:bold;">POSSIBLE CONFLICT DETECTED</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIntelStore } from '@/stores/intelStore';
const intelStore = useIntelStore();

function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

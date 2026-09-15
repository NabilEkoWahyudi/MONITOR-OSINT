<template>
  <div class="panel-box">
    <div class="panel-title">🔍 GEO-INTEL SEARCH</div>
    <div style="display:flex;gap:5px;">
      <input type="text" v-model="query" class="input-field" placeholder="Cari kota, markas, koordinat..."
        @keypress.enter="search">
      <button class="btn-search" @click="search">CARI</button>
    </div>
    <div style="font-size:10px;height:12px;margin-top:4px;transition:.3s;"
      :style="{ color: statusColor }" v-html="status"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMap } from '@/composables/useMap';

const query = ref('');
const status = ref('');
const statusColor = ref('var(--accent-yellow)');
const mapComposable = useMap();

async function search() {
  if (!query.value.trim()) return;
  status.value = '<span style="color:var(--text-muted);">⟳ Scanning...</span>';
  const result = await mapComposable.executeSearch(query.value.trim());
  if (result) {
    const isError = result.startsWith('[ERR]');
    statusColor.value = isError ? 'var(--accent-red)' : 'var(--accent-cyan)';
    status.value = result;
  }
}
</script>

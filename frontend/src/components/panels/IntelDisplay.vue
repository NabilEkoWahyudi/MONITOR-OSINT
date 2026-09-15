<template>
  <div id="intel-display" style="height:100%;padding-right:4px;" v-html="mapStore.intelDisplay"></div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
const mapStore = useMapStore();
</script>

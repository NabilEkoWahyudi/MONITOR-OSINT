<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="sparkline">
    <!-- Grid lines -->
    <line v-for="i in 4" :key="'g'+i"
      x1="0" :x2="width"
      :y1="(height / 4) * i" :y2="(height / 4) * i"
      stroke="rgba(255,255,255,0.05)" stroke-width="1"
    />
    <!-- Gradient fill -->
    <defs>
      <linearGradient :id="'sg'+uid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.3"/>
        <stop offset="100%" :stop-color="color" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path v-if="fillPath" :d="fillPath" :fill="`url(#sg${uid})`"/>
    <path v-if="linePath" :d="linePath" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Last point dot -->
    <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="2.5" :fill="color"/>
  </svg>
</template>

<script setup>
import { computed, ref } from 'vue';

const uid = Math.random().toString(36).slice(2, 8);

const props = defineProps({
  data: { type: Array, default: () => [] },
  color: { type: String, default: '#06b6d4' },
  width: { type: Number, default: 120 },
  height: { type: Number, default: 32 },
});

const points = computed(() => {
  if (!props.data || props.data.length < 2) return [];
  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const range = max - min || 1;
  const pad = 3;
  return props.data.map((v, i) => ({
    x: (i / (props.data.length - 1)) * (props.width - pad * 2) + pad,
    y: props.height - pad - ((v - min) / range) * (props.height - pad * 2),
  }));
});

const linePath = computed(() => {
  if (!points.value.length) return '';
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
});

const fillPath = computed(() => {
  if (!points.value.length) return '';
  const line = points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const last = points.value[points.value.length - 1];
  const first = points.value[0];
  return `${line} L${last.x},${props.height} L${first.x},${props.height} Z`;
});

const lastPoint = computed(() => points.value[points.value.length - 1]);
</script>

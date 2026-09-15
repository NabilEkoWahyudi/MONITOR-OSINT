<template>
  <canvas id="cyber-canvas" ref="canvasEl" :style="{ display: mapStore.cyberActive ? 'block' : 'none' }"></canvas>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useMapStore } from '@/stores/mapStore';

const mapStore = useMapStore();
const canvasEl = ref(null);
let animFrame = null;
let attacks = [];

const SOURCES = [
  { lat: 39.9, lng: 116.4 }, { lat: 55.75, lng: 37.6 }, { lat: 37.5, lng: 127.0 },
  { lat: 35.68, lng: 139.7 }, { lat: 51.5, lng: -0.12 }, { lat: 48.85, lng: 2.35 },
  { lat: 40.71, lng: -74.0 }, { lat: 37.77, lng: -122.4 }, { lat: 28.6, lng: 77.2 },
  { lat: -23.5, lng: -46.6 }, { lat: 1.3, lng: 103.8 },
];
const TYPES = [
  { color: '#ef4444' }, { color: '#a855f7' }, { color: '#facc15' }, { color: '#06b6d4' }
];

function latLngToXY(lat, lng, W, H) {
  return { x: (lng + 180) / 360 * W, y: (90 - lat) / 180 * H };
}

function spawn() {
  const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const dst = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  attacks.push({ ...src, dstLat: dst.lat, dstLng: dst.lng, color: type.color, progress: 0, speed: 0.008 + Math.random() * 0.012 });
}

function draw() {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (Math.random() < 0.08) spawn();
  attacks = attacks.filter(a => !a.done);
  attacks.forEach(a => {
    a.progress = Math.min(1, a.progress + a.speed);
    if (a.progress >= 1) { a.done = true; return; }
    const s = latLngToXY(a.lat, a.lng, W, H);
    const d = latLngToXY(a.dstLat, a.dstLng, W, H);
    const mx = (s.x + d.x) / 2, my = Math.min(s.y, d.y) - Math.abs(d.x - s.x) * 0.3;
    const t = a.progress;
    const bx = (1-t)*(1-t)*s.x + 2*(1-t)*t*mx + t*t*d.x;
    const by = (1-t)*(1-t)*s.y + 2*(1-t)*t*my + t*t*d.y;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.strokeStyle = a.color + '55'; ctx.lineWidth = 0.8; ctx.stroke();
    const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 5);
    grd.addColorStop(0, a.color); grd.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  });
  if (mapStore.cyberActive) animFrame = requestAnimationFrame(draw);
}

watch(() => mapStore.cyberActive, (active) => {
  if (active) {
    const canvas = canvasEl.value;
    if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    attacks = [];
    draw();
  } else {
    if (animFrame) cancelAnimationFrame(animFrame);
  }
});

onUnmounted(() => { if (animFrame) cancelAnimationFrame(animFrame); });
</script>

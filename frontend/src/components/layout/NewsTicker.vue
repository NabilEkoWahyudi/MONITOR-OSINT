<template>
  <div id="news-ticker">
    <div id="ticker-label">⚡ LIVE INTEL</div>
    <div id="ticker-track" ref="trackRef" style="overflow:hidden;position:relative;">
      <div ref="innerRef" class="ticker-inner" style="animation:none;position:absolute;white-space:nowrap;will-change:transform;">
        {{ displayText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useIntelStore } from '@/stores/intelStore';
import { useMap } from '@/composables/useMap';

const intelStore = useIntelStore();
const mapComposable = useMap();
const trackRef = ref(null);
const innerRef = ref(null);

// Single text — tidak diduplikat di sini, duplikasi via displayText
const singleText = computed(() => {
  if (!intelStore.tickerItems.length) return '◈ Connecting to global intelligence network... Stand by...';
  return intelStore.tickerItems.map(i => `◈  [${i.source || i.src}] ${(i.title || '').toUpperCase()}`).join('     ');
});

// Teks yang ditampilkan = duplikat 3x agar scroll terasa seamless
const displayText = computed(() => {
  const t = singleText.value + '          ';
  return t + t + t;
});

// JS-driven scroll — tidak pernah restart saat data berubah
let animId = null;
let posX = 0;
const SPEED = 0.6; // pixel per frame (~36px/detik on 60fps)

function scrollTick() {
  const inner = innerRef.value;
  const track = trackRef.value;
  if (!inner || !track) { animId = requestAnimationFrame(scrollTick); return; }

  posX -= SPEED;

  // Reset ketika sudah geser sejauh 1/3 panjang total (satu salinan teks)
  const totalWidth = inner.scrollWidth;
  const oneThird = totalWidth / 3;
  if (Math.abs(posX) >= oneThird) {
    posX = 0;
  }

  inner.style.transform = `translateX(${posX}px)`;
  animId = requestAnimationFrame(scrollTick);
}

let newsInterval = null;

onMounted(() => {
  // Posisi awal — mulai dari ujung kanan layar
  posX = trackRef.value ? trackRef.value.clientWidth : window.innerWidth;
  animId = requestAnimationFrame(scrollTick);

  mapComposable.fetchGlobalNews();
  newsInterval = setInterval(mapComposable.fetchGlobalNews, 10 * 60 * 1000);
});

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId);
  if (newsInterval) clearInterval(newsInterval);
});
</script>


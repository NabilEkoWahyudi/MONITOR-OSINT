<template>
  <!-- DEFCON Widget -->
  <div class="panel-box defcon-widget">
    <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center;">
      <span>⚡ DEFCON STATUS</span>
      <a href="https://www.defconlevel.com" target="_blank" rel="noopener" style="font-size:8px;color:var(--text-muted);text-decoration:none;">defconlevel.com ↗</a>
    </div>

    <div class="defcon-display">
      <div class="defcon-levels">
        <div v-for="n in 5" :key="n" class="defcon-level-block" :class="{ active: n === currentLevel, higher: n > currentLevel }">
          <span class="defcon-num">{{ n }}</span>
        </div>
      </div>
      <div class="defcon-info">
        <div class="defcon-badge" :style="{ color: levelData.color, borderColor: levelData.color + '44', background: levelData.color + '18' }">
          DEFCON {{ currentLevel }}
        </div>
        <div class="defcon-label">{{ levelData.label }}</div>
        <div class="defcon-desc">{{ levelData.desc }}</div>
      </div>
    </div>

    <div class="defcon-footer">
      <span>🕐 {{ utcTime }}</span>
      <span style="color:var(--text-muted);">Unverified OSINT estimate</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// DEFCON levels info
const LEVELS = {
  1: { color: '#ef4444', label: 'MAXIMUM READINESS', desc: 'Nuclear war imminent. Full military readiness.' },
  2: { color: '#f97316', label: 'FAST PACE', desc: 'Armed forces ready to deploy within 6 hours.' },
  3: { color: '#facc15', label: 'ROUND HOUSE', desc: 'Air force ready within 15 minutes. Increased readiness.' },
  4: { color: '#60a5fa', label: 'DOUBLE TAKE', desc: 'Increased intelligence watchfulness. Elevated tensions.' },
  5: { color: '#10b981', label: 'FADE OUT', desc: 'Normal peacetime military readiness. Lowest state.' },
};

// NOTE: Real DEFCON is classified. This displays a publicly-estimated value.
// Current global tension level — update manually or fetch from defconlevel.com
const currentLevel = ref(3);

const levelData = computed(() => LEVELS[currentLevel.value]);

const utcTime = ref('--:--:-- UTC');
let timer;
onMounted(() => {
  const tick = () => {
    const now = new Date();
    utcTime.value = now.toUTCString().substring(17, 25) + ' UTC';
  };
  tick();
  timer = setInterval(tick, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>

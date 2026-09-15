<template>
  <div class="panel-box" id="threat-dashboard">
    <div class="panel-title">🕊️ GPI 2025 — WORLD OVERVIEW
      <span style="font-size:9px;color:var(--accent-green);">IEP Official</span>
    </div>
    <!-- World Average Ring -->
    <div class="global-threat-ring">
      <div class="threat-ring" :style="{ borderColor: ringColor, color: ringColor }">
        <div class="threat-ring-val" style="font-size:18px;">{{ avg }}</div>
        <div class="threat-ring-lbl">AVG GPI</div>
      </div>
      <div style="margin-left:14px;flex:1;">
        <div style="font-size:12px;font-weight:bold;margin-bottom:4px;" :style="{ color: ringColor }">{{ ringLabel }}</div>
        <div style="font-size:9px;color:var(--text-muted);line-height:1.5;">{{ desc }}</div>
      </div>
    </div>
    <!-- Distribution bars -->
    <div v-for="cat in categories" :key="cat.id" class="defcon-row">
      <div class="defcon-label" :style="{ color: cat.color }">{{ cat.label }}</div>
      <div class="defcon-bars">
        <div v-for="i in 10" :key="i" class="defcon-bar"
          :class="{ active: i <= cat.filled }"
          :style="i <= cat.filled ? { background: cat.color, borderColor: cat.color, boxShadow: `0 0 3px ${cat.color}55` } : {}">
        </div>
      </div>
      <div class="defcon-val" :style="{ color: cat.color }">{{ cat.count }} neg</div>
    </div>
    <!-- Top/Bottom -->
    <div style="display:flex;gap:6px;margin-top:8px;">
      <div style="flex:1;background:#0a1a0a;border:1px solid #1a6b3c;border-radius:3px;padding:6px;">
        <div style="font-size:9px;color:#2d9e5f;font-weight:bold;margin-bottom:4px;">🏆 TOP 3 DAMAI</div>
        <div style="font-size:9px;color:var(--text-muted);line-height:1.8;" v-html="top3Html"></div>
      </div>
      <div style="flex:1;background:#1a0a0a;border:1px solid #7f1d1d;border-radius:3px;padding:6px;">
        <div style="font-size:9px;color:#ef4444;font-weight:bold;margin-bottom:4px;">⚠️ TOP 3 KONFLIK</div>
        <div style="font-size:9px;color:var(--text-muted);line-height:1.8;" v-html="bot3Html"></div>
      </div>
    </div>
    <div style="font-size:9px;color:var(--text-muted);margin-top:8px;border-top:1px solid var(--border-color);padding-top:6px;">
      📊 <span style="color:var(--accent-cyan);">Institute for Economics & Peace</span> · GPI 2025 · 163 countries
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { GPI_2025, getGPIColor } from '@/data/gpiData';

const sorted = [...GPI_2025].sort((a, b) => a.score - b.score);
const total = sorted.length;
const avgVal = sorted.reduce((s, c) => s + c.score, 0) / total;
const avg = computed(() => avgVal.toFixed(2));
const { color: ringColor, label: ringLabel } = getGPIColor(avgVal);

const desc = computed(() => {
  const vhp = sorted.filter(c => c.score <= 1.5).length;
  const hp = sorted.filter(c => c.score > 1.5 && c.score <= 2.0).length;
  const lp = sorted.filter(c => c.score > 2.5 && c.score <= 3.0).length;
  const vlp = sorted.filter(c => c.score > 3.0).length;
  return `${vhp + hp} countries (${Math.round((vhp + hp) / total * 100)}%) damai, ${lp + vlp} (${Math.round((lp + vlp) / total * 100)}%) konflik dari ${total} data.`;
});

const categories = computed(() => {
  const cats = [
    { id: 'vhp', label: 'VERY PEACE', color: '#1a6b3c', min: 0, max: 1.5 },
    { id: 'hp', label: 'HIGH PEACE', color: '#2d9e5f', min: 1.5, max: 2.0 },
    { id: 'mp', label: 'MEDIUM', color: '#facc15', min: 2.0, max: 2.5 },
    { id: 'lp', label: 'LOW PEACE', color: '#f97316', min: 2.5, max: 3.0 },
    { id: 'vlp', label: 'CONFLICT', color: '#ef4444', min: 3.0, max: 99 },
  ];
  return cats.map(cat => {
    const count = sorted.filter(c => c.score > cat.min && c.score <= cat.max).length;
    return { ...cat, count, filled: Math.round((count / total) * 10) };
  });
});

const top3Html = computed(() =>
  sorted.slice(0, 3).map(c => `<span style="color:var(--text-main);">${c.name}</span> <span style="color:#2d9e5f;">${c.score.toFixed(2)}</span>`).join('<br>')
);
const bot3Html = computed(() =>
  sorted.slice(-3).reverse().map(c => `<span style="color:var(--text-main);">${c.name}</span> <span style="color:#ef4444;">${c.score.toFixed(2)}</span>`).join('<br>')
);
</script>

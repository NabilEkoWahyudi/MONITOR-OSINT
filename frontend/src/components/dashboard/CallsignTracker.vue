<template>
  <div class="panel-box">
    <div class="panel-title">🎯 CALLSIGN TRACKER
      <span style="font-size:9px;color:var(--accent-cyan);margin-left:4px;">{{ watchlist.length > 0 ? watchlist.length + ' tracked' : '' }}</span>
    </div>
    <div style="display:flex;gap:5px;margin-bottom:5px;">
      <input type="text" v-model="cs" class="input-field" placeholder="e.g. SQ321, BOE747, RCH..."
        style="text-transform:uppercase;flex:1;" @keypress.enter="track">
      <button class="btn-search" @click="track" style="white-space:nowrap;padding:0 10px;">TRACK ▶</button>
    </div>
    <div style="font-size:9px;min-height:14px;margin-bottom:4px;color:var(--text-muted);">{{ statusMsg }}</div>
    <div style="min-height:12px;display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">
      <span v-for="tag in watchlist" :key="tag" class="kw-tag" style="cursor:pointer;background:rgba(6,182,212,.15);color:var(--accent-cyan);border:1px solid rgba(6,182,212,.3);padding:2px 5px;font-size:9px;border-radius:2px;"
        @click="removeTag(tag)">{{ tag }} ✕</span>
    </div>
    <div style="font-size:9px;color:var(--text-muted);line-height:1.5;">Flies to aircraft + loads intel. Presets:</div>
    <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:3px;">
      <span v-for="p in presets" :key="p.cs" class="kw-tag" style="cursor:pointer;font-size:9px;padding:2px 5px;"
        :title="p.label" @click="trackPreset(p.cs)">{{ p.cs }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMap } from '@/composables/useMap';
import { useIntelStore } from '@/stores/intelStore';

const cs = ref('');
const statusMsg = ref('');
const mapComposable = useMap();
const intelStore = useIntelStore();
const watchlist = ref([]);

const presets = [
  { cs: 'RCH', label: 'USAF Air Mobility' },
  { cs: 'SAM', label: 'Special Air Mission' },
  { cs: 'REACH', label: 'USAF Strategic Airlift' },
  { cs: 'NVC', label: 'US Navy' },
  { cs: 'FORTE', label: 'USAF Nightwatch E-4B' },
];

function track() {
  const result = mapComposable.trackCallsign(cs.value);
  statusMsg.value = result;
  if (cs.value.trim() && !watchlist.value.includes(cs.value.trim().toUpperCase())) {
    watchlist.value.push(cs.value.trim().toUpperCase());
  }
}

function trackPreset(p) {
  cs.value = p;
  track();
}

function removeTag(tag) {
  watchlist.value = watchlist.value.filter(t => t !== tag);
}
</script>

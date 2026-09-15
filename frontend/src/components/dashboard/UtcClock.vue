<template>
  <div class="panel-box">
    <div class="clock-wrap">
      <div class="clock-block"><span class="clock-val">{{ h }}</span><span class="clock-lbl">HOUR</span></div>
      <div style="display:flex;align-items:center;color:var(--accent-cyan);font-size:20px;padding:0 2px;font-weight:bold;" class="blink">:</div>
      <div class="clock-block"><span class="clock-val">{{ m }}</span><span class="clock-lbl">MIN</span></div>
      <div style="display:flex;align-items:center;color:var(--accent-cyan);font-size:20px;padding:0 2px;font-weight:bold;" class="blink">:</div>
      <div class="clock-block"><span class="clock-val">{{ s }}</span><span class="clock-lbl">SEC</span></div>
      <div class="clock-block" style="flex:1.8;background:rgba(6,182,212,.05);border-color:rgba(6,182,212,.2);">
        <span class="clock-val" style="font-size:11px;color:var(--text-muted);">{{ dateStr }}</span>
        <span class="clock-lbl">UTC DATE</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const h = ref('00'), m = ref('00'), s = ref('00'), dateStr = ref('---');
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function tick() {
  const now = new Date();
  h.value = String(now.getUTCHours()).padStart(2, '0');
  m.value = String(now.getUTCMinutes()).padStart(2, '0');
  s.value = String(now.getUTCSeconds()).padStart(2, '0');
  dateStr.value = `${DAYS[now.getUTCDay()]} ${String(now.getUTCDate()).padStart(2, '0')}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

let timer;
onMounted(() => { tick(); timer = setInterval(tick, 1000); });
onUnmounted(() => clearInterval(timer));
</script>

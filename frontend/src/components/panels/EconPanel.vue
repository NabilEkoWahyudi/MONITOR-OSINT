<template>
  <div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:10px;color:var(--accent-cyan);font-weight:bold;margin-bottom:4px;">🌐 WORLD BANK MACRO</div>
    
    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:4px;border:1px solid var(--border-color);">
      <div style="font-size:11px;font-weight:bold;color:var(--text-main);margin-bottom:6px;">Global Indicators (WLD)</div>
      <table class="data-table" v-if="!econStore.loading"><tbody>
        <tr><td class="lbl">Global GDP</td><td class="val" style="color:#10b981;font-weight:bold;">{{ econStore.macro.gdp }}</td></tr>
        <tr><td class="lbl">Population</td><td class="val">{{ econStore.macro.population }}</td></tr>
        <tr><td class="lbl">Trade (% GDP)</td><td class="val">{{ econStore.macro.trade }}</td></tr>
        <tr><td class="lbl">CO2 Emissions</td><td class="val" style="color:#f97316;">{{ econStore.macro.co2 }}</td></tr>
      </tbody></table>
      <div v-else style="font-size:10px;color:var(--text-muted);text-align:center;padding:10px;">Fetching World Bank API...</div>
    </div>

    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:4px;border:1px solid var(--border-color);" v-if="econStore.countryData">
      <div style="font-size:11px;font-weight:bold;color:var(--text-main);margin-bottom:6px;display:flex;justify-content:space-between;">
        <span>Target: {{ econStore.countryName }}</span>
        <span style="color:var(--accent-cyan);font-size:9px;">LIVE API</span>
      </div>
      <table class="data-table"><tbody>
        <tr v-for="ind in econStore.countryData" :key="ind.label">
          <td class="lbl">{{ ind.label }}</td>
          <td class="val" :style="{ color: ind.label.includes('GDP') ? '#10b981' : ind.label.includes('Inflation') || ind.label.includes('Unemployment') ? '#f97316' : 'var(--text-main)' }">
            {{ ind.value }} <span style="font-size:8px;color:var(--text-muted);">{{ ind.year }}</span>
          </td>
        </tr>
      </tbody></table>
    </div>
    <div v-else style="font-size:10px;color:var(--text-muted);text-align:center;padding:20px;border:1px dashed var(--border-color);border-radius:4px;">
      Click a country (GPI point) on the map to load real-time economic data.
    </div>

    <button @click="mapStore.econModalOpen = true" style="margin-top:10px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);color:var(--accent-cyan);padding:8px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:10px;letter-spacing:1px;width:100%;">
      OPEN FULL ECONOMIC DASHBOARD
    </button>
  </div>
</template>

<script setup>
import { useEconStore } from '@/stores/econStore';
import { useMapStore } from '@/stores/mapStore';

const econStore = useEconStore();
const mapStore = useMapStore();
</script>

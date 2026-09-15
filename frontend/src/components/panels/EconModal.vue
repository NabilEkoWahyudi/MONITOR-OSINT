<template>
  <div v-if="mapStore.econModalOpen" id="econ-modal">
    <div id="econ-modal-content">
      <button id="econ-close" @click="mapStore.econModalOpen = false">✖</button>
      
      <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;border-bottom:1px solid rgba(250,204,21,0.3);padding-bottom:10px;">
        <div style="font-size:24px;color:#facc15;font-weight:bold;letter-spacing:2px;">GLOBAL ECONOMIC MONITOR</div>
        <div style="font-size:10px;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:3px;">
          WORLD BANK API INTEGRATION
        </div>
      </div>
      
      <div id="econ-tabs">
        <button class="econ-tab-btn" :class="{ active: mapStore.econModalTab === 'global' }" @click="mapStore.econModalTab = 'global'">MACRO GLOBAL</button>
        <button class="econ-tab-btn" :class="{ active: mapStore.econModalTab === 'regional' }" @click="mapStore.econModalTab = 'regional'">REGIONAL (Dummy)</button>
        <button class="econ-tab-btn" :class="{ active: mapStore.econModalTab === 'national' }" @click="mapStore.econModalTab = 'national'">NATIONAL TARGET</button>
      </div>
      
      <div id="econ-content">
        <!-- GLOBAL TAB -->
        <div v-if="mapStore.econModalTab === 'global'" class="econ-pane">
          <div style="font-size:14px;color:var(--accent-cyan);margin-bottom:15px;">World Bank Global Macroeconomic Indicators (WLD)</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;">
            <div class="econ-card">
              <div class="econ-card-title">Gross Domestic Product</div>
              <div class="econ-card-val" style="color:#10b981;">{{ econStore.macro.gdp }}</div>
              <div class="econ-card-desc">Total economic output globally</div>
            </div>
            <div class="econ-card">
              <div class="econ-card-title">Total Population</div>
              <div class="econ-card-val">{{ econStore.macro.population }}</div>
              <div class="econ-card-desc">Global human population</div>
            </div>
            <div class="econ-card">
              <div class="econ-card-title">Trade (% of GDP)</div>
              <div class="econ-card-val" style="color:#3b82f6;">{{ econStore.macro.trade }}</div>
              <div class="econ-card-desc">Sum of exports and imports</div>
            </div>
            <div class="econ-card">
              <div class="econ-card-title">CO2 Emissions (kt)</div>
              <div class="econ-card-val" style="color:#f97316;">{{ econStore.macro.co2 }}</div>
              <div class="econ-card-desc">Total carbon dioxide emissions</div>
            </div>
          </div>
        </div>
        
        <!-- REGIONAL TAB -->
        <div v-if="mapStore.econModalTab === 'regional'" class="econ-pane">
          <div style="font-size:14px;color:var(--accent-cyan);margin-bottom:15px;">Regional Economic Blocs (Placeholder)</div>
          <div style="color:var(--text-muted);font-size:12px;margin-bottom:20px;">This section requires premium API or extensive multi-query World Bank fetching. Displaying structure only.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
            <div style="background:rgba(255,255,255,0.03);border:1px solid #1e3a5f;padding:15px;border-radius:4px;">
              <h3 style="color:#facc15;margin-bottom:10px;">ASEAN</h3>
              <table class="data-table" style="font-size:12px;"><tbody>
                <tr><td class="lbl">Combined GDP</td><td class="val">~$3.6T</td></tr>
                <tr><td class="lbl">Growth Rate</td><td class="val" style="color:#10b981;">+4.5%</td></tr>
              </tbody></table>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid #1e3a5f;padding:15px;border-radius:4px;">
              <h3 style="color:#facc15;margin-bottom:10px;">European Union</h3>
              <table class="data-table" style="font-size:12px;"><tbody>
                <tr><td class="lbl">Combined GDP</td><td class="val">~$18.3T</td></tr>
                <tr><td class="lbl">Growth Rate</td><td class="val" style="color:#10b981;">+0.8%</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>
        
        <!-- NATIONAL TAB -->
        <div v-if="mapStore.econModalTab === 'national'" class="econ-pane">
          <div style="font-size:14px;color:var(--accent-cyan);margin-bottom:15px;">National Economic Target</div>
          <div v-if="econStore.loading" style="text-align:center;padding:40px;color:var(--accent-cyan);">
            Fetching World Bank API...
          </div>
          <div v-else-if="econStore.countryData" style="display:flex;gap:20px;">
            <div style="flex:1;">
              <div style="font-size:20px;font-weight:bold;color:#facc15;margin-bottom:15px;">{{ econStore.countryName }}</div>
              <table class="data-table" style="font-size:13px;">
                <tr v-for="ind in econStore.countryData" :key="ind.label">
                  <td class="lbl" style="padding:10px 5px;">{{ ind.label }}</td>
                  <td class="val" style="font-size:14px;font-weight:bold;" :style="{ color: ind.label.includes('GDP') ? '#10b981' : ind.label.includes('Inflation') || ind.label.includes('Unemployment') ? '#f97316' : '#fff' }">
                    {{ ind.value }} <span style="font-size:10px;color:var(--text-muted);font-weight:normal;">{{ ind.year }}</span>
                  </td>
                </tr>
              </table>
            </div>
            <div style="flex:1;background:rgba(0,0,0,0.2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">
              <div v-if="econStore.error" style="color:#ef4444;">{{ econStore.error }}</div>
              <div v-else>
                Data source: World Bank API.<br><br>Select a country point (GPI marker) on the map to load its specific macroeconomic indicators here.
              </div>
            </div>
          </div>
          <div v-else style="text-align:center;padding:40px;color:var(--text-muted);border:1px dashed var(--border-color);border-radius:4px;">
            No national target selected.<br>Click on a country's GPI marker on the map to fetch World Bank data.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMapStore } from '@/stores/mapStore';
import { useEconStore } from '@/stores/econStore';

const mapStore = useMapStore();
const econStore = useEconStore();
</script>

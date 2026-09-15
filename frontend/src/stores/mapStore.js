import { defineStore } from 'pinia';
import { ref, shallowRef, reactive } from 'vue';

export const useMapStore = defineStore('map', () => {
  // Leaflet map instance (shallowRef to avoid deep reactivity on complex Leaflet object)
  const mapInstance = shallowRef(null);

  // Layer visibility flags
  const show = reactive({
    conflict: true,
    hotspot: true,
    air: true,
    mil: true,
    nuke: true,
    sat: true,
    quake: true,
    wea: true,
    gpi: true,
    eonet: false,
    cables: false,
    protests: false,
    cyber: false,
  });

  // Time filter: '1h' | '6h' | '24h' | '48h' | '7d' | 'all'
  const timeFilter = ref('24h');

  // Active weather overlay type: 'radar'|'infrared'|'wind'|'temp'|'clouds'
  const weatherLayerType = ref('radar');

  // Coordinate bar
  const curLat = ref('--');
  const curLon = ref('--');
  const curZoom = ref('--');

  // Counts for coord bar
  const airCount = ref(0);
  const nukeCount = ref(0);
  const quakeCount = ref(0);

  // Dim mode
  const dimMode = ref(false);

  // Audio enabled
  const audioEnabled = ref(false);

  // Econ modal open
  const econModalOpen = ref(false);
  const econModalTab = ref('global');

  // Cyber canvas active
  const cyberActive = ref(false);

  // Intel status text (right panel header)
  const intelStatus = ref('STANDBY');

  // Intel display HTML (right panel target tab)
  const intelDisplay = ref(`
    <div style="text-align:center;color:var(--text-muted);margin-top:50px;line-height:2;">
      <div style="font-size:16px;color:#1e3a5f;margin-bottom:12px;">◈</div>
      <div>[ NO TARGET ACQUIRED ]</div>
      <div style="font-size:10px;margin-top:6px;">Click objects on map for analysis</div>
    </div>
  `);

  // Active tab in right panel
  const activeTab = ref('target');

  // GPI legend visible
  const gpiLegendVisible = ref(true);

  function setMap(instance) {
    mapInstance.value = instance;
  }

  function setTimeFilter(filter) {
    timeFilter.value = filter;
  }

  function toggleDim() {
    dimMode.value = !dimMode.value;
    document.body.classList.toggle('dim-mode', dimMode.value);
  }

  function toggleAudio() {
    audioEnabled.value = !audioEnabled.value;
  }

  function setIntelDisplay(html) {
    intelDisplay.value = html;
  }

  function setIntelStatus(text) {
    intelStatus.value = text;
  }

  function setActiveTab(tab) {
    activeTab.value = tab;
  }

  function flyTo(lat, lng, zoom = 6) {
    if (mapInstance.value) {
      mapInstance.value.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }

  return {
    mapInstance,
    show,
    timeFilter,
    weatherLayerType,
    curLat,
    curLon,
    curZoom,
    airCount,
    nukeCount,
    quakeCount,
    dimMode,
    audioEnabled,
    econModalOpen,
    econModalTab,
    cyberActive,
    intelStatus,
    intelDisplay,
    activeTab,
    gpiLegendVisible,
    setMap,
    setTimeFilter,
    toggleDim,
    toggleAudio,
    setIntelDisplay,
    setIntelStatus,
    setActiveTab,
    flyTo,
  };
});

import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useIntelStore = defineStore('intel', () => {
  // Aviation data: { [icao24]: { marker, data } }
  const aviation = reactive({});
  const aviationCount = ref(0);

  // Quake data: array of { marker, data }
  const quakes = ref([]);

  // Satellite positions: { [norad]: { marker, lat, lon, alt, vel, name } }
  const satellites = reactive({});

  // News ticker items
  const tickerItems = ref([]);

  // Live intel feed items
  const intelFeedItems = ref([]);
  const intelFeedTime = ref('');

  // Incident feed (conflict + hotspots)
  const incidentFeed = ref([]);
  const feedCount = ref(0);

  // Callsign tracker
  const watchlist = ref([]);
  const csStatus = ref('');

  // Protest markers
  const protestCount = ref(0);

  // EONET event count
  const eonetCount = ref(0);

  // Conflict detection from news
  const dynConflicts = ref([]);

  // Sat update indicator
  const satUpdateTime = ref('● LIVE');

  // Cyber layer
  const cyberCount = ref(0);
  const latestKEV = ref([]);

  // Missile/ICBM alert (from news keyword scan)
  const missileAlert = ref(null);

  // -- Sparkline history (last 20 data points each) --
  const planeCount = ref(0);
  const quakeCount = ref(0);
  const conflictCount = ref(0);
  const planeHistory = ref([0]);
  const quakeHistory = ref([0]);
  const conflictHistory = ref([0]);

  function pushHistory(arr, val, max = 20) {
    arr.value.push(val);
    if (arr.value.length > max) arr.value.shift();
  }

  function setTickerItems(items) {
    tickerItems.value = items;
  }

  function setIntelFeed(items) {
    intelFeedItems.value = items;
    intelFeedTime.value = new Date().toUTCString().substring(17, 22) + ' UTC';
  }

  function addToWatchlist(cs) {
    if (!watchlist.value.includes(cs)) {
      watchlist.value.push(cs);
    }
  }

  function removeFromWatchlist(cs) {
    watchlist.value = watchlist.value.filter(c => c !== cs);
  }

  function setAviationCount(n) {
    aviationCount.value = n;
    planeCount.value = n;
    pushHistory(planeHistory, n);
  }

  function setQuakeCount(n) {
    quakeCount.value = n;
    pushHistory(quakeHistory, n);
  }

  function setConflictCount(n) {
    conflictCount.value = n;
    pushHistory(conflictHistory, n);
  }

  return {
    aviation,
    aviationCount,
    quakes,
    satellites,
    tickerItems,
    intelFeedItems,
    intelFeedTime,
    incidentFeed,
    feedCount,
    watchlist,
    csStatus,
    protestCount,
    eonetCount,
    dynConflicts,
    satUpdateTime,
    cyberCount,
    latestKEV,
    missileAlert,
    planeCount,
    quakeCount,
    conflictCount,
    planeHistory,
    quakeHistory,
    conflictHistory,
    setTickerItems,
    setIntelFeed,
    addToWatchlist,
    removeFromWatchlist,
    setAviationCount,
    setQuakeCount,
    setConflictCount,
  };
});

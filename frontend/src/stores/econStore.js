import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

export const useEconStore = defineStore('econ', () => {
  // World bank macro indicators
  const macro = reactive({
    gdp: '—',
    population: '—',
    trade: '—',
    co2: '—',
  });

  // Current selected country WB data
  const countryData = ref(null);
  const countryName = ref('');

  // Econ modal data
  const globalData = ref(null);
  const regionalData = ref(null);
  const nationalData = ref(null);

  // Loading states
  const loading = ref(false);
  const error = ref(null);

  async function fetchWorldBankMacro() {
    try {
      const indicators = [
        { key: 'gdp', code: 'NY.GDP.MKTP.CD' },
        { key: 'population', code: 'SP.POP.TOTL' },
        { key: 'trade', code: 'NE.TRD.GNFS.ZS' },
        { key: 'co2', code: 'EN.ATM.CO2E.KT' },
      ];
      await Promise.allSettled(indicators.map(async (ind) => {
        const url = `/api/proxy?url=${encodeURIComponent(`https://api.worldbank.org/v2/country/WLD/indicator/${ind.code}?format=json&mrv=1`)}`;
        const res = await fetch(url);
        const data = await res.json();
        const val = data[1]?.[0]?.value;
        if (val !== null && val !== undefined) {
          if (ind.key === 'gdp') macro.gdp = '$' + (val / 1e12).toFixed(1) + 'T';
          else if (ind.key === 'population') macro.population = (val / 1e9).toFixed(2) + 'B';
          else if (ind.key === 'trade') macro.trade = val.toFixed(1) + '%';
          else if (ind.key === 'co2') macro.co2 = (val / 1e6).toFixed(1) + 'Gt';
        }
      }));
    } catch (e) {
      console.warn('[econ] World Bank macro error:', e);
    }
  }

  async function fetchWorldBankCountry(iso2, name) {
    loading.value = true;
    countryName.value = name;
    try {
      const indicators = [
        { label: 'GDP (USD)', code: 'NY.GDP.MKTP.CD', fmt: v => '$' + (v / 1e9).toFixed(1) + 'B' },
        { label: 'GDP per Capita', code: 'NY.GDP.PCAP.CD', fmt: v => '$' + v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') },
        { label: 'Population', code: 'SP.POP.TOTL', fmt: v => (v / 1e6).toFixed(1) + 'M' },
        { label: 'Inflation (%)', code: 'FP.CPI.TOTL.ZG', fmt: v => v.toFixed(1) + '%' },
        { label: 'Unemployment (%)', code: 'SL.UEM.TOTL.ZS', fmt: v => v.toFixed(1) + '%' },
        { label: 'Military Spend (% GDP)', code: 'MS.MIL.XPND.GD.ZS', fmt: v => v.toFixed(2) + '%' },
      ];
      const results = await Promise.allSettled(indicators.map(async (ind) => {
        const url = `/api/proxy?url=${encodeURIComponent(`https://api.worldbank.org/v2/country/${iso2}/indicator/${ind.code}?format=json&mrv=1`)}`;
        const res = await fetch(url);
        const data = await res.json();
        const val = data[1]?.[0]?.value;
        return { label: ind.label, value: val !== null && val !== undefined ? ind.fmt(val) : 'N/A', year: data[1]?.[0]?.date || '' };
      }));
      countryData.value = results.map(r => r.status === 'fulfilled' ? r.value : { label: '?', value: 'N/A', year: '' });
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    macro,
    countryData,
    countryName,
    globalData,
    regionalData,
    nationalData,
    loading,
    error,
    fetchWorldBankMacro,
    fetchWorldBankCountry,
  };
});

// Satellite Configuration
// NORAD IDs for tracking via wheretheiss.at and Celestrak TLE

export const SATELLITES = [
  { norad: 25544, name: "ISS", icon: "🛸", color: "#facc15", primary: true },
  { norad: 20580, name: "Hubble", icon: "🔭", color: "#a855f7", primary: false },
  { norad: 43013, name: "NOAA-20", icon: "🛰️", color: "#06b6d4", primary: false },
  { norad: 41866, name: "Jason-3", icon: "🌊", color: "#3b82f6", primary: false },
  { norad: 48274, name: "Starlink-L1", icon: "⭐", color: "#64748b", primary: false },
  { norad: 27424, name: "XMM-Newton", icon: "☢️", color: "#f97316", primary: false },
  { norad: 36516, name: "COSMO-4", icon: "📡", color: "#10b981", primary: false },
  { norad: 28654, name: "CALIPSO", icon: "🌫️", color: "#8b5cf6", primary: false },
  { norad: 29107, name: "CloudSat", icon: "☁️", color: "#60a5fa", primary: false },
  { norad: 37849, name: "PROBA-V", icon: "🌱", color: "#2d9e5f", primary: false },
];

export const ISS_API = "https://api.wheretheiss.at/v1/satellites/25544";
export const TLE_API = (norad) => `https://tle.ivanstanojevic.me/api/tle/${norad}`;

export default SATELLITES;

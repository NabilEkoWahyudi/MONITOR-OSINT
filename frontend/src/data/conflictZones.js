// Global Conflict Zones & Intel Hotspots
// Source: Open-source intelligence data

export const conflictZones = [
  { id: "C1", name: "Russo-Ukrainian War", bounds: [[44, 22], [52, 40]], color: '#ef4444', threat: 'CRITICAL', desc: "Invasi Rusia ke Ukraina berlanjut. Pertempuran aktif di Zaporizhzhia, Kherson, dan Donbas. Zona larangan terbang aktif." },
  { id: "C2", name: "Gaza–Israel Conflict", bounds: [[31, 34], [32, 35.5]], color: '#ef4444', threat: 'CRITICAL', desc: "Konflik intensitas tinggi IDF vs Hamas. Operasi darat dan serangan udara. Eskalasi ke Lebanon dan Iran." },
  { id: "C3", name: "Sudan Civil War", bounds: [[9, 22], [22, 38]], color: '#f97316', threat: 'HIGH', desc: "SAF vs RSF memperebutkan Khartoum dan Darfur. Krisis kemanusiaan terbesar di dunia saat ini." },
  { id: "C4", name: "Myanmar Civil Conflict", bounds: [[15, 92], [28, 98]], color: '#f97316', threat: 'HIGH', desc: "Three Brotherhood Alliance vs Junta SAC. Kachin, Shan, Chin, dan Rakhine membara." },
  { id: "C5", name: "Somalia / Al-Shabaab", bounds: [[0.5, 41], [11, 51]], color: '#facc15', threat: 'ELEVATED', desc: "Operasi kontra-terorisme AFRICOM dan AU. Dronestrikes reguler di Jubbaland." },
  { id: "C6", name: "Sahel / West Africa", bounds: [[10, -5], [20, 15]], color: '#facc15', threat: 'ELEVATED', desc: "JNIM dan ISGS aktif di Mali, Burkina Faso, Niger. Kepergian pasukan Barat memperkuat militan." },
  { id: "C7", name: "Yemen / Houthi Sea War", bounds: [[12.5, 42.5], [18, 54]], color: '#ef4444', threat: 'HIGH', desc: "Houthi serang kapal komersial Laut Merah. US/UK melakukan serangan balik. Ancaman jalur pelayaran global." },
  { id: "C8", name: "DR Congo (M23)", bounds: [[-5, 26], [2, 32]], color: '#f97316', threat: 'HIGH', desc: "M23 kuasai Goma. Rwanda diduga terlibat. Konflik mineral dan proxy war regional." },
];

export const intelHotspots = [
  { lat: 25.033, lng: 121.565, name: "Taiwan Strait — PLA Pressure", threat: "CRITICAL", color: '#ef4444', desc: "Latihan militer PLA intensif. Jet tempur melintasi garis tengah. Situasi paling tegang sejak 1996." },
  { lat: 37.5, lng: 127.0, name: "Korean Peninsula Tensions", threat: "ELEVATED", color: '#f97316', desc: "DPRK uji coba rudal balistik dan ancaman nuklir. ROK–AS gelar latihan militer terbesar." },
  { lat: 35.689, lng: 51.389, name: "Tehran — Iran Nuclear Watch", threat: "HIGH", color: '#ef4444', desc: "Iran perkaya uranium 60%. JCPOA stagnan. IAEA kehilangan akses fasilitas." },
  { lat: 3.5, lng: 112.5, name: "South China Sea — PLAN", threat: "HIGH", color: '#ef4444', desc: "Instalasi militer PLA di Spratly/Paracel. Konfrontasi dengan Filipina dan Vietnam meningkat." },
  { lat: 60.0, lng: 20.0, name: "Baltic Sea — NATO-Russia", threat: "ELEVATED", color: '#facc15', desc: "Kapal selam Rusia aktif di Baltik. Swedia & Finlandia masuk NATO. Insiden aircraft meningkat." },
  { lat: 28.6, lng: 77.2, name: "India–China LAC Standoff", threat: "ELEVATED", color: '#facc15', desc: "Ketegangan Line of Actual Control di Ladakh. Kedua pihak bangun infrastruktur militer perbatasan." },
  { lat: 1.5, lng: 103.8, name: "Selat Malaka — Chokepoint", threat: "MODERATE", color: '#facc15', desc: "40% perdagangan dunia. Potensi konflik laut dan pembajakan. Kehadiran militer multi-negara." },
  { lat: -8.5, lng: 115.0, name: "Indo-Pacific Watch — AUKUS", threat: "MODERATE", color: '#06b6d4', desc: "Armada SSN AUKUS dalam pembangunan. Australia terima teknologi AS/UK. Reaksi keras Beijing." },
];

export default { conflictZones, intelHotspots };

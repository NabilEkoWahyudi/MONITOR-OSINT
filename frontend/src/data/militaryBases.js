// Major Military Bases Database
// Source: Open-source intelligence

const LOGO_TNI = "https://upload.wikimedia.org/wikipedia/commons/3/36/Logo_of_the_Indonesian_National_Armed_Forces.svg";
const LOGO_TNI_AL = "https://upload.wikimedia.org/wikipedia/commons/c/ca/Logo_of_the_Indonesian_Navy.svg";
const LOGO_TNI_AU = "https://upload.wikimedia.org/wikipedia/commons/0/07/Logo_of_the_Indonesian_Air_Force.svg";
const LOGO_US_NAVY = "https://upload.wikimedia.org/wikipedia/commons/0/09/Seal_of_the_United_States_Navy.svg";
const LOGO_USMC = "https://upload.wikimedia.org/wikipedia/commons/a/a0/United_States_Marine_Corps_logo.svg";
const LOGO_PLAN = "https://upload.wikimedia.org/wikipedia/commons/f/f8/China_People%27s_Liberation_Army_Navy_flag.svg";

export const majorMilitaryBases = [
  { name: "Mabes TNI Cilangkap", lat: -6.3193, lng: 106.9056, type: "Markas Besar TNI (Jakarta)", logo: LOGO_TNI, photo: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Mabes_TNI_Cilangkap.jpg" },
  { name: "Lanud Halim Perdanakusuma", lat: -6.2655, lng: 106.8860, type: "TNI AU — Pangkalan Udara Utama Jakarta", logo: LOGO_TNI_AU, photo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Halim_Perdanakusuma_Airport.jpg" },
  { name: "Koarmada I (Tanjung Pinang)", lat: 0.9080, lng: 104.4530, type: "TNI AL — Komando Armada I", logo: LOGO_TNI_AL, photo: "" },
  { name: "Lanal Batam (Sengkuang)", lat: 1.0968, lng: 103.9806, type: "TNI AL — Pangkalan AL Batam", logo: LOGO_TNI_AL, photo: "" },
  { name: "Pangkalan Terpadu Natuna", lat: 3.9490, lng: 108.3810, type: "TNI Terpadu — Natuna (Perbatasan LCS)", logo: LOGO_TNI, photo: "" },
  { name: "Koarmada II Surabaya", lat: -7.1995, lng: 112.7383, type: "TNI AL — Pangkalan Utama Armada II", logo: LOGO_TNI_AL, photo: "https://upload.wikimedia.org/wikipedia/commons/d/d4/KRI_Bima_Suci_in_Surabaya.jpg" },
  { name: "Lanud Sultan Hasanuddin", lat: -5.0616, lng: 119.5540, type: "TNI AU — Makassar", logo: LOGO_TNI_AU, photo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Hasanuddin_International_Airport.jpg" },
  { name: "Changi Naval Base", lat: 1.303, lng: 104.020, type: "Republic of Singapore Navy", logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Republic_of_Singapore_Navy_Crest.png", photo: "https://upload.wikimedia.org/wikipedia/commons/0/05/RSS_Formidable.jpg" },
  { name: "Diego Garcia (BIOT)", lat: -7.3195, lng: 72.4228, type: "US Navy/USAF — Indian Ocean", logo: LOGO_US_NAVY, photo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Diego_Garcia_from_space.jpg" },
  { name: "Pearl Harbor – Hickam AFB", lat: 21.344, lng: -157.940, type: "US Pacific Fleet HQ (USINDOPACOM)", logo: LOGO_US_NAVY, photo: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Pearl_Harbor_Aerial.jpg" },
  { name: "Kadena AB (Okinawa)", lat: 26.358, lng: 127.769, type: "USMC & USAF — Forward Base Pacific", logo: LOGO_USMC, photo: "" },
  { name: "Yokosuka Naval Base", lat: 35.285, lng: 139.671, type: "US 7th Fleet HQ (Japan)", logo: LOGO_US_NAVY, photo: "" },
  { name: "Yulin Naval Base (Sanya)", lat: 18.236, lng: 109.521, type: "PLA Navy — Submarine Base (LCS)", logo: LOGO_PLAN, photo: "" },
];

export default majorMilitaryBases;

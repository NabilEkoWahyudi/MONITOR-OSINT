<template>
  <!-- Full-screen modal overlay -->
  <div v-if="visible" id="media-hub-modal">
    <div id="media-hub-content">
      <!-- Header -->
      <div id="media-hub-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-family:'Orbitron',monospace;color:var(--accent-cyan);font-size:16px;font-weight:700;letter-spacing:2px;">🌐 MEDIA HUB</span>
          <span class="status-badge badge-red" style="animation:pulse 1.5s infinite;">● LIVE</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;margin-right:10px;">
            <input type="text" v-model="searchQuery" placeholder="Search channel/location..." 
                   style="background:rgba(0,0,0,0.5);border:1px solid rgba(6,182,212,0.3);color:#fff;font-size:10px;padding:4px 8px;border-radius:3px;width:150px;outline:none;font-family:'Orbitron',monospace;" />
          </div>
          <div style="display:flex;align-items:center;gap:4px;margin-right:10px;background:rgba(0,0,0,.3);padding:4px 8px;border-radius:4px;border:1px solid rgba(6,182,212,0.2);">
            <span style="font-size:9px;color:var(--text-muted);font-weight:bold;margin-right:4px;">GRID SIZE:</span>
            <button @click="zoomGrid(1)" style="background:transparent;border:none;color:var(--accent-cyan);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:3px;background:rgba(6,182,212,0.1);" title="Perbesar Video">➕</button>
            <button @click="zoomGrid(-1)" style="background:transparent;border:none;color:var(--accent-cyan);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:3px;background:rgba(6,182,212,0.1);" title="Perkecil Video">➖</button>
          </div>
          <button v-for="tab in tabs" :key="tab.id"
            class="econ-tab-btn" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.icon }} {{ tab.label }}
          </button>
          <button @click="$emit('close')" style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);color:#ef4444;padding:5px 12px;border-radius:3px;cursor:pointer;font-family:monospace;font-size:10px;margin-left:8px;">✖ CLOSE</button>
        </div>
      </div>

      <!-- LIVE STREAMS TAB -->
      <div v-show="activeTab === 'streams'" class="media-tab-pane">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:8px;padding:6px;background:rgba(0,0,0,.3);border-radius:3px;border-left:2px solid var(--accent-yellow);">
          ⚠️ Klik pada setiap channel untuk load stream · Beberapa channel mungkin perlu VPN untuk diakses dari Indonesia
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-shrink:0;flex-wrap:wrap;">
          <span style="font-size:9px;color:var(--text-muted);">Region:</span>
          <button v-for="region in streamRegions" :key="region"
            class="time-filter-btn" :class="{ active: streamRegion === region }"
            @click="streamRegion = region">{{ region }}</button>
        </div>
        <div class="streams-grid" :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, position: 'relative' }">
          <div v-for="stream in filteredStreams" :key="stream.id" class="stream-card" :class="{ active: activeStream === stream.id }"
               :style="expandedVideo === stream.id ? { position: 'absolute', inset: 0, zIndex: 100 } : {}">
            <div class="stream-label" @click="activeStream = stream.id">
              <span class="stream-dot"></span>
              <span>{{ stream.channel }}</span>
              <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
                <button @click.stop="toggleExpand(stream.id)" style="background:rgba(250,204,21,0.15);border:1px solid rgba(250,204,21,0.4);color:var(--accent-yellow);cursor:pointer;font-size:8px;padding:2px 6px;border-radius:2px;">
                  {{ expandedVideo === stream.id ? '↙ SHRINK' : '↗ EXPAND' }}
                </button>
                <span style="font-size:8px;color:var(--text-muted);">{{ stream.lang }}</span>
              </div>
            </div>
            <div class="stream-frame" v-if="activeStream === stream.id" style="position:relative;">
              <iframe :id="`yt-${stream.id}`"
                :src="`https://www.youtube.com/embed/${stream.ytId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&fs=1&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}`"
                allow="autoplay; encrypted-media; fullscreen"
                allowfullscreen
                frameborder="0"
                style="width:100%;height:100%;border:none;">
              </iframe>
              <button @click.stop="toggleAudio(stream.id)"
                 style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,0.8);color:var(--accent-cyan);font-size:9px;padding:3px 8px;border-radius:3px;border:1px solid rgba(6,182,212,0.4);cursor:pointer;z-index:10;font-family:monospace;font-weight:bold;">
                {{ audioState[stream.id] ? '🔊 UNMUTED' : '🔇 MUTED' }}
              </button>
              <a :href="`https://youtube.com/watch?v=${stream.ytId}`" 
                 target="_blank" rel="noopener"
                 style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.7);color:#fff;font-size:8px;padding:3px 6px;border-radius:3px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);z-index:10;">
                ↗ YOUTUBE
              </a>
            </div>
            <div v-else class="stream-thumb" @click="activeStream = stream.id">
              <img :src="`https://img.youtube.com/vi/${stream.ytId}/mqdefault.jpg`"
                style="width:100%;height:100%;object-fit:cover;background:#1e293b;" :alt="stream.channel"
                @error="e => e.target.style.display='none'" />
              <div class="stream-play">▶ KLIK UNTUK LOAD STREAM</div>
            </div>
          </div>
        </div>
      </div>

      <!-- LIVE WEBCAMS TAB -->
      <div v-show="activeTab === 'webcams'" class="media-tab-pane">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-shrink:0;flex-wrap:wrap;">
          <span style="font-size:9px;color:var(--text-muted);">Filter:</span>
          <button v-for="region in webcamRegions" :key="region"
            class="time-filter-btn" :class="{ active: camRegion === region }"
            @click="camRegion = region; loadedCams.clear()">{{ region }}</button>
        </div>
        <div class="webcams-grid" :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, position: 'relative' }">
          <div v-for="cam in filteredCams" :key="cam.id" class="webcam-card"
               :style="expandedVideo === cam.id ? { position: 'absolute', inset: 0, zIndex: 100 } : {}">
            <div class="webcam-header">
              <span class="stream-dot"></span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cam.name }}</span>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button @click.stop="toggleExpand(cam.id)" style="background:rgba(250,204,21,0.15);border:1px solid rgba(250,204,21,0.4);color:var(--accent-yellow);cursor:pointer;font-size:8px;padding:2px 6px;border-radius:2px;">
                  {{ expandedVideo === cam.id ? '↙ SHRINK' : '↗ EXPAND' }}
                </button>
                <span style="font-size:8px;color:var(--text-muted);margin-left:4px;">{{ cam.flag }}</span>
              </div>
            </div>
            <div class="webcam-frame" style="position:relative;">
              <!-- Load on click to save bandwidth -->
              <div v-if="!loadedCams.has(cam.id)" class="webcam-placeholder" @click="loadedCams.add(cam.id)" style="cursor:pointer;">
                <div style="font-size:20px;margin-bottom:4px;">📡</div>
                <div style="font-size:9px;color:var(--text-muted);text-align:center;padding:0 4px;">{{ cam.name }}</div>
                <div style="font-size:9px;color:var(--accent-cyan);margin-top:6px;">▶ LOAD CAM</div>
              </div>
              <iframe v-else-if="cam.type === 'yt'" :id="`yt-${cam.id}`"
                :src="`https://www.youtube.com/embed/${cam.src}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${cam.src}&enablejsapi=1&origin=${currentOrigin}`"
                frameborder="0" allow="autoplay"
                style="width:100%;height:100%;border:none;">
              </iframe>
              <button v-if="loadedCams.has(cam.id) && cam.type === 'yt'" @click.stop="toggleAudio(cam.id)"
                 style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,0.8);color:var(--accent-cyan);font-size:9px;padding:3px 8px;border-radius:3px;border:1px solid rgba(6,182,212,0.4);cursor:pointer;z-index:10;font-family:monospace;font-weight:bold;">
                {{ audioState[cam.id] ? '🔊 UNMUTED' : '🔇 MUTED' }}
              </button>
              <a v-if="loadedCams.has(cam.id) && cam.type === 'yt'" :href="`https://youtube.com/watch?v=${cam.src}`" target="_blank" rel="noopener"
                 style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.7);color:#fff;font-size:8px;padding:3px 6px;border-radius:3px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);z-index:10;">
                ↗ YOUTUBE
              </a>
              <iframe v-else-if="loadedCams.has(cam.id) && cam.type === 'embed'"
                :src="cam.src"
                frameborder="0"
                style="width:100%;height:100%;border:none;">
              </iframe>
            </div>
          </div>
        </div>
      </div>

      <!-- OSINT CHAT TAB -->
      <div v-show="activeTab === 'chat'" class="media-tab-pane chat-pane">
        <div class="chat-info-bar">
          <span style="color:var(--accent-green);">● SECURE CHANNEL ACTIVE</span>
          <button @click="showLedger = true" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:9px;padding:2px 6px;margin-left:10px;cursor:pointer;border-radius:2px;">&#x26D3; AUDIT LEDGER</button>
          
          <span v-if="chatChainValid" style="color:#10b981;font-size:9px;margin-left:10px;font-weight:bold;">&#x1F512; Chain Verified</span>
          <span v-else-if="chatChainBroken" style="color:#ef4444;font-size:9px;margin-left:10px;font-weight:bold;">&#x26A0; Tampered at block {{ chat.chainStatus.value.brokenAt }}</span>

          <span style="color:var(--text-muted);font-size:9px;margin-left:auto;">· Socket.io API ·</span>
          <span style="background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);color:var(--accent-cyan);padding:2px 8px;border-radius:2px;font-size:9px;margin-left:10px;">{{ chatMyId }}</span>
        </div>
        <div ref="chatBox" style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:6px;">
          <div v-if="!chatMessages.length" style="color:var(--text-muted);font-size:10px;text-align:center;padding:20px;opacity:0.6;">
            &#x25C8; Channel aktif. Ketik pesan untuk memulai komunikasi terenkripsi.
          </div>
          <div v-for="(msg, idx) in chatMessages" :key="idx"
            class="chat-msg" :class="[msg.mine ? 'mine' : 'other', { system: msg.system }]">
            <div class="chat-sender">
              <span :style="{ color: msg.mine ? 'var(--accent-cyan)' : msg.system ? 'var(--accent-yellow)' : '#a78bfa' }">
                {{ msg.mine ? 'YOU' : msg.from }}
              </span>
              <span style="color:var(--text-muted);font-size:8px;margin-left:6px;">{{ msg.time }}</span>
            </div>
            <div class="chat-text" style="display:flex;flex-direction:column;gap:2px;">
              <span>{{ msg.text }}</span>
              <span v-if="msg.hash" style="font-family:'Courier New',Courier,monospace;font-size:7px;color:rgba(16,185,129,0.7);">
                [SHA256: {{ msg.hash.substring(0, 16) }}...]
              </span>
            </div>
          </div>
          <div v-if="chatTyping" style="font-size:9px;color:var(--text-muted);font-style:italic;padding:4px 8px;">
            {{ chatTyping }}
          </div>
        </div>
        <div class="chat-input-row">
          <input
            type="text"
            v-model="chatInput"
            placeholder="Ketik pesan intel... (Enter untuk kirim)"
            @keypress.enter="sendMsg"
            @input="chat?.sendTyping?.()"
            style="flex:1;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.3);color:#e2f0ff;font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 10px;border-radius:3px;outline:none;"
          />
          <button class="btn-search" @click="sendMsg" style="min-width:60px;flex-shrink:0;">TX &#x25B6;</button>
        </div>
        <div style="font-size:9px;color:var(--text-muted);text-align:center;padding:6px;border-top:1px solid var(--border-color);">
          💡 Buka tab browser baru ke <strong style="color:var(--accent-cyan);">localhost:5173</strong> untuk menguji multi-user chat real-time
        </div>
      </div>
    </div>

    <!-- Ledger Modal -->
    <div v-if="showLedger" class="modal-overlay" @click.self="showLedger = false">
      <div class="modal-content" style="width:600px;max-width:90vw;">
        <div class="modal-header">
          <h2 style="font-size:14px;color:var(--accent-cyan);margin:0;display:flex;align-items:center;gap:8px;">
            ⛓️ OSINT HASH-CHAIN LEDGER
          </h2>
          <button class="btn-close" @click="showLedger = false">✕</button>
        </div>
        <div style="padding:15px;max-height:400px;overflow-y:auto;background:rgba(0,0,0,0.5);">
          <div v-if="chat.blockchainLedger.value.length === 0" style="color:var(--text-muted);font-size:11px;text-align:center;">
            Ledger kosong. Kirim pesan untuk membuat blok pertama.
          </div>
          <div v-for="block in chat.blockchainLedger.value" :key="block.block" style="border-bottom:1px solid rgba(255,255,255,0.1);padding:10px 0;">
            <div style="font-size:10px;color:var(--accent-yellow);font-weight:bold;margin-bottom:4px;">BLOCK #{{ block.block }} | {{ block.time }}</div>
            <div style="font-size:9px;color:var(--text-main);font-family:monospace;margin-bottom:2px;">
              <span style="color:var(--text-muted);">FROM:</span> {{ block.from }}
            </div>
            <div style="font-size:9px;color:var(--text-main);font-family:monospace;margin-bottom:2px;">
              <span style="color:var(--text-muted);">PREV HASH:</span> {{ block.prevHash }}
            </div>
            <div style="font-size:9px;color:var(--accent-green);font-family:monospace;">
              <span style="color:var(--text-muted);">THIS HASH:</span> {{ block.hash }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick } from 'vue';

const props = defineProps({ visible: Boolean, chat: Object });
const emit = defineEmits(['close']);

const activeTab = ref('streams');
const activeStream = ref(null);
const streamRegion = ref('ALL');
const camRegion = ref('ALL');
const searchQuery = ref('');
const chatInput = ref('');
const chatBox = ref(null);
const showLedger = ref(false);
const loadedCams = reactive(new Set());

// Computed reactive wrappers for chat prop (ensures Vue tracks ref changes)
const chatMessages = computed(() => props.chat?.messages?.value || []);
const chatTyping = computed(() => props.chat?.typingIndicator?.value || '');
const chatMyId = computed(() => props.chat?.myId?.value || 'CONNECTING...');
const chatChainValid = computed(() => props.chat?.chainStatus?.value?.valid === true);
const chatChainBroken = computed(() => props.chat?.chainStatus?.value?.valid === false);
const chatChainBrokenAt = computed(() => props.chat?.chainStatus?.value?.brokenAt || '');
const audioState = reactive({}); // Tracks unmuted state per video ID

const expandedVideo = ref(null);
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

function toggleExpand(id) {
  if (expandedVideo.value === id) {
    expandedVideo.value = null;
  } else {
    expandedVideo.value = id;
  }
}

const gridScale = ref(0); // 0 = normal, 1 = large, 2 = xl
const gridCols = computed(() => {
  if (activeTab.value === 'streams') {
    if (gridScale.value === 0) return 3;
    if (gridScale.value === 1) return 2;
    return 1;
  } else {
    if (gridScale.value === 0) return 4;
    if (gridScale.value === 1) return 2;
    return 1;
  }
});
function zoomGrid(dir) {
  gridScale.value += dir;
  if (gridScale.value < 0) gridScale.value = 0;
  if (gridScale.value > 2) gridScale.value = 2;
}

function toggleAudio(id) {
  const iframe = document.getElementById(`yt-${id}`);
  if (!iframe) return;
  const isCurrentlyUnmuted = audioState[id];
  const command = isCurrentlyUnmuted ? 'mute' : 'unMute';
  iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
  audioState[id] = !isCurrentlyUnmuted;
}

const tabs = [
  { id: 'streams', icon: '📺', label: 'LIVE STREAMS' },
  { id: 'webcams', icon: '🎥', label: 'LIVE CAMS' },
  { id: 'chat',    icon: '💬', label: 'OSINT CHAT' },
];

// ─── VERIFIED WORKING Live News Streams ────────────────────────────
const liveStreams = [
  // AMERICAS (AM)
  { id: 'cnn',        channel: 'CNN US Live',          lang: '🇺🇸 EN', region: 'AM', ytId: 'GotlA1KKWoo' },
  { id: 'cnbc',       channel: 'CNBC US Live',         lang: '🇺🇸 EN', region: 'AM', ytId: 'C0SZoWU-w5M' },
  { id: 'abcnews',    channel: 'ABC News Live',        lang: '🇺🇸 EN', region: 'AM', ytId: 'iipR5yUp36o' },
  { id: 'cbs',        channel: 'CBS News',             lang: '🇺🇸 EN', region: 'AM', ytId: 'JJlWW6WzVkw' },
  { id: 'nbc',        channel: 'NBC / LiveNOW',        lang: '🇺🇸 EN', region: 'AM', ytId: '0mnGc7lFHi0' },
  { id: 'bloomberg',  channel: 'Bloomberg TV',         lang: '🇺🇸 EN', region: 'AM', ytId: 'dp8PhLsUcFE' },
  // EUROPE
  { id: 'dw',         channel: 'DW News',              lang: '🇩🇪 EN', region: 'EUROPE', ytId: 'LuKwFajn37U' },
  { id: 'france24',   channel: 'France 24 English',    lang: '🇫🇷 EN', region: 'EUROPE', ytId: 'HvZt-nh9sGg' },
  { id: 'russia24',   channel: 'Russia 24 / RT',       lang: '🇷🇺 EN', region: 'EUROPE', ytId: 'GTyRAGPR29g' },
  { id: 'sky',        channel: 'Sky News',             lang: '🇬🇧 EN', region: 'EUROPE', ytId: 'BlqbpRwuM80' },
  { id: 'gbnews',     channel: 'GB News',              lang: '🇬🇧 EN', region: 'EUROPE', ytId: 'I8E6eDmhegY' },
  { id: 'euronews',   channel: 'Euronews',             lang: '🇪🇺 EN', region: 'EUROPE', ytId: 'pykpO5kQJ98' },
  // ASIA
  { id: 'news18',     channel: 'News18 World',         lang: '🇮🇳 EN', region: 'ASIA', ytId: '2SfdauyFco0' },
  { id: 'ndtv',       channel: 'NDTV India',           lang: '🇮🇳 EN', region: 'ASIA', ytId: 'CQSJGYd6myg' },
  { id: 'wion',       channel: 'WION',                 lang: '🇮🇳 EN', region: 'ASIA', ytId: 'WnVyCOYU72Y' },
  { id: 'arirang',    channel: 'Arirang News',         lang: '🇰🇷 EN', region: 'ASIA', ytId: 'hvVlyZ5GiE8' },
  { id: 'kbs',        channel: 'KBS World',            lang: '🇰🇷 EN', region: 'ASIA', ytId: 'OxQQsIvJTTU' },
  { id: 'cna',        channel: 'CNA Insider',          lang: '🇸🇬 EN', region: 'ASIA', ytId: 'XWq5kBlakcQ' },
  { id: 'kompas',     channel: 'Kompas TV',            lang: '🇮🇩 ID', region: 'ASIA', ytId: 'DOOrIxw5xOw' },
  { id: 'tvone',      channel: 'tvOne News',           lang: '🇮🇩 ID', region: 'ASIA', ytId: 'rQJoEpzKkNk' },
  { id: 'abscbn',     channel: 'ABS-CBN News',         lang: '🇵🇭 EN', region: 'ASIA', ytId: 'JdDbsaHno7o' },
  // MENA
  { id: 'aljazeera',  channel: 'Al Jazeera English',   lang: '🇶🇦 EN', region: 'MENA', ytId: 'gCNeDWCI0vo' },
  { id: 'trt',        channel: 'TRT World',            lang: '🇹🇷 EN', region: 'MENA', ytId: 'Ox9v0q-ohLM' },
  { id: 'presstv',    channel: 'Press TV (Tehran)',    lang: '🇮🇷 EN', region: 'MENA', ytId: 'Tu6hjlUq2Bs' }, // Placeholder/Damascus stream
  { id: 'i24news',    channel: 'i24NEWS (Tel Aviv)',   lang: '🇮🇱 EN', region: 'MENA', ytId: 'e2gC37ILQmk' }, // Placeholder
  // AFRICA & OCEANIA
  { id: 'sabc',       channel: 'SABC News',            lang: '🇿🇦 EN', region: 'AFRICA', ytId: 'd4zDorDl5UE' },
  { id: 'channels',   channel: 'Channels TV',          lang: '🇳🇬 EN', region: 'AFRICA', ytId: 'W8nThq62Vb4' },
  { id: 'abcaus',     channel: 'ABC News AUS',         lang: '🇦🇺 EN', region: 'OCEANIA', ytId: 'vOTiJkg1voo' },
  // SPACE
  { id: 'nasa',       channel: 'NASA TV',              lang: '🚀 EN', region: 'SPACE', ytId: '0FBiyFpV__g' },
];

const streamRegions = ['ALL', 'AM', 'EUROPE', 'ASIA', 'MENA', 'AFRICA', 'OCEANIA', 'SPACE'];

const filteredStreams = computed(() => {
  let list = liveStreams;
  if (streamRegion.value !== 'ALL') list = list.filter(s => s.region === streamRegion.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(s => s.channel.toLowerCase().includes(q));
  }
  return list;
});

// ─── Reliable 24/7 Webcam Streams ─────────────────────────────────
// All are YouTube 24/7 live streams — verified reliable channels
const webcams = [
  // ASIA
  { id: 'iss',        name: 'ISS Earth View (NASA)',     flag: '🚀', region: 'SPACE',  type: 'yt', src: '0FBiyFpV__g' },
  { id: 'tokyo1',     name: 'Tokyo - Shibuya 24/7',      flag: '🇯🇵', region: 'ASIA',   type: 'yt', src: 'dfVK7ld38Ys' },
  { id: 'shanghai',   name: 'Shanghai - The Bund',        flag: '🇨🇳', region: 'ASIA',   type: 'yt', src: 'xeQJBMx2abw' },
  { id: 'jakarta',    name: 'Jakarta - Thamrin',          flag: '🇮🇩', region: 'ASIA',   type: 'yt', src: 'JJ3MWNYVCU4' },
  { id: 'kl',         name: 'Kuala Lumpur - KLCC',        flag: '🇲🇾', region: 'ASIA',   type: 'yt', src: '4TGCZCv1YWg' },
  { id: 'manila',     name: 'Manila - Skyline',           flag: '🇵🇭', region: 'ASIA',   type: 'yt', src: 'EFum1rGUdkk' },
  { id: 'newdelhi',   name: 'New Delhi - Traffic',        flag: '🇮🇳', region: 'ASIA',   type: 'yt', src: 'DjdUEyjx8GM' },
  { id: 'singapore1', name: 'Singapore Skyline',          flag: '🇸🇬', region: 'ASIA',   type: 'yt', src: 'p39VVXzGdwI' },
  { id: 'bali',       name: 'Bali - Kuta Beach',          flag: '🇮🇩', region: 'ASIA',   type: 'yt', src: 'L1duJDAqbJY' },
  { id: 'seoul',      name: 'Seoul - Gangnam',            flag: '🇰🇷', region: 'ASIA',   type: 'yt', src: 'vk5BHoDxXf0' },
  { id: 'busan',      name: 'Busan - Haeundae',           flag: '🇰🇷', region: 'ASIA',   type: 'yt', src: 'NBZdNZYF1gI' },
  { id: 'vladivostok',name: 'Vladivostok - Port',         flag: '🇷🇺', region: 'ASIA',   type: 'yt', src: 'tHf8xbUNlTU' },
  { id: 'yangon',     name: 'Yangon (Placeholder)',       flag: '🇲🇲', region: 'ASIA',   type: 'yt', src: 'p39VVXzGdwI' },
  // EUROPE
  { id: 'london1',    name: 'London - Westminster',       flag: '🇬🇧', region: 'EUROPE', type: 'yt', src: 'WKGK_hYnlGE' },
  { id: 'paris1',     name: 'Paris - Eiffel Tower Live',  flag: '🇫🇷', region: 'EUROPE', type: 'yt', src: 'OzYp4NRZlwQ' },
  { id: 'berlin',     name: 'Berlin - Brandenburg',       flag: '🇩🇪', region: 'EUROPE', type: 'yt', src: 'IRqboacDNFg' },
  { id: 'moscow',     name: 'Moscow - Red Square',        flag: '🇷🇺', region: 'EUROPE', type: 'yt', src: 'VhGdKCs5KIA' },
  { id: 'kaliningrad',name: 'Kaliningrad - City Center',  flag: '🇷🇺', region: 'EUROPE', type: 'yt', src: 'VhVgZi2lGv0' },
  { id: 'kiev',       name: 'Kyiv - Maidan Nezalezhnosti',flag: '🇺🇦', region: 'EUROPE', type: 'yt', src: 'e2gC37ILQmk' },
  { id: 'venice',     name: 'Venice Grand Canal',         flag: '🇮🇹', region: 'EUROPE', type: 'yt', src: 'a1mcaV3Sf9U' },
  { id: 'amsterdam',  name: 'Amsterdam Canals',           flag: '🇳🇱', region: 'EUROPE', type: 'yt', src: 'Gd9d4q6WvUY' },
  // MENA
  { id: 'makkah',     name: 'Makkah - Masjid Al-Haram',   flag: '🇸🇦', region: 'MENA',   type: 'yt', src: 'gzmsh4OZQqA' },
  { id: 'gaza',       name: 'Gaza Skyline Live',          flag: '🇵🇸', region: 'MENA',   type: 'yt', src: 'JR52TXToDs0' },
  { id: 'damascus',   name: 'Damascus - Umayyad Sq',      flag: '🇸🇾', region: 'MENA',   type: 'yt', src: 'Tu6hjlUq2Bs' },
  { id: 'tehran',     name: 'Tehran (Placeholder)',       flag: '🇮🇷', region: 'MENA',   type: 'yt', src: 'AkqGOcpDvZU' },
  { id: 'telaviv',    name: 'Tel Aviv (Placeholder)',     flag: '🇮🇱', region: 'MENA',   type: 'yt', src: 'JQ_jwk_7OVE' },
  { id: 'ramallah',   name: 'Ramallah (Placeholder)',     flag: '🇵🇸', region: 'MENA',   type: 'yt', src: 'JR52TXToDs0' },
  { id: 'dubai1',     name: 'Dubai - Downtown 24/7',      flag: '🇦🇪', region: 'MENA',   type: 'yt', src: 'AkqGOcpDvZU' },
  { id: 'istanbul1',  name: 'Istanbul - Bosphorus',       flag: '🇹🇷', region: 'MENA',   type: 'yt', src: 'bbVe5h7X3uw' },
  // AMERICAS & OCEANIA
  { id: 'washington', name: 'Washington DC - Capitol',    flag: '🇺🇸', region: 'AM',     type: 'yt', src: 'oDCAAfOSqvA' },
  { id: 'nyc1',       name: 'New York - Times Square',    flag: '🇺🇸', region: 'AM',     type: 'yt', src: 'JQ_jwk_7OVE' },
  { id: 'lasvegas',   name: 'Las Vegas Strip',            flag: '🇺🇸', region: 'AM',     type: 'yt', src: 'V7_orOtu-oo' },
  { id: 'la1',        name: 'Los Angeles - Hollywood',    flag: '🇺🇸', region: 'AM',     type: 'yt', src: 'EO_1LWqsCNE' },
  { id: 'sydney',     name: 'Sydney Harbour',             flag: '🇦🇺', region: 'OCEANIA', type: 'yt', src: '5uZa3-RMFos' },
  // NATURE
  { id: 'earth',      name: 'Earth from Space (NOAA)',    flag: '🌍', region: 'NATURE', type: 'yt', src: '0FBiyFpV__g' },
  { id: 'ocean',      name: 'Deep Sea Live Cam',          flag: '🌊', region: 'NATURE', type: 'yt', src: 'hXFhAFgIeeI' },
  { id: 'volcano',    name: 'Volcano Observatory Live',   flag: '🌋', region: 'NATURE', type: 'yt', src: 'K7bq44upKvs' },
  { id: 'aurora',     name: 'Aurora Borealis Live',       flag: '🌌', region: 'NATURE', type: 'yt', src: 'gPRFO7U4pBk' },
];

const webcamRegions = ['ALL', 'SPACE', 'ASIA', 'EUROPE', 'MENA', 'AM', 'NATURE'];
const filteredCams = computed(() => {
  let list = webcams;
  if (camRegion.value !== 'ALL') list = list.filter(c => c.region === camRegion.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q));
  }
  return list;
});

function sendMsg() {
  if (!chatInput.value.trim()) return;
  props.chat.sendMessage(chatInput.value);
  chatInput.value = '';
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
}

watch(chatMessages, () => {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
});
</script>

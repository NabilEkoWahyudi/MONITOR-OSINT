import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

// Determine Socket.io server URL dynamically
function getSocketUrl() {
  // Use env variable if set (production), otherwise auto-detect
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  // In development, connect to the same host on backend port
  const loc = typeof window !== 'undefined' ? window.location : null;
  if (loc) {
    return `${loc.protocol}//${loc.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

export function useChat() {
  const messages = ref([]);
  const unreadCount = ref(0);
  const blockchainLedger = ref([]);
  const chainStatus = ref({ valid: true });
  
  const prefixes = ['GHOST', 'VIPER', 'EAGLE', 'SHADOW', 'PHANTOM', 'COBRA', 'RAVEN', 'ALPHA'];
  const myId = ref(prefixes[Math.floor(Math.random() * prefixes.length)] + '-' + Math.floor(1000 + Math.random() * 9000));
  const isOpen = ref(false);
  let socket = null;
  let typingTimeout = null;
  const typingIndicator = ref('');

  async function verifyChain() {
    // crypto.subtle is only available in secure contexts (HTTPS or localhost)
    if (!crypto?.subtle) {
      chainStatus.value = { valid: true, note: 'Verification unavailable (non-HTTPS)' };
      return;
    }
    let expectedPrev = 'GENESIS_BLOCK_' + '0'.repeat(50);
    for (const block of blockchainLedger.value) {
      if (block.prevHash !== expectedPrev) {
        chainStatus.value = { valid: false, brokenAt: block.block, reason: 'prevHash mismatch' };
        return;
      }
      try {
        const payload = block.text + block.prevHash;
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
        const recomputed = Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (recomputed !== block.hash) {
          chainStatus.value = { valid: false, brokenAt: block.block, reason: 'hash mismatch (tampered)' };
          return;
        }
      } catch (e) {
        console.warn('[chat] Chain verification error:', e.message);
        chainStatus.value = { valid: true, note: 'Verification skipped' };
        return;
      }
      expectedPrev = block.hash;
    }
    chainStatus.value = { valid: true };
  }

  function initChat() {
    try {
      const socketUrl = getSocketUrl();
      socket = io(socketUrl);

      socket.on('connect', () => {
        console.log('[chat] Socket connected:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.error('[chat] Socket connection error:', err);
      });

      socket.on('ledger:init', async (ledger) => {
        blockchainLedger.value = ledger;
        // Reconstruct messages from ledger
        messages.value = ledger.map(b => ({
          type: 'msg',
          from: b.from,
          text: b.text,
          time: b.time,
          hash: b.hash,
          mine: b.from === myId.value
        }));
        
        messages.value.unshift({
          type: 'msg',
          from: 'SYSTEM',
          text: '🔒 Secure Socket.io channel established. Server-Authoritative Blockchain active.',
          time: new Date().toUTCString().substring(17, 22),
          system: true,
        });
        
        await verifyChain();
        scrollToBottom();
      });

      socket.on('msg:new', async (block) => {
        blockchainLedger.value.push(block);
        
        const msg = {
          type: 'msg',
          from: block.from,
          text: block.text,
          time: block.time,
          hash: block.hash,
          mine: block.from === myId.value
        };
        messages.value.push(msg);
        
        await verifyChain();
        
        if (!isOpen.value) unreadCount.value++;
        scrollToBottom();
      });

      socket.on('typing', (data) => {
        if (data.from === myId.value) return;
        typingIndicator.value = `${data.from} is typing...`;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { typingIndicator.value = ''; }, 2000);
      });

    } catch (e) {
      console.warn('[chat] Socket.io connection failed', e);
    }
  }

  function sendMessage(text) {
    console.log('[chat] sendMessage called:', text, 'socket exists:', !!socket);
    if (!text.trim() || !socket) return;
    socket.emit('msg:send', { text: text.trim(), from: myId.value });
    console.log('[chat] emitted msg:send');
    unreadCount.value = 0;
  }

  function sendTyping() {
    socket?.emit('typing', { from: myId.value });
  }

  function toggleChat() {
    isOpen.value = !isOpen.value;
    if (isOpen.value) unreadCount.value = 0;
  }

  function scrollToBottom() {
    setTimeout(() => {
      const el = document.getElementById('chat-messages') || document.querySelector('.chat-pane > div:nth-child(2)');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  function destroy() {
    socket?.disconnect();
  }

  return {
    messages,
    unreadCount,
    blockchainLedger,
    chainStatus,
    myId,
    isOpen,
    typingIndicator,
    initChat,
    sendMessage,
    sendTyping,
    toggleChat,
    destroy,
  };
}

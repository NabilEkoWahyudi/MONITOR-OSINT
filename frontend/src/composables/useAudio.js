import { useMapStore } from '@/stores/mapStore';

let audioCtx = null;

export function useAudio() {
  const mapStore = useMapStore();

  function initAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[audio] AudioContext not available:', e.message);
      }
    }
    // Resume if suspended (Chrome autoplay policy)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playBeep(freq = 880, duration = 0.15, type = 'sine', vol = 0.3) {
    if (!mapStore.audioEnabled || !audioCtx) return;
    // Resume if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
      return; // Skip this beep, will work on next interaction
    }
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Silently handle audio errors (e.g., context closed)
    }
  }

  function playAlertSound() {
    if (!mapStore.audioEnabled || !audioCtx) return;
    [880, 660, 880].forEach((f, i) => {
      setTimeout(() => playBeep(f, 0.2, 'square', 0.25), i * 180);
    });
  }

  function playClickSound() {
    playBeep(1200, 0.06, 'sine', 0.15);
  }

  function toggleAudio() {
    initAudio();
    mapStore.toggleAudio();
    if (mapStore.audioEnabled) playAlertSound();
  }

  function showAlert(msg) {
    const toast = document.getElementById('alert-toast');
    if (toast) {
      toast.textContent = '🚨 ' + msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }
    playAlertSound();
  }

  return {
    initAudio,
    playBeep,
    playAlertSound,
    playClickSound,
    toggleAudio,
    showAlert,
  };
}

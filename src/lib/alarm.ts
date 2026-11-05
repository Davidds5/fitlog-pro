/**
 * Dispara sinal sonoro usando Web Audio API sintetizada (zero dependência externa de arquivos mp3)
 * e vibração no celular através da Vibration API.
 */
export function playRestCompleteAlarm() {
  if (typeof window === 'undefined') return;

  // 1. Vibração háptica no celular (se suportado pelo navegador)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // Ignora se bloqueado
    }
  }

  // 2. Beep sintetizado duplo em harmonia agradável
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.25); // D5
    playTone(880.0, now + 0.15, 0.4); // A5
  } catch (err) {
    console.warn('Áudio não permitido ou indisponível:', err);
  }
}


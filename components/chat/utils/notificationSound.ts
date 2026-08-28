let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  sharedContext = new Ctor();
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// A short two-note chime played when a reply arrives in the chat widget.
export function playReplyNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.15);
    playTone(ctx, 1108.73, now + 0.1, 0.2);
  } catch {
    // Autoplay restrictions or unsupported browsers — fail silently, sound is a nice-to-have.
  }
}

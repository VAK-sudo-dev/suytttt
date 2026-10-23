/**
 * sounds.ts — Âm thanh tổng hợp bằng WebAudio (không tải file ngoài).
 * Rất nhỏ gọn, chỉ phát sau tương tác của người dùng (đảm bảo autoplay policy),
 * âm lượng rất khẽ. Mọi lỗi đều được nuốt để không bao giờ ảnh hưởng UI.
 */

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

function tone(
  freq: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "sine",
  delay = 0,
): void {
  const audio = getCtx();
  if (!audio || muted) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = audio.currentTime + delay;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainValue, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    // Bỏ qua mọi lỗi âm thanh
  }
}

function paperSwish(): void {
  const audio = getCtx();
  if (!audio || muted) return;
  try {
    const length = Math.floor(audio.sampleRate * 0.22);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = audio.createGain();
    gain.gain.value = 0.05;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start();
  } catch {
    // Bỏ qua
  }
}

/** Chạm vào bông hoa — hợp âm ấm nhẹ. */
export function playBloom(): void {
  tone(523.25, 0.5, 0.035);
  tone(659.25, 0.55, 0.028, "sine", 0.06);
  tone(783.99, 0.6, 0.02, "sine", 0.12);
}

/** Nắp phong bì mở — tiếng giấy khẽ + nốt trầm. */
export function playFlap(): void {
  paperSwish();
  tone(196, 0.25, 0.03, "triangle", 0.05);
}

/** Lá thư được đẩy ra — hai nốt lên. */
export function playReveal(): void {
  tone(392, 0.35, 0.032, "sine", 0.02);
  tone(587.33, 0.5, 0.03, "sine", 0.14);
  paperSwish();
}

/** Phóng to ảnh / mở thư — tick nhỏ. */
export function playTick(): void {
  tone(880, 0.12, 0.02, "sine");
}

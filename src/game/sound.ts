/**
 * Звуки игры — синтезируются на лету через Web Audio API (никаких аудиофайлов).
 */

const MUTE_KEY = "crystal-chest-muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
/** Если задан — звуки направляются в него (нужно, чтобы можно было оборвать «сцену») */
let dest: AudioNode | null = null;
let scene: GainNode | null = null;

try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  /* ignore */
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Прогрев аудио: создаём и «будим» контекст при первом же касании, чтобы первый звук не запаздывал */
function prewarm() {
  if (typeof window === "undefined") return;
  const go = () => {
    window.removeEventListener("pointerdown", go, true);
    window.removeEventListener("keydown", go, true);
    window.removeEventListener("touchstart", go, true);
    const c = ac();
    if (c && master) {
      // беззвучный импульс — полностью запускает аудио-конвейер
      const o = c.createOscillator();
      const g = c.createGain();
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(c.currentTime + 0.02);
    }
  };
  window.addEventListener("pointerdown", go, true);
  window.addEventListener("keydown", go, true);
  window.addEventListener("touchstart", go, true);
}
prewarm();

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  /** конечная частота (глиссандо) */
  to?: number;
  attack?: number;
  /** фильтр нижних частот */
  lp?: number;
}

function tone(c: AudioContext, freq: number, at: number, dur: number, o: ToneOpts = {}) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const peak = o.gain ?? 0.2;
  const atk = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(dest ?? master!);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

interface NoiseOpts {
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  to?: number;
  q?: number;
  attack?: number;
}

function noise(c: AudioContext, at: number, dur: number, o: NoiseOpts = {}) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.filter ?? "lowpass";
  f.frequency.setValueAtTime(o.freq ?? 800, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.value = o.q ?? 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + (o.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest ?? master!);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

const note = (base: number, semis: number) => base * Math.pow(2, semis / 12);

/** Глухой удар */
function thud(c: AudioContext, at: number, gain = 0.5, f = 110) {
  tone(c, f, at, 0.22, { to: f * 0.4, gain, type: "sine" });
  noise(c, at, 0.1, { filter: "lowpass", freq: 500, gain: gain * 0.5 });
}

/** Звон монеты */
function clink(c: AudioContext, at: number, pitch = 1) {
  tone(c, 1568 * pitch, at, 0.28, { gain: 0.13, type: "triangle" });
  tone(c, 2349 * pitch, at + 0.045, 0.45, { gain: 0.11, type: "sine" });
  tone(c, 3136 * pitch, at + 0.045, 0.2, { gain: 0.05, type: "sine" });
}

export const sfx = {
  isMuted: () => muted,

  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (!m) this.click();
  },

  /** Лёгкий щелчок интерфейса */
  click() {
    const c = ac();
    if (!c) return;
    tone(c, 620, 0, 0.07, { type: "triangle", gain: 0.12, to: 480 });
  },

  /** Выбор сундука / переключение вкладки */
  select() {
    const c = ac();
    if (!c) return;
    tone(c, 440, 0, 0.09, { type: "triangle", gain: 0.12 });
    tone(c, 660, 0.06, 0.12, { type: "triangle", gain: 0.12 });
  },

  /** Покупка сундука */
  buy() {
    const c = ac();
    if (!c) return;
    clink(c, 0, 1);
    clink(c, 0.09, 1.19);
    tone(c, 220, 0, 0.15, { type: "triangle", gain: 0.15, to: 330 });
  },

  /** Нехватка монет */
  deny() {
    const c = ac();
    if (!c) return;
    tone(c, 170, 0, 0.14, { type: "square", gain: 0.1, lp: 700, to: 130 });
    tone(c, 140, 0.15, 0.2, { type: "square", gain: 0.1, lp: 700, to: 100 });
  },

  /** Сундук трясётся ~0.9 c: удары учащаются, нарастает гул */
  shake() {
    const c = ac();
    if (!c) return;
    noise(c, 0, 0.95, { filter: "lowpass", freq: 120, to: 700, gain: 0.35, attack: 0.5 });
    tone(c, 55, 0, 0.95, { type: "sawtooth", gain: 0.1, lp: 160, to: 90, attack: 0.4 });
    let t = 0;
    let gap = 0.2;
    let i = 0;
    while (t < 0.85) {
      thud(c, t, 0.22 + i * 0.03, 95 + i * 6);
      t += gap;
      gap = Math.max(0.06, gap * 0.8);
      i++;
    }
  },

  /** Сундук открывается: скрип крышки и вспышка */
  open() {
    const c = ac();
    if (!c) return;
    // скрип
    tone(c, 150, 0, 0.45, { type: "sawtooth", gain: 0.07, lp: 900, to: 340 });
    tone(c, 156, 0, 0.45, { type: "sawtooth", gain: 0.05, lp: 900, to: 352 });
    // хлопок + воздух
    thud(c, 0.28, 0.45, 130);
    noise(c, 0.28, 0.7, { filter: "bandpass", freq: 600, to: 5000, q: 0.8, gain: 0.22, attack: 0.05 });
    // искры
    for (let i = 0; i < 6; i++) {
      tone(c, 2400 + Math.random() * 2400, 0.32 + i * 0.05, 0.14, { gain: 0.04, type: "sine" });
    }
  },

  /** Закрытие сундука */
  close() {
    const c = ac();
    if (!c) return;
    thud(c, 0, 0.4, 140);
    noise(c, 0, 0.18, { filter: "bandpass", freq: 1800, to: 500, q: 1, gain: 0.1 });
  },

  /** Появление кристалла — чем выше редкость, тем торжественнее */
  reveal(tier: number, isNew: boolean) {
    const c = ac();
    if (!c) return;
    const base = 392 + tier * 20; // G4 и выше
    const scale = [0, 4, 7, 12, 16, 19, 24, 28];
    const count = Math.min(scale.length, 2 + tier);
    const step = tier >= 5 ? 0.075 : 0.09;
    for (let i = 0; i < count; i++) {
      const f = note(base, scale[i]);
      tone(c, f, i * step, 0.5 + tier * 0.08, { type: "triangle", gain: 0.13 });
      tone(c, f * 2, i * step, 0.3, { type: "sine", gain: 0.045 });
    }
    const end = count * step;
    // финальный аккорд для редких
    if (tier >= 3) {
      [0, 4, 7, 12].forEach((s) => tone(c, note(base, s), end, 1.1, { type: "triangle", gain: 0.1, attack: 0.02 }));
    }
    if (tier >= 4) {
      noise(c, 0, 1.0, { filter: "highpass", freq: 3000, gain: 0.05, attack: 0.3 });
      tone(c, note(base, -12), end, 1.4, { type: "sine", gain: 0.2 });
    }
    if (tier >= 5) {
      // мерцающее шимери
      for (let i = 0; i < 10; i++) {
        tone(c, 2000 + Math.random() * 3500, end + i * 0.07, 0.25, { gain: 0.045 });
      }
      thud(c, end, 0.4, 70);
    }
    if (tier >= 6) {
      tone(c, note(base, -24), end, 2.2, { type: "sawtooth", gain: 0.08, lp: 300, attack: 0.1 });
      tone(c, note(base, 19), end + 0.1, 1.8, { type: "sine", gain: 0.08, attack: 0.1 });
    }
    // «Новый кристалл!»
    if (isNew) {
      const t0 = end + 0.35;
      [0, 7, 12, 16, 19].forEach((s, i) => tone(c, note(1046.5, s), t0 + i * 0.07, 0.35, { type: "sine", gain: 0.09 }));
      clink(c, t0 + 0.4, 1.1);
    }
  },

  /** Секретный кристалл «???»: 8-секундная кинематографичная аудио-сцена */
  mythic() {
    const c = ac();
    if (!c) return;
    // 0–3.5 с: нарастающее напряжение
    noise(c, 0, 3.5, { filter: "bandpass", freq: 200, to: 9000, q: 0.9, gain: 0.32, attack: 3.2 });
    tone(c, 55, 0, 3.5, { type: "sawtooth", gain: 0.11, lp: 220, to: 330, attack: 3.2 });
    tone(c, 82, 0, 3.5, { type: "sawtooth", gain: 0.07, lp: 300, to: 495, attack: 3.2 });
    tone(c, 660, 0.4, 3.1, { type: "sine", gain: 0.05, to: 3520, attack: 2.8 });
    // сердцебиение — всё чаще
    let t = 0.1;
    let gap = 0.95;
    let i = 0;
    while (t < 3.4) {
      thud(c, t, 0.25 + i * 0.035, 70 + i * 3);
      thud(c, t + 0.16, 0.16 + i * 0.025, 62 + i * 3);
      t += gap;
      gap = Math.max(0.3, gap * 0.86);
      i++;
    }
    // 3.5 с: взрыв
    thud(c, 3.5, 1.0, 48);
    noise(c, 3.5, 1.8, { filter: "lowpass", freq: 3000, to: 120, gain: 0.6, attack: 0.01 });
    noise(c, 3.5, 1.2, { filter: "highpass", freq: 2500, gain: 0.2, attack: 0.01 });
    tone(c, 40, 3.5, 1.6, { type: "sine", gain: 0.45, to: 28 });
    // 3.55–7.5: хор-подобные аккорды
    const base = 261.63;
    const chord = (at: number, semis: number[], dur: number, g: number) =>
      semis.forEach((x, k) => {
        tone(c, note(base, x), at, dur, { type: "triangle", gain: g, attack: 0.2 });
        tone(c, note(base, x) * 2.005, at + 0.02 * k, dur, { type: "sine", gain: g * 0.5, attack: 0.3 });
      });
    chord(3.55, [-12, 0, 7, 12, 16, 19, 26], 2.4, 0.075);
    chord(5.6, [-7, 2, 9, 14, 17, 21, 26], 2.0, 0.07);
    chord(7.1, [-12, 0, 7, 12, 16, 19, 24, 28], 1.4, 0.085);
    // искрящееся арпеджио
    const pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    for (let k = 0; k < 40; k++) {
      const at = 3.7 + k * 0.095;
      const idx = Math.min(pent.length - 1, Math.floor((k / 40) * pent.length + Math.random() * 2));
      tone(c, note(523.25, pent[idx]), at, 0.4, { type: "sine", gain: 0.055 });
    }
    // шимери и звон
    for (let k = 0; k < 24; k++) {
      tone(c, 2200 + Math.random() * 3800, 4 + k * 0.14, 0.3, { gain: 0.035 });
    }
    clink(c, 5.1, 1.0);
    clink(c, 5.3, 1.2);
    clink(c, 7.1, 1.1);
  },

  /** Улучшение кристалла (3 с): нарастающий гул, треск трещин, звон разбитого стекла и аккорд появления */
  upgrade() {
    const c = ac();
    if (!c) return;
    // 0–1.4 с: напряжение
    noise(c, 0, 1.4, { filter: "bandpass", freq: 300, to: 4200, q: 1.2, gain: 0.2, attack: 1.2 });
    tone(c, 130, 0, 1.4, { type: "sawtooth", gain: 0.05, lp: 500, to: 420, attack: 1.2 });
    // треск трещин
    [0.45, 0.62, 0.78, 0.92, 1.06, 1.18, 1.28].forEach((t, i) => {
      noise(c, t, 0.08, { filter: "highpass", freq: 3200 + i * 450, gain: 0.24, attack: 0.002 });
      tone(c, 2800 + i * 380, t, 0.06, { type: "square", gain: 0.04, lp: 6000, to: 1800 });
    });
    // 1.4 с: стекло разбивается
    noise(c, 1.4, 0.55, { filter: "highpass", freq: 2500, gain: 0.6, attack: 0.002 });
    noise(c, 1.4, 1.0, { filter: "bandpass", freq: 7000, to: 3000, q: 0.6, gain: 0.4, attack: 0.002 });
    noise(c, 1.4, 0.25, { filter: "lowpass", freq: 1200, gain: 0.35, attack: 0.002 });
    thud(c, 1.4, 0.4, 90);
    // сыплющиеся осколки
    for (let i = 0; i < 30; i++) {
      const at = 1.42 + Math.pow(Math.random(), 1.6) * 1.0;
      tone(c, 2400 + Math.random() * 6200, at, 0.1 + Math.random() * 0.18, {
        gain: 0.035 + Math.random() * 0.045,
        type: Math.random() < 0.5 ? "sine" : "triangle",
      });
      if (i % 3 === 0) noise(c, at, 0.04, { filter: "highpass", freq: 5000, gain: 0.1, attack: 0.001 });
    }
    // 1.55 с: появление улучшенной модели
    [0, 4, 7, 12, 16, 19].forEach((s, i) => tone(c, note(659.25, s), 1.55 + i * 0.07, 1.1, { type: "triangle", gain: 0.09 }));
    tone(c, 82, 1.5, 1.3, { type: "sine", gain: 0.22, to: 55 });
    clink(c, 1.95, 1.0);
    clink(c, 2.1, 1.25);
  },

  /**
   * Крафт (≈2.2 c, совпадает с анимацией): звук стартует мгновенно — без нарастания «из тишины».
   * Заряд → вращение → вспышка на 1.5 c → аккорд. Всю сцену можно оборвать через stopCraft().
   */
  craft() {
    const c = ac();
    if (!c || !master) return;
    this.stopCraft(0.02);
    const bus = c.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    scene = bus;
    dest = bus;
    try {
      // мгновенный щелчок запуска — слышно сразу
      tone(c, 740, 0, 0.09, { type: "triangle", gain: 0.2, to: 300, attack: 0.002 });
      noise(c, 0, 0.12, { filter: "bandpass", freq: 2400, to: 600, q: 1, gain: 0.22, attack: 0.002 });
      // заряд с мгновенным стартом
      tone(c, 110, 0, 1.5, { type: "sawtooth", gain: 0.09, lp: 600, to: 520, attack: 0.03 });
      tone(c, 220, 0, 1.5, { type: "sine", gain: 0.1, to: 1760, attack: 0.03 });
      noise(c, 0.02, 1.5, { filter: "bandpass", freq: 500, to: 5200, q: 1.1, gain: 0.16, attack: 0.05 });
      // треск и пульс
      [0.12, 0.3, 0.48, 0.65, 0.8, 0.95, 1.08, 1.2, 1.3, 1.4].forEach((t, i) => {
        noise(c, t, 0.06, { filter: "highpass", freq: 3200 + i * 350, gain: 0.2, attack: 0.002 });
        if (i % 2 === 0) thud(c, t, 0.2 + i * 0.015, 90 + i * 5);
      });
      // 1.5 c — слияние
      thud(c, 1.5, 0.45, 80);
      noise(c, 1.5, 0.5, { filter: "highpass", freq: 2500, gain: 0.5, attack: 0.002 });
      noise(c, 1.5, 0.9, { filter: "bandpass", freq: 6500, to: 3000, q: 0.6, gain: 0.3, attack: 0.002 });
      [0, 4, 7, 12, 16].forEach((s, i) => tone(c, note(659.25, s), 1.52 + i * 0.06, 0.9, { type: "triangle", gain: 0.085 }));
      clink(c, 1.85, 1.0);
    } finally {
      dest = null;
    }
  },

  /** Оборвать звук крафта (например, если крафт не начался из-за ошибки) */
  stopCraft(fade = 0.05) {
    if (!ctx || !scene) return;
    const g = scene;
    scene = null;
    try {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        g.disconnect();
      } catch {
        /* ignore */
      }
    }, (fade + 0.1) * 1000);
  },

  /** Продажа: монеты сыплются */
  sell(amount: number) {
    const c = ac();
    if (!c) return;
    const n = Math.min(8, 2 + Math.floor(Math.log2(Math.max(1, amount)) * 2));
    for (let i = 0; i < n; i++) clink(c, i * 0.065, 0.9 + Math.random() * 0.35);
    tone(c, 880, 0, 0.18, { type: "triangle", gain: 0.08, to: 1320 });
  },

  /** Помощь / подарочные монеты */
  grant() {
    const c = ac();
    if (!c) return;
    [0, 4, 7, 12].forEach((s, i) => tone(c, note(523.25, s), i * 0.08, 0.3, { type: "triangle", gain: 0.12 }));
    clink(c, 0.32, 1);
  },

  /** Сброс прогресса */
  reset() {
    const c = ac();
    if (!c) return;
    tone(c, 440, 0, 0.5, { type: "sawtooth", gain: 0.08, lp: 1200, to: 80 });
  },
};

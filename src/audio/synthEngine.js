// ============================================================================
// MOTOR DE ÁUDIO SINTETIZADO — tudo gerado por código via Web Audio API, sem
// nenhum arquivo de música externo (zero questão de direitos autorais). Dá
// pra trocar por faixas reais depois: veja src/audio/cues.js.
// ============================================================================

let ctx = null;
let masterGain = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// Precisa ser chamado a partir de um clique do usuário (política de autoplay
// dos navegadores) — usado pelo botão "Ativar som" do telão.
export function resumeAudio() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();
}

export function setMasterVolume(volume) {
  getCtx();
  masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime, 0.05);
}

// Toca um único tom com envelope simples (ataque rápido, decaimento suave).
export function playTone({ freq, duration = 0.4, type = "sine", when = 0, gainValue = 0.2, attack = 0.01 }) {
  const c = getCtx();
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainValue, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// Toca uma sequência de notas em fila (arpejos, fanfarras, stings).
// notes: [{ freq, duration, type, gainValue }] — cada nota começa quando a
// anterior termina, a não ser que "overlap" seja passado (em segundos).
export function playSequence(notes, overlap = 0) {
  let t = 0;
  for (const n of notes) {
    playTone({ ...n, when: t });
    t += (n.duration ?? 0.3) - overlap;
  }
}

// Um "hit" curto de ruído (percussivo), útil pra dar impacto em stings.
export function playNoiseHit({ duration = 0.15, gainValue = 0.15, when = 0 }) {
  const c = getCtx();
  const t0 = c.currentTime + when;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(gainValue, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  source.connect(gain).connect(masterGain);
  source.start(t0);
}

// Cria um loop repetindo uma função de "batida" a cada intervalo (ms).
// Retorna uma função pra parar o loop.
export function startLoop(tickFn, intervalMs) {
  tickFn();
  const id = setInterval(tickFn, intervalMs);
  return () => clearInterval(id);
}

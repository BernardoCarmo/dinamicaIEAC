// ============================================================================
// CUES DE ÁUDIO — um som (ou loop) para cada fase do jogo. Tudo sintetizado
// (ver synthEngine.js). Se um dia quiser trocar por faixas de música de
// verdade, veja a nota no fim deste arquivo.
// ============================================================================
import { playTone, playSequence, playNoiseHit, startLoop } from "./synthEngine";

const NOTE = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
};

// --- Cues de "um só toque" (stings) ------------------------------------------
function playEventSting() {
  playSequence([
    { freq: NOTE.C4, duration: 0.12, type: "triangle", gainValue: 0.15 },
    { freq: NOTE.E4, duration: 0.12, type: "triangle", gainValue: 0.15 },
    { freq: NOTE.G4, duration: 0.12, type: "triangle", gainValue: 0.15 },
    { freq: NOTE.C5, duration: 0.35, type: "triangle", gainValue: 0.18 },
  ]);
  playNoiseHit({ when: 0.4, duration: 0.2, gainValue: 0.12 });
}

function playGdpChime() {
  playSequence([
    { freq: NOTE.E5, duration: 0.1, type: "sine", gainValue: 0.15 },
    { freq: NOTE.C6, duration: 0.2, type: "sine", gainValue: 0.15 },
  ]);
}

function playResultFanfare() {
  playSequence([
    { freq: NOTE.C4, duration: 0.15, type: "sawtooth", gainValue: 0.14 },
    { freq: NOTE.E4, duration: 0.15, type: "sawtooth", gainValue: 0.14 },
    { freq: NOTE.G4, duration: 0.15, type: "sawtooth", gainValue: 0.14 },
    { freq: NOTE.C5, duration: 0.5, type: "sawtooth", gainValue: 0.2 },
  ]);
  playNoiseHit({ when: 0.45, duration: 0.25, gainValue: 0.15 });
}

function playInflationDip() {
  playSequence([
    { freq: NOTE.E4, duration: 0.25, type: "sine", gainValue: 0.14 },
    { freq: NOTE.C4, duration: 0.4, type: "sine", gainValue: 0.14 },
  ]);
}

function playVsSting() {
  playTone({ freq: 65, duration: 0.8, type: "sine", gainValue: 0.25 });
  playSequence([
    { freq: NOTE.C4, duration: 0.2, type: "sawtooth", gainValue: 0.16 },
    { freq: NOTE.G4, duration: 0.5, type: "sawtooth", gainValue: 0.2 },
  ]);
  playNoiseHit({ when: 0.05, duration: 0.3, gainValue: 0.18 });
}

function playClosingFanfare() {
  playSequence(
    [
      { freq: NOTE.C4, duration: 0.18, type: "sawtooth", gainValue: 0.15 },
      { freq: NOTE.E4, duration: 0.18, type: "sawtooth", gainValue: 0.15 },
      { freq: NOTE.G4, duration: 0.18, type: "sawtooth", gainValue: 0.15 },
      { freq: NOTE.C5, duration: 0.18, type: "sawtooth", gainValue: 0.17 },
      { freq: NOTE.E5, duration: 0.18, type: "sawtooth", gainValue: 0.17 },
      { freq: NOTE.G5, duration: 0.7, type: "sawtooth", gainValue: 0.22 },
    ],
    0.02
  );
  playNoiseHit({ when: 0.85, duration: 0.3, gainValue: 0.15 });
}

// --- Cues em loop -------------------------------------------------------------
function startLobbyLoop() {
  const freqs = [130.81, 164.81]; // C3, E3 — pad suave de fundo
  return startLoop(() => {
    freqs.forEach((f, i) => playTone({ freq: f, duration: 3.6, type: "sine", gainValue: 0.045, when: i * 0.4 }));
  }, 4000);
}

function startBastidoresLoop() {
  const freqs = [110, 116.54]; // A2 / A#2 — dissonância leve, clima de mistério
  return startLoop(() => {
    freqs.forEach((f, i) => playTone({ freq: f, duration: 1.8, type: "sine", gainValue: 0.05, when: i * 0.5 }));
    playNoiseHit({ gainValue: 0.03, duration: 0.08 });
  }, 1500);
}

function startAuctionBlindLoop() {
  // Tique-taque de tensão, ritmo moderado.
  return startLoop(() => playTone({ freq: 880, duration: 0.06, type: "square", gainValue: 0.09 }), 600);
}

function startAuctionOpenLoop() {
  // Arpejo rápido e energético — a reta final do leilão.
  const freqs = [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.A4 * 2];
  let i = 0;
  return startLoop(() => {
    playTone({ freq: freqs[i % freqs.length], duration: 0.18, type: "sawtooth", gainValue: 0.1 });
    i++;
  }, 200);
}

function startRankingLoop() {
  const freqs = [NOTE.D4, NOTE.F4, NOTE.A4];
  let i = 0;
  return startLoop(() => {
    playTone({ freq: freqs[i % freqs.length], duration: 0.9, type: "triangle", gainValue: 0.07 });
    i++;
  }, 900);
}

// --- Mapa de cues usado pelo hook useGameAudio -------------------------------
export const CUES = {
  lobby: { type: "loop", play: startLobbyLoop },
  event: { type: "oneshot", play: playEventSting },
  gdp: { type: "oneshot", play: playGdpChime },
  bastidores: { type: "loop", play: startBastidoresLoop },
  auctionBlind: { type: "loop", play: startAuctionBlindLoop },
  auctionOpen: { type: "loop", play: startAuctionOpenLoop },
  result: { type: "oneshot", play: playResultFanfare },
  inflation: { type: "oneshot", play: playInflationDip },
  ranking: { type: "loop", play: startRankingLoop },
  vs: { type: "oneshot", play: playVsSting },
  closing: { type: "oneshot", play: playClosingFanfare },
};

// Quer usar músicas de verdade em vez do som sintetizado? Troque cada "play"
// acima por algo que crie um elemento <audio src="/audio/seu-arquivo.mp3">
// e retorne uma função que pausa/limpa esse áudio (pro caso de ser um loop).
// Baixe faixas livres de direitos em bancos como YouTube Audio Library,
// Pixabay Music ou Incompetech, e coloque os arquivos em "public/audio/".

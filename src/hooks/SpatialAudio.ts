import * as THREE from 'three';

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playSpatialAlert = (
  position: THREE.Vector3,
  duration = 0.25,
  isDanger = false
) => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (isDanger && "vibrate" in navigator) {
    navigator.vibrate([100, 50, 200, 50, 100]); 
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createPanner();

  panner.panningModel = 'HRTF';
  panner.distanceModel = 'exponential';

  panner.positionX.setTargetAtTime(position.x, audioCtx.currentTime, 0.05);
  panner.positionY.setTargetAtTime(position.y, audioCtx.currentTime, 0.05);
  panner.positionZ.setTargetAtTime(position.z, audioCtx.currentTime, 0.05);

  osc.type = isDanger ? 'square' : 'sine';
  osc.frequency.setTargetAtTime(isDanger ? 220 : 880, audioCtx.currentTime, 0.01);

  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(isDanger ? 0.5 : 0.2, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};
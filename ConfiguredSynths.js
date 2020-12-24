const kick = new Tone.MembraneSynth({
    pitchDecay: 0.07,
    octaves: 5,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.002,
        release: 1,
        attackCurve: "exponential"
    }
}).toDestination();

const hihat = new Tone.MetalSynth({
  envelope: {
    attack: 0.008,
    decay: 0.052,
    release: 0.002
  },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 3000,
  octaves: 1.5
}).toDestination();

const snare = new Tone.NoiseSynth().toDestination();

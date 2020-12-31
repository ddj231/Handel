class FMSynth{
  constructor(){
    this.synth =  new Tone.PolySynth({
      voice: Tone.FMSynth, 
      envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0.002,
          release: 1,
      }
    }).toDestination();
    this.synth.volume.value = -5;

  }

}
/*
class Kick{
  constructor(){
    this.synth = new Tone.PolySynth({
        voice: Tone.MembraneSynth,
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
  }
}
*/

/*
class HiHat{
  constructor(){
    this.synth = new Tone.PolySynth({
        voice: Tone.MetalSynth,
        oscillator: {
            type :"fmsine",
            phase: 140,
            modulationType: "sine",
            modulationIndex:0.8,
            partials: [1] //1,0.1,0.01,0.01
        },
        envelope: {
          attack: 0.008,
          decay: 0.002,
          release: 0.002
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 3000,
        octaves: 1.5
    }).toDestination();
    this.synth.volume.value = -8;
  }
}
*/


class Snare {
  constructor(){
    this.synth = new Tone.Sampler({
      urls: {
        D2: "Snare_D2.wav",
      },
      baseUrl: "./Sounds/",
    }).toDestination();
    this.synth.volume.value = -3;
  }
}
class Piano {
  constructor(){
    this.synth = new Tone.Sampler({
      urls: {
        C5: "Piano_C5.wav",
        A4: "Piano_A4.wav",
      },
      baseUrl: "./Sounds/",
    }).toDestination();
  }
}

class Kick {
  constructor(){
    this.synth = new Tone.Sampler({
      urls: {
        C1: "Kick_C.wav",
      },
      baseUrl: "./Sounds/",
    }).toDestination();
  }
}

class HiHat{
  constructor(){
    this.synth = new Tone.Sampler({
      urls: {
        G3: "HiHat_G.wav",
      },
      baseUrl: "./Sounds/",
    }).toDestination();
  }
}

class Casio {
  constructor(){
    this.synth = new Tone.Sampler({
      urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/casio/",
    }).toDestination();
  }
}

class Composition {
    constructor(synth, bpm){
        this.synth = new Tone.PolySynth({voice: synth}).toDestination();
        this.bpm = bpm;
        this.playEvents = [];
        this.currentTime = 0;
        // Create Part
        this.part = new Tone.Part((time, value) => {
		    this.synth.triggerAttackRelease(value.notes, value.length, time);
        });
    }

    configurePart(playEvents){
        for(let playEvent of playEvents){
            if(playEvent.notes){
                this.part.add({notes: playEvent.notes, time: this.currentTime, length: playEvent.length});
            }
            this.currentTime += new Tone.Time(playEvent.length);
        }
    }

    configureLoop(times){
        this.part.loopStart = 0;
        this.part.loopEnd = this.currentTime;
        this.part.loop = times;
    }

    play(){
        Tone.Transport.bpm.value = this.bpm;
        this.part.start();
        Tone.Transport.start();
    }

}

class PlayEvent {
    constructor(notes, length){
        this.length = length;
        this.notes = notes
    }
}
class Composition {
    constructor(synth, bpm){
        this.synth = new Tone.PolySynth({voice: synth}).toDestination();
        this.bpm = bpm;
        this.playEvents = [];
        this.currentTime = 0;
        this.startTime = 0;
        //console.log(Tone.now());
        this.loopTimes = 1;
        // Create Part
        this.part = new Tone.Part((time, value) => {
		    this.synth.triggerAttackRelease(value.notes, value.length, time);
        });
    }

    configurePart(playEvents){
        Tone.Transport.bpm.value = this.bpm;
        for(let playEvent of playEvents){
            this.playEvents.push(playEvent);
            if(playEvent.notes){
                this.part.add({notes: playEvent.notes, time: this.currentTime, length: playEvent.length});
            }
            //console.log(Tone.Time(playEvent.length).toSeconds());
            this.currentTime += new Tone.Time(playEvent.length).toSeconds();
        }
    }

    configureLoop(times){
        this.part.loopStart = this.startTime;
        this.part.loopEnd = this.currentTime;
        this.part.loop = times;
    }

    play(){
        Tone.Transport.bpm.value = this.bpm;
        this.configureLoop(this.loopTimes);
        //Tone.Transport.bpm.rampTo(this.bpm, 0.05);
        this.part.start(0.1);
        //Tone.Transport.start();
    }

}

class PlayEvent {
    constructor(notes, length){
        this.length = length;
        this.notes = notes
    }
}
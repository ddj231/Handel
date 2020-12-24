const Tone = window.Tone;
let notes = [];
let noteHeight = 50;
let noteWidth = 50;
let letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function setup(){
	createCanvas(noteWidth * 7, noteHeight * 7);
	const synth = new Tone.PolySynth({voice: Tone.FMSynth}).toDestination(); 
	const synth2 = new Tone.Synth().toDestination(); 
	const synth3 = kick; 
	const synth4 = hihat; 
	const reverb = new Tone.Reverb(3.0).toDestination();
	//synth.connect(reverb);
	//const synth = new Tone.Synth().toMaster();
	for(let i = 0; i < 7; i++){
		for(let j = 0; j < 7; j++){
			notes.push(new NoteNode(`${letters[i]}${j + 1}`, synth, i * noteWidth, j * noteWidth, noteWidth, noteHeight));
		}
	}

	/*
	let event = new HandelInterpreter("C3, E3, G3 for 2b").expr();
	let myComposition = new Composition(Tone.AMSynth, 140);
	console.log(event);
	myComposition.configurePart([event]);
	myComposition.play();
	*/

	/*
	let time = 0;
	let myComposition = new Composition(synth, 140);
	myComposition.configurePart([
		new PlayEvent('C3#', '4n'),
		new PlayEvent('D3#', '8n'),
		new PlayEvent('E3#', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('F2#', '8n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('D3#', '4n'),
		new PlayEvent('C2#', '4n'),
	]);

	let myComposition2 = new Composition(synth2, 140);
	myComposition2.configurePart([
		new PlayEvent('G1#', '4n'),
		new PlayEvent('G1#', '8n'),
		new PlayEvent('E1#', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1#', '8n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1#', '4n'),
		new PlayEvent('C1#', '4n'),
	]);

	let myComposition3 = new Composition(synth3, 140);
	myComposition3.configurePart([
		new PlayEvent('G1#', '4n'),
		new PlayEvent('G1#', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1#', '4n'),
		new PlayEvent('G1#', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1#', '4n'),
		new PlayEvent('G1#', '4n'),
	]);

	let myComposition4 = new Composition(synth4, 140);
	myComposition4.configurePart([
		new PlayEvent('X', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('G1', '4n'),
		new PlayEvent('X', '4n'),
		new PlayEvent('X', '4n'),
	]);

	myComposition.configureLoop(4);
	myComposition2.configureLoop(4);
	myComposition3.configureLoop(4);
	myComposition4.configureLoop(4);
	myComposition.play();
	myComposition2.play();
	myComposition3.play();
	myComposition4.play();
	*/
}

function draw(){
	background(0);
	for(let noteNode of notes){
		noteNode.draw();
	}
}

function mousePressed(){
	for(let noteNode of notes){
		if(noteNode.checkMouseIntersect()){
			noteNode.play("8n");
		}
	}
	let lexer = new HandelLexer("C#2, Eb2, G2, Bb2 for 3b");
	let event = new HandelInterpreter(lexer).expr(); 
	let myComposition = new Composition(Tone.AMSynth, 140);
	console.log(event);
	myComposition.configurePart([event]);
	myComposition.play();
}

class NoteNode {
	constructor(note, synth, x, y, height, width){
		this.note = note;
		this.synth = synth;
		this.x = x;
		this.y = y;
		this.height = height;
		this.width = width;
		this.selected = false;
		this.timeToDeselect = 50;
	}

	draw(){
		if(this.selected){
			fill(255, 255, 0);
		}
		else {
			fill(255);
		}
		rect(this.x, this.y, this.height, this.width);
		fill(0);
		text(this.note, this.x, this.y + this.height - 1)
		if(this.timeToDeselect <= 0){
			this.selected = false;
		}
		else{
			this.timeToDeselect -= 1;
		}
	}

	play(length){
		this.timeToDeselect = 30;
		this.selected = true;
		this.synth.triggerAttackRelease([this.note], length);
	}

	checkMouseIntersect(){
		if(mouseX < this.x + this.width && mouseX > this.x && mouseY > this.y && mouseY < this.y + this.height){
			return true;
		}
	}

}


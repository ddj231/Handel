import * as Tone from 'tone';
import { Midi } from '@tonejs/midi'

import pianoA4 from './Sounds/Piano_A4.wav'
import pianoC5 from './Sounds/Piano_C5.wav'
import kickC from './Sounds/Kick_C.wav'
import guitarD from './Sounds/Guitar_D_extended.wav'
import hihatG from './Sounds/HiHat_G.wav'
import snareD from './Sounds/Snare_D2.wav'


export const Handel = (function(){
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
            this.synth.volume.value = -12;
        }
    }

    class Snare {
        constructor(){
            this.synth = new Tone.Sampler({
            urls: {
                D2: snareD,
            },
            //baseUrl: baseUrl,
            }).toDestination();
            this.synth.volume.value = -3;
        }
    }
    class Piano {
        constructor(){
            this.synth = new Tone.Sampler({
            urls: {
                C5: pianoC5,
                A4: pianoA4,
            },
            //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class Guitar {
        constructor(){
            this.synth = new Tone.Sampler({
            urls: {
                D3: guitarD,
            },
            //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class Kick {
        constructor(){
            this.synth = new Tone.Sampler({
            urls: {
                C1: kickC,
            },
            //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class HiHat{
        constructor(){
            this.synth = new Tone.Sampler({
            urls: {
                G3: hihatG,
            },
            //baseUrl: baseUrl,
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

    class Composition {
        constructor(synth, bpm, midiOption){
            this.synth = new Tone.PolySynth({voice: synth}).toDestination();
            this.bpm = bpm;
            this.playEvents = [];
            this.currentTime = 0;
            this.midiTime = 0;
            this.startTime = 0;
            this.loopTimes = 1;
            // Create Part
            this.part = new Tone.Part((time, value) => {
                this.synth.triggerAttackRelease(value.notes, value.length, Tone.Time(time));
            });
            //each composition also represents a midi track
            if(midiOption.midi){
                this.midi = midiOption.midi;
                this.track = midiOption.midi.addTrack();
                this.track.name = midiOption.trackName;
                this.notes = [];
            }
        }
    
        secondsFromBPM(beats){
            return beats/(Tone.Transport.bpm.value / 60);
        }

        holdFor(beats){
            let convertedBeats = beats * (Tone.Transport.bpm.value / this.bpm)
            return convertedBeats/(Tone.Transport.bpm.value / 60);
        }
        
        configurePart(playEvents){
            for(let playEvent of playEvents){
                this.playEvents.push(playEvent);
                let length = this.secondsFromBPM(playEvent.numBeats);
                let holdFor = this.holdFor(playEvent.numBeats);
                for(let i = 0; i < playEvent.rep; i++){
                    if(playEvent.notes){
                        this.part.add({notes: playEvent.notes, time: this.currentTime, length: holdFor});
                        this.addNotesToTrack(playEvent.notes, this.midiTime, holdFor, length)
                    }
                    this.currentTime += length;
                    this.midiTime += holdFor;
                }
            }
        }

        addNotesToTrack(notes, time, holdFor, length){
            if(!this.midi){ return}
            for(let note of notes){
                this.track.addNote({
                    name: note, 
                    time: time,
                    duration: holdFor 
                });
            }
        }

        configureMidiLoop(times){
            if(!this.midi){ return}
            for(let i = 1; i < times; i++){
                for(let playEvent of this.playEvents){
                    let holdFor = this.holdFor(playEvent.numBeats);
                    for(let i = 0; i < playEvent.rep; i++){
                        if(playEvent.notes){
                            this.addNotesToTrack(playEvent.notes, this.midiTime, holdFor, length)
                        }
                        this.midiTime += holdFor;
                    }
                }
            }
        }
    
        configureLoop(times){
            this.part.loopStart = Tone.Time(this.startTime);
            this.part.loopEnd = Tone.Time(this.currentTime); 
            this.part.loop = times;
        }
    
        play(){
            this.part.playbackRate = this.bpm / Tone.Transport.bpm.value 
            this.configureLoop(this.loopTimes);
            this.configureMidiLoop(this.loopTimes);
            this.part.start(0.1);
        }
    
    }
    
    class PlayEvent {
        constructor(notes, length, numBeats, rep = 1){
            this.length = length;
            this.notes = notes;
            this.numBeats = numBeats;
            this.rep = rep
        }
    }

    // Token types
    const [NOTE, BPM, SOUND, LOOP, BLOCK, ENDBLOCK, DO,  INSTRUMENT, BEAT, DIGIT, FOR, SEP, CHUNK, 
        ENDCHUNK, ID, START, FINISH, SAVE, DOT, PLAY,
        REST, WITH, RUN, LOAD, AS, ASSIGN, USING, EOF] = ["NOTE", "BPM", "SOUND", "LOOP", "BLOCK", "ENDBLOCK",
        "DO", "INSTRUMENT",
        "BEAT", "DIGIT", "FOR", "SEP", "CHUNK", 
        "ENDCHUNK", "ID", "START", "FINISH", "SAVE", "DOT", "PLAY", 
        "REST", "WITH", "RUN", "LOAD", "AS", "ASSIGN", "USING", "EOF"];


    class Token {
        constructor(type, value, lineno){
            this.type = type;
            this.value = value;
            this.lineno = lineno
        }
    }

    const RESERVED_KEYWORDS = {
        for: new Token(FOR, 'for'),
        chunk: new Token(CHUNK, 'chunk'),
        endchunk: new Token(ENDCHUNK, 'endchunk'),
        save: new Token(SAVE, 'save'),
        play: new Token(PLAY, 'play'),
        rest: new Token(REST, 'rest'),
        using: new Token(USING, 'using'),
        start: new Token(START, 'start'),
        finish: new Token(FINISH, 'finish'),
        run: new Token(RUN, 'run'),
        with: new Token(WITH, 'with'),
        bpm: new Token(BPM, 'bpm'),
        loop: new Token(LOOP, 'loop'),
        sound: new Token(SOUND, 'sound'),
        casio: new Token(INSTRUMENT, 'casio'),
        kick: new Token(INSTRUMENT, 'kick'),
        snare: new Token(INSTRUMENT, 'snare'),
        synth: new Token(INSTRUMENT, 'synth'),
        piano: new Token(INSTRUMENT, 'piano'),
        hihat: new Token(INSTRUMENT, 'hihat'),
        guitar: new Token(INSTRUMENT, 'guitar'),
        block: new Token(BLOCK, 'BLOCK'),
        endblock: new Token(ENDBLOCK, 'ENDBLOCK'),
        load: new Token(LOAD, 'LOAD'),
        as: new Token(AS, 'AS'),
    }

    class HandelSymbol {
        constructor(name, type=null){
            this.name = name;
            this.type = type;
        }
    }

    class BuiltInTypeSymbol extends HandelSymbol {
        constructor(name){
            super(name);
        }
    }

    class VarSymbol extends HandelSymbol{
        constructor(name, type){
            super(name, type)
        }
    }

    class ProcedureSymbol extends HandelSymbol{
        constructor(name, type, params = null){
            super(name);
            this.params = []; 
            this.statementList = null;
        }
    }

    class HandelSymbolTable {
        constructor(scopeName, scopeLevel, enclosingScope = null){
            this.symbols = {};
            this.scopeName = scopeName;
            this.scopeLevel = scopeLevel;
            this.enclosingScope = enclosingScope;
            this.initbuiltins();
        }
        initbuiltins(){
            let beat = new BuiltInTypeSymbol('BEAT');
            let note = new BuiltInTypeSymbol('PLAYABLE');
            let any = new BuiltInTypeSymbol('ANY');
            this.define(beat);
            this.define(note);
            this.define(any);
        }
        define(symbol){
            symbol.scopeLevel = this.scopeLevel;
            this.symbols[symbol.name] = symbol;
        }
        lookup(name, currentScopeOnly = false){
            let symbol = this.symbols[name];
            if(symbol){
                return symbol;
            }

            if(currentScopeOnly){
                return null;
            }

            if(this.enclosingScope){
                return this.enclosingScope.lookup(name);
            }
        }

        error(varName){
            throw Error(`Symbol ${varName} not found`)
        }
    }


    class HandelLexer {
        constructor(text){
            this.text = text;
            this.pos = 0;
            this.currentChar = this.text[this.pos];
            this.lineno = 1;
            this.possibleChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            this.possibleNums= ['0', '1', '2', '3', '4', '5', '6', '7'];
        }

        error(){
            throw new Error("error analyzing input at line", this.lineno);
        }

        peek(){
            if(this.pos >= this.text.length - 1){
                return null;
            }
            else {
                return this.text[this.pos + 1];
            } 
        }

        advance(){
            this.pos += 1;
            if(this.pos >= this.text.length){
                this.currentChar = null;
            }
            else{
                this.currentChar = this.text[this.pos];
            }
        }

        isSpace(ch){
            if(ch === '\n'){
                this.lineno += 1;
            }
            return ch === ' '  || ch === '\t' || ch === '\n' || ch === '\r';
        }

        isAlpha(ch){
            let regex = /^[a-zA-Z]{1}$/
            return regex.test(ch);
        }
        
        skipWhitespace(){
            while(this.currentChar !== null && this.isSpace(this.currentChar)){
                this.advance();
            }
        }

        id(){
            let result = "";
            while(this.currentChar && this.isAlpha(this.currentChar)){
                result += this.currentChar;
                this.advance();
            }

            if(result !== ""){
                if(result in RESERVED_KEYWORDS){
                    let token = RESERVED_KEYWORDS[result];
                    token.lineno = this.lineno
                    return token;
                    //return RESERVED_KEYWORDS[result];
                }
                return new Token(ID, result, this.lineno);
            }
        }

        getNextToken(){
            // Lexical analyzer
            this.skipWhitespace();

            if(this.pos >= this.text.length){
                return new Token(EOF, null, this.lineno);
            }
            
            if(this.possibleChars.includes(this.currentChar)){
                let note = this.currentChar;
                this.advance();
                if(this.possibleNums.includes(this.currentChar)){
                    note += this.currentChar;
                    this.advance();
                    return new Token(NOTE, note, this.lineno);
                }
                else if(this.currentChar === 'b' || this.currentChar === "#"){
                    note += this.currentChar;
                    this.advance();
                    if(this.possibleNums.includes(this.currentChar)){
                        note += this.currentChar;
                        this.advance();
                        return new Token(NOTE, note, this.lineno);
                    }
                }
                else{
                    this.error();
                }
            }

            if(this.currentChar === ','){
                this.advance();
                return new Token(SEP, 'sep', this.lineno);
            }

            if(this.currentChar === '.'){
                this.advance();
                return new Token(DOT, 'dot', this.lineno);
            }

            if(this.currentChar === '='){
                this.advance();
                return new Token(ASSIGN, 'assign', this.lineno);
            }

            let idResult = this.id();
            if(idResult){
                return idResult;
            }

            const beatValue = this.currentChar;
            const parsed = Number.parseInt(beatValue);
            if(!Number.isNaN(parsed)){
                this.advance();
                if(this.currentChar === 'b'){
                    this.advance();
                    return new Token(BEAT, beatValue, this.lineno);
                }
                else {
                    let digit = beatValue;
                    let current = Number.parseInt(this.currentChar);
                    while(!Number.isNaN(current)){
                        digit += this.currentChar;
                        this.advance();
                        current = Number.parseInt(this.currentChar);
                    }
                    if(this.currentChar === 'b'){
                        this.advance();
                        return new Token(BEAT, digit, this.lineno);
                    }
                    return new Token(DIGIT, Number.parseInt(digit), this.lineno);
                }
            }
            
            this.error();
        }
    }

    class AST {
        constructor(){
            this.token = token;
            this.child = child;
        }
    }
    class BeatAST {
        constructor(token){
        this.token = token;
        this.value = token.value;
        }
    }

    class LoadAST {
        constructor(token, instrumentName, localVarName){
            this.token = token;
            this.instrumentName= instrumentName;
            this.localVarName = localVarName;
        }
    }

    class PlayAST{
        constructor(token, child = null, rep = null){
        this.token = token;
        this.value = token.value;
        this.child = child;
        this.rep = rep;
        }
    }

    class AssignAST{
        constructor(token, left, right){
        this.token = token;
        this.value = token.value;
        this.left = left;
        this.right = right;
        }
    }

    class StatementAST{
        constructor(token, child){
        this.token = token;
        this.value = token.value;
        this.child = child;
        }
    }

    class StatementListAST{
        constructor(){
        this.children = [];
        }
    }

    class ProgramAST{
        constructor(token, child){
        this.token = token;
        this.value = token.value;
        this.child = child;
        }
    }

    class BlockLoopAST {
        constructor(token, statementList, loopTimes) {
            this.token = token;
            this.statementList = statementList;
            this.loopTimes = loopTimes;
        }
    }

    class ParameterListAST{
        constructor(){
        this.children = [];
        }
    }

    class ParameterAST{
        constructor(token, child){
        this.token = token;
        this.value = token.value;
        this.child = child;
        }
    }

    class SectionDeclarationAST{
        constructor(token, parameterList, statementList){
            this.token = token;
            this.value = this.token.value;
            this.parameterList = parameterList;
            this.statementList = statementList;
        }
    }

    class BPMAST{
        constructor(token, bpm){
            this.token = token;
            this.value = bpm;
            this.bpm = bpm;
        }
    }

    class LoopAST{
        constructor(token, loopTimes){
            this.token = token;
            this.value = loopTimes;
            this.loopTimes = loopTimes;
        }
    }

    class RepAST {
        constructor(token, repTimes){
            this.token = token;
            this.value = repTimes;
            this.repTimes = repTimes;
        }
    }

    class InstrumentAST{
        constructor(token, instrument){
            this.token = token;
            this.value = instrument;
            this.instrument = instrument;
        }
    }

    class ProcedureCallAST{
        constructor(token, actualParams, customizationList){
            this.token = token;
            this.value = this.token.value;
            this.actualParams = actualParams;
            this.customizationList = customizationList;
            this.procSymbol = null;
        }
    }


    class RestAST{
        constructor(token, child = null){
        this.token = token;
        this.value = token.value;
        this.child = child;
        }
    }

    class NoteAST {
        constructor(token, child = null){
        this.token = token;
        this.value = token.value;
        this.child = child;
        }
    }

    class IdAST {
        constructor(token){
        this.token = token;
        this.value = token.value;
        }
    }

    class SepAST {
        constructor(token, left, right){
            this.token = token;
            this.left = left;
            this.right = right;
        }
    }

    class ForAST {
        constructor(token, left, right){
            this.token = token;
            this.left = left;
            this.right = right;
        }
    }

    class HandelParser {
        constructor(lexer){
            this.lexer = lexer;
            this.currentToken = this.lexer.getNextToken();
        }

        error(){
            throw new Error(`error parsing input at line ${this.currentToken.lineno}`);
        }

        eat(type){
            if(this.currentToken.type === type){
                this.currentToken = this.lexer.getNextToken();
            }
            else{
                this.error();
            }
        }

        play(){
            let token = this.currentToken;
            this.eat(PLAY);
            let child = this.expr();
            let rep;
            if(this.currentToken.type === LOOP){
                rep = this.rep();
            }
            return new PlayAST(token, child, rep);
        }

        rep(){
            let token = this.currentToken;
            this.eat(LOOP);
            this.eat(FOR);
            let digit = this.currentToken;
            this.eat(DIGIT);
            return new RepAST(token, digit.value);
        }

        rest(){
            let restToken = this.currentToken;
            this.eat(REST);
            let beat;
            if(this.currentToken.type === FOR){
                let forToken = this.currentToken;
                this.for();
                beat = this.beat();
                let forNode = new ForAST(forToken, beat, null);
                return new RestAST(restToken, forNode);
            }
            else if(this.currentToken.type === ID){
                let varToken = this.id();
                //beat = this.globalVariables[varName];
                let idNode = new IdAST(varToken);
                //if(!this.currentScope.lookup(varName)){ this.currentScope.error(varName) }
                return new RestAST(restToken, idNode);
            }
            else{
                this.error();
            }
        }

        chunk(){
            this.eat(CHUNK);
        }

        endchunk(){
            this.eat(ENDCHUNK);
        }

        using(){
            this.eat(USING);
        }

        program(){
            let startToken = this.currentToken;
            this.eat(START);
            let statementList;
            if(this.currentToken && 
                (this.currentToken.type === CHUNK || 
                this.currentToken.type === PLAY ||
                this.currentToken.type === REST ||
                this.currentToken.type === RUN ||
                this.currentToken.type === LOAD ||
                this.currentToken.type === BLOCK ||
                this.currentToken.type === SAVE)){
                    statementList = this.statementList();
            }
            else{
                this.error();
            }
            let programNode = new ProgramAST(startToken, statementList);
            this.eat(FINISH);
            return programNode;
        }


        sectionDeclaration(){
            this.chunk();
            let proc = this.id();

            let parameterList;
            if(this.currentToken.type === USING){
            this.using(); 
            parameterList = this.parameterList();
            }
            let statementListNode = this.statementList();
            let sectionNode = new SectionDeclarationAST(proc, parameterList, statementListNode);
            //sectionNode.statementList = statementListNode;
            this.endchunk();
            return sectionNode;
        }

        parameterList(){
            let parameterListNode = new ParameterListAST();
            let paramToken = this.id();
            let parameter = new ParameterAST(paramToken);
            parameterListNode.children.push(parameter);
            while(this.currentToken.type && this.currentToken.type === SEP){
                this.sep();
                let paramToken = this.id();
                let parameter = new ParameterAST(paramToken);
                parameterListNode.children.push(parameter);
            }
            return parameterListNode;
        }

        argumentList(){
            let actualParams = []; 
            actualParams.push(this.expr());
            while(this.currentToken && this.currentToken.type === SEP){
                this.sep();
                actualParams.push(this.expr());
            }
            return actualParams;
        }

        customization(){
            if(this.currentToken.type === BPM){
                let bpmToken = this.currentToken;
                this.eat(BPM);
                let digit = this.currentToken.value;
                this.eat(DIGIT);
                return new BPMAST(bpmToken, digit);
            }
            else if(this.currentToken.type === SOUND){
                let soundToken = this.currentToken;
                this.eat(SOUND);
                let instrument = this.currentToken.value;
                if(this.currentToken.type === INSTRUMENT){
                    this.eat(INSTRUMENT);
                }
                else {
                    this.eat(ID);
                }
                return new InstrumentAST(soundToken, instrument);
            }
            else if(this.currentToken.type === LOOP){
                let loopToken = this.currentToken;
                this.eat(LOOP);
                this.eat(FOR);
                let digit = this.currentToken.value;
                this.eat(DIGIT);
                return new LoopAST(loopToken, digit);
            }
            else{
                this.error();
            }
        }

        customizationList(){
            let customizations = [];
            customizations.push(this.customization());
            while(this.currentToken && this.currentToken.type === SEP){
                this.eat(SEP);
                customizations.push(this.customization());
            }
            return customizations;
        }

        blockLoop(){
            let blockToken = this.currentToken;
            this.eat(BLOCK);
            let statementList = this.statementList();
            this.eat(ENDBLOCK);
            this.eat(LOOP);
            this.eat(FOR);
            let digitToken = this.currentToken;
            this.eat(DIGIT);
            return new BlockLoopAST(blockToken, statementList, digitToken.value);
        }
        
        procedureCall(){
            this.eat(RUN);
            let procedureToken = this.currentToken;
            procedureToken.category = "PROCEDURECALL";
            this.eat(ID);
            let actualParams = [];
            if(this.currentToken.type === USING){
                this.eat(USING);
                if(this.currentToken.type === FOR || this.currentToken.type === NOTE || this.currentToken.type === ID){
                    actualParams = this.argumentList();
                }
            }
            let customizationList = [];
            if(this.currentToken.type === WITH){
                this.eat(WITH);
            customizationList = this.customizationList(); 
            }
            return new ProcedureCallAST(procedureToken, actualParams, customizationList);
        }

        statementList(){
            let statementListNode = new StatementListAST();
            while(this.currentToken && 
                    (this.currentToken.type === CHUNK || 
                    this.currentToken.type === PLAY || 
                    this.currentToken.type === REST ||
                    this.currentToken.type === RUN ||
                    this.currentToken.type === LOAD ||
                    this.currentToken.type === BLOCK ||
                    this.currentToken.type === SAVE)
                ){
                if(this.currentToken.type === CHUNK){
                    statementListNode.children.push(this.sectionDeclaration());
                }
                else{
                    statementListNode.children.push(this.statement());
                }
            }
            return statementListNode;
        }

        importInstrument(){
            let token = this.currentToken;
            this.eat(LOAD);
            let instrumentName = this.currentToken.value;
            this.eat(ID);
            this.eat(AS);
            let localVarName = this.currentToken.value;
            this.eat(ID);
            return new LoadAST(token, instrumentName, localVarName);
        }

        statement(){
            if(this.currentToken.type === PLAY){
                return this.play();
            }
            else if(this.currentToken.type === REST){
                return this.rest();
            }
            else if(this.currentToken.type === RUN){
                return this.procedureCall();
            }
            else if(this.currentToken.type === BLOCK){
                return this.blockLoop();
            }
            else if(this.currentToken.type === SAVE){
                //variable assignment
                return this.save();
            }
            else if(this.currentToken.type === LOAD){
                //variable assignment
                return this.importInstrument();
            }
            else{
                this.error();
            }
            
        }

        save(){
            this.eat(SAVE);
            let varToken = this.currentToken;
            let varNode = new IdAST(varToken);
            this.eat(ID);
            let assignToken = this.currentToken;
            this.eat(ASSIGN);
            if(this.currentToken.type === NOTE){
                let node = this.expr();
                return new AssignAST(assignToken, varNode, node);
            }
            else if(this.currentToken.type === FOR){
                this.for();
                let beat = this.beat();
                return new AssignAST(assignToken, varNode, beat);
            }
            else if(this.currentToken.type === ID){
                let idNode = new IdAST(this.currentToken);
                this.eat(ID);
                return new AssignAST(assignToken, varNode, idNode);
            }
        }

        note(){
            const note = this.currentToken;
            this.eat(NOTE);
            return new NoteAST(note, null);
        }

        noteList(){
            const notes = [];
            let node = this.note();
            let root = node;
            while(this.currentToken && this.currentToken.type === SEP){
                let sepToken = this.sep();
                let temp = this.note();
                node.child = temp;
                node = temp;
            }
            return root;
        }

        sep(){
            const sep = this.currentToken;
            this.eat(SEP);
        }

        for(){
            const op = this.currentToken;
            this.eat(FOR);
            return op;
        }

        id(){
            let idToken = this.currentToken;
            this.eat(ID);
            return idToken;
        }

        beat(){
            const beat = this.currentToken;
            this.eat(BEAT);
            return new BeatAST(beat);
        }

        expr(){
            if(this.currentToken.type === NOTE){
                const noteRoot = this.noteList();
                let op = this.for();
                const beat = this.beat(); 
                let forNode = new ForAST(op, noteRoot, beat) 
                return forNode;
            }
            else if(this.currentToken.type === ID){
                let varToken= this.id();
                return new IdAST(varToken);
            }
            else if(this.currentToken.type === FOR){
                let forToken = this.currentToken;
                this.for();
                let beat = this.beat();
                //let forNode = new ForAST(forToken, beat, null);
                return beat; 
            }
        }
    }

    const ARTYPES = {PROGRAM: "PROGRAM", PROCEDURE: "PROCEDURE"}
    class HandelActivationRecord {
        constructor(name, type, nestingLevel){
            this.name = name;
            this.type = type;
            this.nestingLevel = nestingLevel;
            this.members = {};
        }

        setItem(key, value){
            this.members[key] = value;
        }

        getItem(key){
            return this.members[key]; 
        }

        get(key){
            return this.members[key]; 
        }
    }


    class HandelCallStack {
        constructor(){
            this.records = [];
        }

        push(val){
            this.records.push(val);
        }
        pop(){
            this.records.pop();
        }

        peek(){
            if(this.records.length <= 0){
                return null;
            }
            return this.records[this.records.length - 1];
        }
    }

    class HandelInterpreterAST {
        constructor(parser, config, midi){
            this.parser = parser;
            this.beatToValue = {
                1: '4n',
                2: '2n',
                3: '2n.',
                4: '1m'
            }
            this.currentComposition;
            this.config = config;
            this.midi = midi;
            this.callStack = new HandelCallStack();
        }

        exportMidi(){
            let a = document.createElement("a");
            let file = new Blob([this.midi.toArray()], {type: 'audio/midi'});
            a.href = URL.createObjectURL(file);
            a.download = "my-midi.mid"
            a.click();
            URL.revokeObjectURL(a.href);
        }

        visitProgram(node){
            Tone.Transport.cancel(0);
            Tone.Transport.bpm.value = 1000 
            let ar = new HandelActivationRecord('program', ARTYPES.PROGRAM, 1);
            this.currentComposition = new Composition(Tone.AMSynth, 140, 
                {trackName: 'global', midi: this.midi});
            this.currentComposition.enclosingComposition = null;
            this.callStack.push(ar);
            this.visitStatementList(node.child);
            this.callStack.pop();
            Tone.Transport.stop();
            if(this.config && this.config.outputMidi){
                this.exportMidi();
            }
            else{
                Tone.Transport.start(Tone.now() + 0.1);
            }
        }

        visitSectionDeclaration(node){
        }

        visitProcedureCall(node){
            let procSymbol = node.procSymbol;
            let ar = new HandelActivationRecord(node.value, ARTYPES.PROCEDURE, procSymbol.scopeLevel + 1);

            let prevCompositon = this.currentComposition;
            this.currentComposition = new Composition(Tone.AMSynth, 140, {trackName: node.value, midi: this.midi});
            this.currentComposition.enclosingComposition =  prevCompositon;

            let formalParams = procSymbol.params;
            let actualParams = node.actualParams;
            for(let i = 0; i < formalParams.length; i++){
                let actualValue;
                if(actualParams[i].token.type === FOR){
                    actualValue = this.visitFor(actualParams[i]);
                }
                else if(actualParams[i].token.type === BEAT){
                    actualValue = this.visitBeat(actualParams[i]);
                }
                else if(actualParams[i].token.type === ID){
                    actualValue = this.visitId(actualParams[i]);
                }
                ar.setItem(formalParams[i].name, actualValue);
            }

            for(let customization of node.customizationList){
                if(customization.token.type === BPM){
                    this.visitBPM(customization);
                }
                else if(customization.token.type === SOUND){
                    this.visitSound(customization);
                }
                else if(customization.token.type === LOOP){
                    this.visitLoop(customization);
                }
            }

            this.callStack.push(ar);;

            //execute body
            this.visitStatementList(procSymbol.statementList);

            this.callStack.pop(ar);
            this.currentComposition = this.currentComposition.enclosingComposition;
        }

        visitBPM(node){
            let bpm = node.bpm;
            this.currentComposition.bpm = bpm;
            return
        }

        visitSound(node){
            let instrument = node.instrument;
            if(instrument === 'kick'){
                let kick = new Kick().synth;
                this.currentComposition.synth = kick;
            }
            else if(instrument === 'snare'){
                let snare = new Snare().synth;
                this.currentComposition.synth = snare;
            }
            else if(instrument === 'hihat'){
                let hihat = new HiHat().synth;
                this.currentComposition.synth = hihat;
            }
            else if(instrument === 'casio'){
                let casio = new Casio().synth;
                this.currentComposition.synth = casio;
            }
            else if(instrument === 'synth'){
                let synth = new FMSynth().synth;
                this.currentComposition.synth = synth;
            }
            else if(instrument === 'piano'){
                let piano = new Piano().synth;
                this.currentComposition.synth = piano;
            }
            else if(instrument === 'guitar'){
                let piano = new Guitar().synth;
                this.currentComposition.synth = piano;
            }
            else {
                let synth = this.callStack.peek().getItem(instrument);
                this.currentComposition.synth = synth;
            }
        }

        visitLoop(node){
            let loopTimes = node.loopTimes;
            this.currentComposition.loopTimes = loopTimes;
            return;
        }

        visitStatementList(node){
            for(let child of node.children){
                if(child.token.type === PLAY){
                    this.visitPlay(child);
                }
                else if(child.token.type === REST){
                    this.visitRest(child);
                }
                else if(child.token.type === ID){
                    if(child.token.category){
                        this.visitProcedureCall(child);
                    }
                    else{
                        this.visitSectionDeclaration(child);
                    }
                }
                else if(child.token.type === ASSIGN){
                    this.visitSave(child);
                }
                else if(child.token.type === BLOCK){
                    this.visitBlockLoop(child);
                }
                else if(child.token.type === LOAD){
                    this.visitLoad(child);
                }
                else {
                    this.error();
                }
            }
            this.currentComposition.play();
        }

        visitLoad(node){
            if(node.instrumentName in this.config.instruments){
                this.callStack.peek().setItem(node.localVarName, 
                    this.config.instruments[node.instrumentName]);
            }
            else {
                throw Error(`invalid instrument at line: ${node.token.lineno}`);
            }
        }

        visitBlockLoop(node){
            for(let i = 0; i < node.loopTimes; i++){
                this.visitStatementList(node.statementList);
            }
        }

        visitPlay(node){
            if(node.child.token.type === FOR){
                let forNode = node.child;
                this.currentComposition.configurePart([this.visitFor(forNode, node.rep)]);
            }
            else if(node.child.token.type === ID){
                this.currentComposition.configurePart([this.visitId(node.child, node.rep)]);
            }
        }

        visitRest(node){
            let child = node.child;
            let events;
            if(child.token.type === FOR){
                this.visitFor(child);
                events = [this.visitFor(child)];
            }
            else if(child.token.type === ID){
                events = [new PlayEvent(null, "", this.visitId(child))];
            }
            else{
                this.error();
            }

            this.currentComposition.configurePart(events);
        }

        visitSave(node){
            let varNode = node.left;
            let valueNode = node.right;
            let value;
            if(valueNode.token.type === ID){
                value = this.visitId(valueNode);
            }
            else if(valueNode.token.type === BEAT){
                value = this.visitBeat(valueNode);
            }
            else if(valueNode.token.type === FOR){
                value = this.visitFor(valueNode);
            }
            this.callStack.peek().setItem(varNode.value, value);
        }

        visitId(node){
            return this.callStack.peek().get(node.value);
        }

        visitFor(node, rep){
            let value = rep ? rep.value : 1

            if(node.right){
                return new PlayEvent(this.visitNoteList(node.left), this.beatToValue[node.right.value], node.right.value, value);
            }
            else{
                return new PlayEvent(null, this.beatToValue[node.left.value], node.left.value, value);
            }
        }

        visitNoteList(node){
            let notes = [];
            while(node != null){
                notes.push(node.value)
                node = node.child;
            }
            return notes;
        }

        visitNote(node){
            return node.value;
        }

        visitBeat(node){
            return node.value;
        }
    }


    class SymbolTableBuilder {
        constructor(){
            this.currentScope;
        }

        visitProgram(node){
            this.currentScope = new HandelSymbolTable('global', 1, null);

            //subtree
            this.visitStatementList(node.child);

            this.currentScope = this.currentScope.enclosingScope;
        }

        visitSectionDeclaration(node){
            let procName = node.value;
            let procSymbol = new ProcedureSymbol(procName);
            this.currentScope.define(procSymbol);

            this.currentScope = new HandelSymbolTable(procName, 
                this.currentScope.scopeLevel + 1, this.currentScope);
            
            if(node.parameterList){
                for(let param of node.parameterList.children){
                    let paramType = this.currentScope.lookup('ANY');
                    let paramName = param.value;
                    let varSymbol = new VarSymbol(paramName, paramType);
                    this.currentScope.define(varSymbol);
                    procSymbol.params.push(varSymbol);
                }
            }

            //save pointer to statement list contained in the procedure
            procSymbol.statementList = node.statementList;

            this.visitStatementList(node.statementList);

            this.currentScope = this.currentScope.enclosingScope;
        }

        visitBPM(node){
        }

        visitLoop(node){
        }

        visitSound(node){
        }

        visitProcedureCall(node){
            let procSymbol = this.currentScope.lookup(node.value)
            if(!procSymbol){
                throw Error(`invalid chunk name at line: ${node.token.lineno}`);
            }
            let formalParams = procSymbol.params
            if(node.actualParams.length != formalParams.length){
                throw Error(`invalid arguments at line: ${node.token.lineno}`);
            }

            node.procSymbol = procSymbol;

            for(let customization of node.customizationList){
                if(customization.token.type === BPM){
                    this.visitBPM(customization);
                }
                else if(customization.token.type === SOUND){
                    this.visitSound(customization);
                }
                else if(customization.token.type === LOOP){
                    this.visitLoop(customization);
                }
            }
        }

        visitStatementList(node){
            for(let child of node.children){
                if(child.token.type === PLAY){
                    this.visitPlay(child);
                }
                else if(child.token.type === REST){
                    this.visitRest(child);
                }
                else if(child.token.type === ID){
                    if(child.token.category){
                        this.visitProcedureCall(child);
                    }
                    else{
                        this.visitSectionDeclaration(child);
                    }
                }
                else if(child.token.type === ASSIGN){
                    this.visitSave(child);
                }
                else if(child.token.type === BLOCK){
                    this.visitBlockLoop(child);
                }
                else if(child.token.type === LOAD){
                    this.visitLoad(child);
                }
            }
        }

        visitLoad(node){
            let anyType = this.currentScope.lookup('ANY');
            let localVarName = node.localVarName;
            let varSymbol = new VarSymbol(localVarName, anyType);
            this.currentScope.define(varSymbol);
        }

        visitBlockLoop(node){
        }

        visitPlay(node){
            if(node.child.token.type === FOR){
                let forNode = node.child;
                this.visitFor(forNode)
            }
            else if(node.child.token.type === ID){
                this.visitId(node.child)
            }
            
            if(node.rep){
                this.visitRep(node.rep);
            }
        }

        visitRep(node){
        }

        visitRest(node){
            let child = node.child;
            if(child.token.type === FOR){
                this.visitFor(child);
            }
            else if(child.token.type === ID){
                this.visitId(child);
            }
            else{
                this.error();
            }
        }

        visitSave(node){
            let varNode = node.left;
            let varName = varNode.token.value;
            let valueNode = node.right;
            if(this.currentScope.lookup(varName, true)){
                throw Error(`Name error in line ${varNode.token.lineno}: ${varName} already exists`);
            }
            let varSymbol;
            if(valueNode.token.type === ID){
                this.visitId(valueNode);
                let symbol = this.currentScope.lookup(valueNode.value, true);
                if(!symbol){
                    throw Error(`Name error in line ${valueNode.token.lineno}: ${valueNode.value} does not exist`);
                }
                let type = symbol.type;
                varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup(type.name));
            }
            else if(valueNode.token.type === BEAT){
                this.visitBeat(valueNode);
                varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('BEAT'));
            }
            else if(valueNode.token.type === FOR){
                this.visitFor(valueNode);
                varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('PLAYABLE'));
            }
            this.currentScope.define(varSymbol);
        }

        visitId(node){
            let varName = node.value;
            if(!this.currentScope.lookup(varName, false)){
                throw Error(`Name error in line ${node.token.lineno}: ${varName} does not exist`);
            }
        }

        visitFor(node){
            let right = node.right;
            let left = node.left;
            if(left.token.type === NOTE){
                this.visitNoteList(left);
            }
            else if(left.token.type === BEAT){
                this.visitBeat(left);
            }
        }

        visitNoteList(node){
            while(node != null){
                node = node.child;
            }
        }

        visitNote(node){
        }

        visitBeat(node){
        }
    }
    return ({
        Interpreter: HandelInterpreterAST,
        Lexer: HandelLexer,
        Parser: HandelParser,
        SymbolTableBuilder: SymbolTableBuilder,
    })
})();

export function RunHandel(code, config){
    Tone.start().then(() => {
        const lexer = new Handel.Lexer(code);
        const parser = new Handel.Parser(lexer);

        //(handle midi config in interpreter)
        let midi;
        if(config && config.outputMidi){ midi = new Midi()}
        const interpreter = new Handel.Interpreter(parser, config, midi);

        const symTableBuilder = new Handel.SymbolTableBuilder();
        const programNode = parser.program();
        symTableBuilder.visitProgram(programNode);
        interpreter.visitProgram(programNode);
    });
}

export function StopHandel(){
    Tone.Transport.stop();
}

export function MakeInstrument(urls){
    let sampler = new Tone.Sampler({
        urls: urls
    }).toDestination()
    return sampler
}

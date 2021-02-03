import * as Tone from 'tone';
import { Midi } from '@tonejs/midi'

import pianoA4 from './Sounds/Piano_A4.wav'
import pianoC5 from './Sounds/Piano_C5.wav'
import kickC from './Sounds/Kick_C.wav'
import guitarD from './Sounds/Guitar_D_extended.wav'
import hihatG from './Sounds/HiHat_G.wav'
import snareD from './Sounds/Snare_D2.wav'
import { ToneWithContext } from 'tone/build/esm/core/context/ToneWithContext';
import { theWindow } from 'tone/build/esm/core/context/AudioContext';

let waiter;

export const Handel = (function () {
    console.log("%c Handel v0.7.16", "background: crimson; color: #fff; padding: 2px;");
    class FMSynth {
        constructor() {
            this.synth = new Tone.PolySynth({
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
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    D2: snareD,
                },
                //baseUrl: baseUrl,
                onload: () => {
                    increment();
                }
            }).toDestination();
            this.synth.volume.value = -3;
        }
    }
    class Piano {
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    C5: pianoC5,
                    A4: pianoA4,
                },
                //baseUrl: baseUrl,
                onload: () => {
                    increment();
                }
            }).toDestination();
        }
    }

    class Guitar {
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    D3: guitarD,
                },
                onload: () => {
                    increment();
                }
                //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class Kick {
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    C1: kickC,
                },
                onload: () => {
                    increment();
                }
                //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class HiHat {
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    G3: hihatG,
                },
                onload: () => {
                    increment();
                }
                //baseUrl: baseUrl,
            }).toDestination();
        }
    }

    class Casio {
        constructor(increment) {
            this.synth = new Tone.Sampler({
                urls: {
                    A1: "A1.mp3",
                    A2: "A2.mp3",
                },
                onload: () => {
                    increment();
                },
                baseUrl: "https://tonejs.github.io/audio/casio/",
            }).toDestination();
        }
    }

    class Composition {
        constructor(synth, bpm, midiOption) {
            this.synth = new Tone.PolySynth({ voice: synth });
            this.bpm = bpm;
            this.playEvents = [];
            this.currentTime = 0;
            this.midiTime = 0;
            this.startTime = 0;
            this.loopTimes = 1;
            this.volume;
            this.pan;
            this.reverb;
            // Create Part
            this.part = new Tone.Part((time, value) => {
                this.synth.triggerAttackRelease(value.notes, value.length, Tone.Time(time));
            });
            //each composition also represents a midi track
            if (midiOption.midi) {
                this.midi = midiOption.midi;
                this.track = midiOption.midi.addTrack();
                this.track.name = midiOption.trackName;
                this.notes = [];
            }
        }

        secondsFromBPM(beats) {
            return beats / (Tone.Transport.bpm.value / 60);
        }

        holdFor(beats) {
            let convertedBeats = beats * (Tone.Transport.bpm.value / this.bpm)
            return convertedBeats / (Tone.Transport.bpm.value / 60);
        }

        configurePart(playEvents) {
            for (let playEvent of playEvents) {
                this.playEvents.push(playEvent);
                let length = this.secondsFromBPM(playEvent.numBeats);
                let holdFor = this.holdFor(playEvent.numBeats);
                for (let i = 0; i < playEvent.rep; i++) {
                    if (playEvent.notes) {
                        this.part.add({ notes: playEvent.notes, time: this.currentTime, length: holdFor });
                        this.addNotesToTrack(playEvent.notes, this.midiTime, holdFor, length)
                    }
                    this.currentTime += length;
                    this.midiTime += holdFor;
                }
            }
        }

        addNotesToTrack(notes, time, holdFor, length) {
            if (!this.midi) { return }
            for (let note of notes) {
                this.track.addNote({
                    name: note,
                    time: time,
                    duration: holdFor
                });
            }
        }

        configureMidiLoop(times) {
            if (!this.midi) { return }
            for (let i = 1; i < times; i++) {
                for (let playEvent of this.playEvents) {
                    let holdFor = this.holdFor(playEvent.numBeats);
                    for (let i = 0; i < playEvent.rep; i++) {
                        if (playEvent.notes) {
                            this.addNotesToTrack(playEvent.notes, this.midiTime, holdFor, length)
                        }
                        this.midiTime += holdFor;
                    }
                }
            }
        }

        configureLoop(times) {
            this.part.loopStart = Tone.Time(this.startTime);
            this.part.loopEnd = Tone.Time(this.currentTime);
            this.part.loop = times;
        }

        play() {
            this.part.playbackRate = this.bpm / Tone.Transport.bpm.value
            this.configureLoop(this.loopTimes);
            this.configureMidiLoop(this.loopTimes);
            if (!isNaN(this.volume)) {
                this.synth.volume.value = this.volume;
            }
            else {
                this.synth.volume.value = 0;
            }

            const verbVal = !isNaN(this.reverb) ? this.reverb : 0.001;
            const reverb = new Tone.Reverb(verbVal);
            if (!isNaN(this.pan)) {
                const panner = new Tone.Panner(this.pan).toDestination();
                this.synth.chain(panner, reverb, Tone.Destination);
            }
            else {
                const panner = new Tone.Panner(0).toDestination();
                this.synth.chain(panner, reverb, Tone.Destination);
            }
            this.part.start(0.1);
        }

    }

    class PlayEvent {
        constructor(notes, length, numBeats, rep = 1) {
            this.length = length;
            this.notes = notes;
            this.numBeats = numBeats;
            this.rep = rep
        }
    }

    // Token types
    const [NOTE, BPM, SOUND,
        VOLUME, PAN, REVERB, LOOP, BLOCK, ENDBLOCK, INSTRUMENT, CHOOSE, FROM,
        BEAT, RANDINT, DIGIT, FOR, SEP, CHUNK,
        ENDCHUNK, ID, START, FINISH, SAVE, EVAL, UPDATE, SHIFT, DOT, PLAY,
        REST, WITH, RUN, TO, WHILE, MUL, DIV, MOD, PLUS, MINUS, LPAREN, RPAREN,
        IF, THEN, ELSE, ENDIF, LESS, GREAT, EQUAL, BOOLEAN, LOAD, AS, ASSIGN, USING, EOF] = [
            "NOTE", "BPM", "SOUND", "VOLUME", "PAN", "REVERB", "LOOP", "BLOCK", "ENDBLOCK",
            "INSTRUMENT", "CHOOSE", "FROM",
            "BEAT", "RANDINT", "DIGIT", "FOR", "SEP", "CHUNK",
            "ENDCHUNK", "ID", "START", "FINISH", "SAVE", "EVAL", "UPDATE", "SHIFT", "DOT", "PLAY",
            "REST", "WITH", "RUN", "TO","WHILE", "MUL", "DIV", "MOD", "PLUS", "MINUS", "LPAREN", "RPAREN",
            "IF", "THEN", "ELSE", "ENDIF", "LESS", "GREAT", "EQUAL",
            "BOOLEAN", "LOAD", "AS", "ASSIGN", "USING", "EOF"];


    class Token {
        constructor(type, value, lineno) {
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
        update: new Token(UPDATE, 'update'),
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
        volume: new Token(VOLUME, 'VOLUME'),
        pan: new Token(PAN, 'PAN'),
        reverb: new Token(REVERB, 'REVERB'),
        load: new Token(LOAD, 'LOAD'),
        as: new Token(AS, 'AS'),
        lshift: new Token(SHIFT, "lshift"),
        rshift: new Token(SHIFT, "rshift"),
        if: new Token(IF, "if"),
        then: new Token(THEN, "then"),
        else: new Token(ELSE, "else"),
        endif: new Token(ENDIF, "endif"),
        lessthan: new Token(LESS, "lessthan"),
        greaterthan: new Token(GREAT, "greaterthan"),
        equalto: new Token(EQUAL, "equalto"),
        randint: new Token(RANDINT, "randint"),
        to: new Token(TO, "to"),
        while: new Token(WHILE, "while"),
        eval: new Token(EVAL, "eval"),
        choose: new Token(CHOOSE, "choose"),
        from: new Token(FROM, "from"),
    }

    class HandelSymbol {
        constructor(name, type = null) {
            this.name = name;
            this.type = type;
        }
    }

    class BuiltInTypeSymbol extends HandelSymbol {
        constructor(name) {
            super(name);
        }
    }

    class VarSymbol extends HandelSymbol {
        constructor(name, type) {
            super(name, type)
        }
    }

    class ProcedureSymbol extends HandelSymbol {
        constructor(name, type, params = null) {
            super(name);
            this.params = [];
            this.statementList = null;
        }
    }

    class HandelSymbolTable {
        constructor(scopeName, scopeLevel, enclosingScope = null) {
            this.symbols = {};
            this.scopeName = scopeName;
            this.scopeLevel = scopeLevel;
            this.enclosingScope = enclosingScope;
            this.initbuiltins();
        }
        initbuiltins() {
            let duration = new BuiltInTypeSymbol('BEAT');
            let playable = new BuiltInTypeSymbol('PLAYABLE');
            let digit = new BuiltInTypeSymbol('DIGIT');
            let notelist = new BuiltInTypeSymbol('NOTELIST');
            let any = new BuiltInTypeSymbol('ANY');
            this.define(duration);
            this.define(playable);
            this.define(any);
            this.define(digit);
            this.define(notelist);
        }
        define(symbol) {
            symbol.scopeLevel = this.scopeLevel;
            this.symbols[symbol.name] = symbol;
        }
        lookup(name, currentScopeOnly = false) {
            let symbol = this.symbols[name];
            if (symbol) {
                return symbol;
            }

            if (currentScopeOnly) {
                return null;
            }

            if (this.enclosingScope) {
                return this.enclosingScope.lookup(name);
            }
        }

        error(varName) {
            throw Error(`Symbol ${varName} not found`)
        }
    }


    class HandelLexer {
        constructor(text) {
            this.text = text;
            this.pos = 0;
            this.currentChar = this.text[this.pos];
            this.lineno = 1;
            this.possibleChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            this.possibleNums = ['0', '1', '2', '3', '4', '5', '6', '7'];
        }

        error() {
            throw new Error("error analyzing input at line: " + this.lineno + "; invalid character: " + this.currentChar);
        }

        peek() {
            if (this.pos >= this.text.length - 1) {
                return null;
            }
            else {
                return this.text[this.pos + 1];
            }
        }

        advance() {
            this.pos += 1;
            if (this.pos >= this.text.length) {
                this.currentChar = null;
            }
            else {
                this.currentChar = this.text[this.pos];
            }
        }

        isSpace(ch) {
            if (ch === '\n') {
                this.lineno += 1;
            }
            return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
        }

        isAlpha(ch) {
            let regex = /^[a-zA-Z]{1}$/
            return regex.test(ch);
        }

        skipWhitespace() {
            while (this.currentChar !== null && this.isSpace(this.currentChar)) {
                this.advance();
            }
        }

        id() {
            let result = "";
            while (this.currentChar && this.isAlpha(this.currentChar)) {
                result += this.currentChar;
                this.advance();
            }

            if (result !== "") {
                if (result in RESERVED_KEYWORDS) {
                    let token = RESERVED_KEYWORDS[result];
                    token.lineno = this.lineno
                    return token;
                    //return RESERVED_KEYWORDS[result];
                }
                return new Token(ID, result, this.lineno);
            }
        }

        getNextToken() {
            // Lexical analyzer
            try {
                this.skipWhitespace();

                if (this.pos >= this.text.length) {
                    return new Token(EOF, null, this.lineno);
                }

                if (this.possibleChars.includes(this.currentChar)) {
                    let note = this.currentChar;
                    this.advance();
                    if (this.possibleNums.includes(this.currentChar)) {
                        note += this.currentChar;
                        this.advance();
                        return new Token(NOTE, note, this.lineno);
                    }
                    else if (this.currentChar === 'b' || this.currentChar === "#") {
                        note += this.currentChar;
                        this.advance();
                        if (this.possibleNums.includes(this.currentChar)) {
                            note += this.currentChar;
                            this.advance();
                            return new Token(NOTE, note, this.lineno);
                        }
                    }
                    else {
                        this.error();
                    }
                }

                if (this.currentChar === ',') {
                    this.advance();
                    return new Token(SEP, 'sep', this.lineno);
                }

                if (this.currentChar === '.') {
                    this.advance();
                    return new Token(DOT, 'dot', this.lineno);
                }

                if (this.currentChar === '=') {
                    this.advance();
                    return new Token(ASSIGN, 'assign', this.lineno);
                }
                
                if (this.currentChar === '+') {
                    this.advance();
                    return new Token(PLUS, '+', this.lineno);
                }

                if (this.currentChar === '*') {
                    this.advance();
                    return new Token(MUL, '*', this.lineno);
                }

                if (this.currentChar === '/') {
                    this.advance();
                    return new Token(DIV, '/', this.lineno);
                }
                
                if (this.currentChar === '%') {
                    this.advance();
                    return new Token(MOD, '/', this.lineno);
                }
                
                if (this.currentChar === '(') {
                    this.advance();
                    return new Token(LPAREN, '(', this.lineno);
                }
                
                if (this.currentChar === ')') {
                    this.advance();
                    return new Token(RPAREN, ')', this.lineno);
                }

                let idResult = this.id();
                if (idResult) {
                    return idResult;
                }

                const value = this.currentChar;
                const parsed = Number.parseInt(value);
                if (!Number.isNaN(parsed) || this.currentChar == '-') {
                    if(value === '-'){
                        this.advance();
                        let current = Number.parseInt(this.currentChar);
                        if(Number.isNaN(current)){
                            return new Token(MINUS, '-', this.lineno);
                        }
                    }
                    else{
                        this.advance();
                    }
                    let digit = value;
                    let current = Number.parseInt(this.currentChar);
                    while (!Number.isNaN(current)) {
                        digit += this.currentChar;
                        this.advance();
                        current = Number.parseInt(this.currentChar);
                    }
                    if (this.currentChar === 'b') {
                        this.advance();
                        return new Token(BEAT, digit, this.lineno);
                    }
                    return new Token(DIGIT, Number.parseInt(digit), this.lineno);
                }

                this.error();
            }
            catch(ex){
                throw ex;
            }
        }
    }

    class AST {
        constructor() {
            this.token = token;
            this.child = child;
        }
    }
    class BeatAST {
        constructor(token) {
            this.token = token;
            this.value = token.value;
        }
    }

    class LoadAST {
        constructor(token, instrumentName, localVarName) {
            this.token = token;
            this.instrumentName = instrumentName;
            this.localVarName = localVarName;
        }
    }

    class PlayAST {
        constructor(token, child = null, rep = null) {
            this.token = token;
            this.value = token.value;
            this.child = child;
            this.rep = rep;
        }
    }

    class AssignAST {
        constructor(token, left, right) {
            this.token = token;
            this.value = token.value;
            this.left = left;
            this.right = right;
        }
    }

    class UpdateAST {
        constructor(token, left, right, isShift) {
            this.token = token;
            this.value = token.value;
            this.left = left;
            this.right = right;
            this.varNode = left;
            this.exprNode = right;
            this.isShift = isShift;
        }
    }

    class DigitAST {
        constructor(token){
            this.token = token;
            this.value = token.value;
        }
    }

    class ShiftAST {
        constructor(token, shiftNode) {
            this.token = token;
            this.value = token.value;
            this.shiftNode = shiftNode;
        }
    }

    class StatementAST {
        constructor(token, child) {
            this.token = token;
            this.value = token.value;
            this.child = child;
        }
    }

    class StatementListAST {
        constructor() {
            this.children = [];
        }
    }

    class ProgramAST {
        constructor(token, child) {
            this.token = token;
            this.value = token.value;
            this.child = child;
        }
    }

    class BlockLoopAST {
        constructor(token, statementList, loopTimes, whileCondition) {
            this.token = token;
            this.statementList = statementList;
            this.loopTimes = loopTimes;
            this.whileCondition = whileCondition;
        }
    }

    class ParameterListAST {
        constructor() {
            this.children = [];
        }
    }

    class ParameterAST {
        constructor(token, child) {
            this.token = token;
            this.value = token.value;
            this.child = child;
        }
    }

    class SectionDeclarationAST {
        constructor(token, parameterList, statementList) {
            this.token = token;
            this.value = this.token.value;
            this.parameterList = parameterList;
            this.statementList = statementList;
        }
    }

    class BPMAST {
        constructor(token, bpm) {
            this.token = token;
            this.value = bpm;
            this.bpm = bpm;
        }
    }

    class LoopAST {
        constructor(token, loopTimes) {
            this.token = token;
            this.value = loopTimes;
            this.loopTimes = loopTimes;
        }
    }

    class BinOpAST {
        constructor(token, left, right){
            this.token = token;
            this.op = token.value;
            this.left = left;
            this.right = right;
        }
    }

    class VolumeAST {
        constructor(token, percentage) {
            this.token = token;
            this.value = percentage;
            this.percentage = percentage;
        }
    }

    class PanAST {
        constructor(token, panAmt) {
            this.token = token;
            this.value = panAmt;
            this.panAmt = panAmt;
        }
    }

    class ReverbAST {
        constructor(token, reverbAmt) {
            this.token = token;
            this.value = reverbAmt;
            this.reverbAmt = reverbAmt;
        }
    }

    class RepAST {
        constructor(token, repTimes) {
            this.token = token;
            this.value = repTimes;
            this.repTimes = repTimes;
        }
    }

    class InstrumentAST {
        constructor(token, instrument) {
            this.token = token;
            this.value = instrument;
            this.instrument = instrument;
        }
    }

    class ProcedureCallAST {
        constructor(token, actualParams, customizationList) {
            this.token = token;
            this.value = this.token.value;
            this.actualParams = actualParams;
            this.customizationList = customizationList;
            this.procSymbol = null;
        }
    }


    class RestAST {
        constructor(token, child = null) {
            this.token = token;
            this.value = token.value;
            this.child = child;
        }
    }

    class NoteAST {
        constructor(token, child = null) {
            this.token = token;
            this.value = token.value;
            this.child = child;
        }
    }

    class BooleanAST {
        constructor(token){
            this.token = token;
            this.value = token.value;
        }
    }

    class ComparisonAST {
        constructor(token){
            this.token = token;
            this.value = token.value;
        }
    }

    class ConditionalStatementAST {
        constructor(token, condition, ifStatementList, elseStatementList){
            this.token = token;
            this.value = token.value;
            this.condition = condition;
            this.ifStatementList = ifStatementList;
            this.elseStatementList = elseStatementList;
        }
    }
    
    class ConditionAST {
        constructor(token, operator, left, right){
            this.token = token;
            this.operator = operator;
            this.left = left;
            this.right = right;
        }
    }

    class IdAST {
        constructor(token) {
            this.token = token;
            this.value = token.value;
        }
    }

    class ChooseAST {
        constructor(token, digitNode, notesNode){
            this.token = token;
            this.digitNode = digitNode;
            this.notesNode = notesNode;
        }
    }

    class RandAST {
        constructor(token, start, end){
            this.token = token;
            this.start = start;
            this.end = end;
        }
    }

    class ForAST {
        constructor(token, left, right) {
            this.token = token;
            this.left = left;
            this.right = right;
        }
    }

    class HandelParser {
        constructor(lexer) {
            this.lexer = lexer;
            this.currentToken = this.lexer.getNextToken();
        }

        error() {
            throw new Error(`error parsing input at line ${this.currentToken.lineno}`);
        }

        eat(type) {
            if (this.currentToken.type === type) {
                this.currentToken = this.lexer.getNextToken();
            }
            else {
                this.error();
            }
        }

        play() {
            let token = this.currentToken;
            this.eat(PLAY);
            let child = this.expr();
            let rep;
            if (this.currentToken.type === LOOP) {
                rep = this.rep();
            }
            return new PlayAST(token, child, rep);
        }

        rep() {
            let token = this.currentToken;
            this.eat(LOOP);
            this.eat(FOR);
            let digit = this.currentToken;
            this.eat(DIGIT);
            return new RepAST(token, digit.value);
        }

        rest() {
            let restToken = this.currentToken;
            this.eat(REST);
            let beat;
            if (this.currentToken.type === FOR) {
                let forToken = this.currentToken;
                this.for();
                beat = this.beat();
                let forNode = new ForAST(forToken, beat, null);
                return new RestAST(restToken, forNode);
            }
            else if (this.currentToken.type === ID) {
                let varToken = this.id();
                //beat = this.globalVariables[varName];
                let idNode = new IdAST(varToken);
                //if(!this.currentScope.lookup(varName)){ this.currentScope.error(varName) }
                return new RestAST(restToken, idNode);
            }
            else {
                this.error();
            }
        }

        chunk() {
            this.eat(CHUNK);
        }

        endchunk() {
            this.eat(ENDCHUNK);
        }

        using() {
            this.eat(USING);
        }

        program() {
            let startToken = this.currentToken;
            this.eat(START);
            let statementList;
            if (this.currentToken &&
                (this.currentToken.type === CHUNK ||
                    this.currentToken.type === PLAY ||
                    this.currentToken.type === REST ||
                    this.currentToken.type === RUN ||
                    this.currentToken.type === LOAD ||
                    this.currentToken.type === BLOCK ||
                    this.currentToken.type === UPDATE ||
                    this.currentToken.type === IF ||
                    this.currentToken.type === SAVE)) {
                try {
                    statementList = this.statementList();
                }
                catch (e) {
                    throw e;
                }
            }
            else {
                this.error();
            }
            let programNode = new ProgramAST(startToken, statementList);
            this.eat(FINISH);
            return programNode;
        }

        digitExpression(){
            try{
                if(this.currentToken.type === EVAL){
                    this.eat(EVAL);
                }
                let node = this.term();
                while(this.currentToken.type === PLUS || this.currentToken.type === MINUS){
                    let token = this.currentToken;
                    if(token.type === PLUS){
                        this.eat(PLUS);
                    }
                    else if(token.type === MINUS){
                        this.eat(MINUS);
                    }
                    node = new BinOpAST(token, node, this.term());
                }
                return node;
            }
            catch(ex){
                throw ex;
            }
        }

        chooseExpression(){
            try {
                let token = this.currentToken;
                this.eat(CHOOSE);
                let digitNode = this.digitExpression();
                this.eat(FROM);
                let notesNode;
                if(this.currentToken.type === ID){
                    notesNode = new IdAST(this.id());
                }
                else if(this.currentToken.type === NOTE){
                    notesNode = this.noteList();
                }
                return new ChooseAST(token, digitNode, notesNode);
            }
            catch(ex){
                throw ex;
            }
        }

        term(){
            try{
                let node = this.factor();
                while(this.currentToken.type === MUL || this.currentToken.type === DIV || this.currentToken.type === MOD){
                    let token = this.currentToken;
                    if(token.type === MUL){
                        this.eat(MUL);
                    }
                    else if(token.type === DIV){
                        this.eat(DIV);
                    }
                    else if(token.type === MOD){
                        this.eat(MOD);
                    }
                    node = new BinOpAST(token, node, this.factor());
                }
                return node;
            }
            catch(ex){
                throw ex;
            }
        }

        factor(){
            try {
                if(this.currentToken.type === DIGIT){
                    return this.digit();
                }
                else if(this.currentToken.type === ID){
                    return new IdAST(this.id());
                }
                else if(this.currentToken.type === LPAREN){
                    this.eat(LPAREN);
                    let node = this.digitExpression();
                    this.eat(RPAREN);
                    return node;
                }
                else {
                    this.error();
                }
            }
            catch(ex){
                throw ex;
            }
        }

        sectionDeclaration() {
            this.chunk();
            let proc;
            try {
                proc = this.id();
            }
            catch (ex) {
                throw ex;
            }
            let parameterList;
            let statementListNode;
            if (this.currentToken.type === USING) {
                try {
                    this.using();
                    parameterList = this.parameterList();
                }
                catch (ex) {
                    throw ex;
                }
            }
            try {
                statementListNode = this.statementList();
            } catch (ex) {
                throw ex;

            }
            let sectionNode = new SectionDeclarationAST(proc, parameterList, statementListNode);
            //sectionNode.statementList = statementListNode;
            this.endchunk();
            return sectionNode;
        }

        parameterList() {
            try {
                let parameterListNode = new ParameterListAST();
                let paramToken = this.id();
                let parameter = new ParameterAST(paramToken);
                parameterListNode.children.push(parameter);
                while (this.currentToken.type && this.currentToken.type === SEP) {
                    this.sep();
                    let paramToken = this.id();
                    let parameter = new ParameterAST(paramToken);
                    parameterListNode.children.push(parameter);
                }
                return parameterListNode;
            }
            catch (ex) {
                throw ex;
            }
        }

        argumentList() {
            try {
                let actualParams = [];
                actualParams.push(this.expr());
                while (this.currentToken && this.currentToken.type === SEP) {
                    this.sep();
                    actualParams.push(this.expr());
                }
                return actualParams;
            }
            catch (ex) {
                throw ex;
            }
        }

        customization() {
            try {
                if (this.currentToken.type === BPM) {
                    let bpmToken = this.currentToken;
                    this.eat(BPM);
                    let digit = this.digitRepresenter();
                    return new BPMAST(bpmToken, digit);
                }
                else if (this.currentToken.type === SOUND) {
                    let soundToken = this.currentToken;
                    this.eat(SOUND);
                    let instrument = this.currentToken.value;
                    if (this.currentToken.type === INSTRUMENT) {
                        this.eat(INSTRUMENT);
                    }
                    else {
                        this.eat(ID);
                    }
                    return new InstrumentAST(soundToken, instrument);
                }
                else if (this.currentToken.type === LOOP) {
                    let loopToken = this.currentToken;
                    this.eat(LOOP);
                    this.eat(FOR);
                    let digit = this.digitRepresenter();
                    return new LoopAST(loopToken, digit);
                }
                else if (this.currentToken.type === VOLUME) {
                    let volumeToken = this.currentToken;
                    this.eat(VOLUME);
                    let digit = this.digitRepresenter();
                    return new VolumeAST(volumeToken, digit);
                }
                else if (this.currentToken.type === PAN) {
                    let panToken = this.currentToken;
                    this.eat(PAN);
                    let digit = this.digitRepresenter();
                    return new PanAST(panToken, digit);
                }
                else if (this.currentToken.type === REVERB) {
                    let reverbToken = this.currentToken;
                    this.eat(REVERB);
                    let digit = this.digitRepresenter();
                    return new ReverbAST(reverbToken, digit);
                }
                else {
                    this.error();
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        digitRepresenter(){
            let digit;
            if(this.currentToken.type === DIGIT){
                digit = this.digit();    
            }
            else if(this.currentToken.type === ID){
                digit = new IdAST(this.id());
            }
            else if(this.currentToken.type === EVAL){
                digit = this.digitExpression();
            }
            else if(this.currentToken.type === RANDINT){
                digit = this.randint();
            }
            return digit;
        }

        customizationList() {
            try {
                let customizations = [];
                customizations.push(this.customization());
                while (this.currentToken && this.currentToken.type === SEP) {
                    this.eat(SEP);
                    customizations.push(this.customization());
                }
                return customizations;
            }
            catch (ex) {
                throw ex;
            }
        }

        boolean(){
            try{
                if(this.currentToken.type === TRUE || this.currentToken.type === FALSE){
                    return new BooleanAST(this.currentToken);
                }
                else {
                    this.error();
                }
            }
            catch(ex){
                throw ex;
            }
        }

        comparison_operator(){
            try{
                let token = this.currentToken;
                if(this.currentToken.type === LESS){
                    this.eat(LESS);
                }
                else if(this.currentToken.type === GREAT){
                    this.eat(GREAT);
                }
                else if(this.currentToken.type === EQUAL){
                    this.eat(EQUAL);
                }
                return new ComparisonAST(token);
            }
            catch(ex){
                throw ex;
            }
        }

        condition(){
            try{
                let left;
                let right;

                if(this.currentToken.type === EVAL || this.currentToken.type === DIGIT){
                    left = this.digitExpression();
                }
                else if(this.currentToken.type === RANDINT){
                    left = this.randint();
                }
                else if(this.currentToken.type === CHOOSE){
                    left = this.chooseExpression();
                }
                else {
                    left = this.expr();
                }

                let token = this.currentToken;
                let op = this.comparison_operator();

                if(this.currentToken.type === EVAL || this.currentToken.type === DIGIT){
                    right = this.digitExpression();
                }
                else if(this.currentToken.type === RANDINT){
                    right = this.randint();
                }
                else if(this.currentToken.type === CHOOSE){
                    right = this.chooseExpression();
                }
                else {
                    right = this.expr();
                }
                return new ConditionAST(token, op, left, right);
            }
            catch(ex){
                throw ex;
            }
        }

        conditional_statement(){
            try {
                let token = this.currentToken;
                this.eat(IF);
                let condition = this.condition();
                this.eat(THEN);
                let ifStatementList = this.statementList();
                let elseStatementList; 
                if(this.currentToken.type === ELSE){
                    this.eat(ELSE);
                    elseStatementList = this.statementList();
                }
                this.eat(ENDIF);
                return new ConditionalStatementAST(token, condition, ifStatementList, elseStatementList);
            }
            catch(ex){
                throw ex;
            }
        }

        blockLoop() {
            try {
                let blockToken = this.currentToken;
                this.eat(BLOCK);
                let statementList = this.statementList();
                this.eat(ENDBLOCK);
                this.eat(LOOP);
                let token;
                let condition;
                let node;
                if(this.currentToken.type === FOR){
                    this.eat(FOR);
                    token = this.currentToken;
                    if(this.currentToken.type === DIGIT || this.currentToken.type === EVAL){
                        node = this.digitExpression();
                    }
                    else if(this.currentToken.type === ID){
                        node = new IdAST(token);
                    }
                }
                else if(this.currentToken.type === WHILE){
                    this.eat(WHILE);
                    condition = this.condition();
                }
                return new BlockLoopAST(blockToken, statementList, node, condition);
            }
            catch (ex) {
                throw ex;
            }
        }

        procedureCall() {
            try {
                this.eat(RUN);
                let procedureToken = this.currentToken;
                procedureToken.category = "PROCEDURECALL";
                this.eat(ID);
                let actualParams = [];
                if (this.currentToken.type === USING) {
                    this.eat(USING);
                    if (this.currentToken.type === FOR || this.currentToken.type === NOTE || this.currentToken.type === ID) {
                        actualParams = this.argumentList();
                    }
                }
                let customizationList = [];
                if (this.currentToken.type === WITH) {
                    this.eat(WITH);
                    customizationList = this.customizationList();
                }
                return new ProcedureCallAST(procedureToken, actualParams, customizationList);
            }
            catch (ex) {
                throw ex;
            }
        }

        statementList() {
            try {
                let statementListNode = new StatementListAST();
                while (this.currentToken &&
                    (this.currentToken.type === CHUNK ||
                        this.currentToken.type === PLAY ||
                        this.currentToken.type === REST ||
                        this.currentToken.type === RUN ||
                        this.currentToken.type === LOAD ||
                        this.currentToken.type === BLOCK ||
                        this.currentToken.type === UPDATE ||
                        this.currentToken.type === IF ||
                        this.currentToken.type === SAVE)
                ) {
                    if (this.currentToken.type === CHUNK) {
                        statementListNode.children.push(this.sectionDeclaration());
                    }
                    else {
                        statementListNode.children.push(this.statement());
                    }
                }
                return statementListNode;
            }
            catch (ex) {
                throw ex;
            }
        }

        importInstrument() {
            try {
                let token = this.currentToken;
                this.eat(LOAD);
                let instrumentName = this.currentToken.value;
                this.eat(ID);
                this.eat(AS);
                let localVarName = this.currentToken.value;
                this.eat(ID);
                return new LoadAST(token, instrumentName, localVarName);
            }
            catch (ex) {
                throw ex;
            }
        }

        statement() {
            try {
                if (this.currentToken.type === PLAY) {
                    return this.play();
                }
                else if (this.currentToken.type === REST) {
                    return this.rest();
                }
                else if (this.currentToken.type === RUN) {
                    return this.procedureCall();
                }
                else if (this.currentToken.type === BLOCK) {
                    return this.blockLoop();
                }
                else if (this.currentToken.type === SAVE) {
                    //variable assignment
                    return this.save();
                }
                else if (this.currentToken.type === UPDATE) {
                    //variable reassignment
                    return this.update();
                }
                else if (this.currentToken.type === LOAD) {
                    return this.importInstrument();
                }
                else if (this.currentToken.type === IF) {
                    return this.conditional_statement();
                }
                else {
                    this.error();
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        randint(){
            try {
                let token = this.currentToken;
                this.eat(RANDINT);
                let start;
                let end;

                if(this.currentToken.type === EVAL || this.currentToken.type === DIGIT){
                    start = this.digitExpression();
                }
                else if(this.currentToken.type === RANDINT){
                    start = this.randint();
                }
                else {
                    start = this.expr();
                }
                

                this.eat(TO);

                if(this.currentToken.type === EVAL || this.currentToken.type === DIGIT){
                    end = this.digitExpression();
                }
                else if(this.currentToken.type === EVAL){
                    end = this.digitExpression();
                }
                else if(this.currentToken.type === RANDINT){
                    end = this.randint();
                }
                else {
                    end= this.expr();
                }
                return new RandAST(token, start, end);
            }
            catch(ex){
                throw ex;
            }
        }

        save() {
            try {
                this.eat(SAVE);
                let varToken = this.currentToken;
                let varNode = new IdAST(varToken);
                this.eat(ID);
                let assignToken = this.currentToken;
                this.eat(ASSIGN);
                if (this.currentToken.type === NOTE || this.currentToken.type === ID) {
                    let node = this.expr();
                    return new AssignAST(assignToken, varNode, node);
                }
                else if (this.currentToken.type === FOR) {
                    this.for();
                    let beat = this.beat();
                    return new AssignAST(assignToken, varNode, beat);
                }
                else if(this.currentToken.type === RANDINT){
                    let node = this.randint();
                    return new AssignAST(assignToken, varNode, node);
                }
                else if(this.currentToken.type === DIGIT || this.currentToken.type === EVAL){
                    let node = this.digitExpression();
                    return new AssignAST(assignToken, varNode, node);
                }
                else if(this.currentToken.type === CHOOSE){
                    let node = this.chooseExpression();
                    return new AssignAST(assignToken, varNode, node);
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        digit(){
            try {
                let token = this.currentToken;
                this.eat(DIGIT);
                return new DigitAST(token);
            }
            catch (ex){
                throw ex;
            }
        }

        update() {
            try {
                let updateToken = this.currentToken;
                this.eat(UPDATE);
                let varNode = new IdAST(this.currentToken);
                this.eat(ID);
                if (this.currentToken.type === ASSIGN) {
                    this.eat(ASSIGN);
                    let exprNode; 
                    if(this.currentToken.type === NOTE || this.currentToken.type === FOR 
                        || this.currentToken.type === BEAT ){
                            exprNode = this.expr();
                    }
                    else {
                        exprNode = this.digitExpression();
                    }
                    return new UpdateAST(updateToken, varNode, exprNode, false);
                }
                else if (this.currentToken.type === SHIFT) {
                    let shiftNode = this.shift();
                    return new UpdateAST(updateToken, varNode, shiftNode, true);
                }
                else {
                    this.error();
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        shift() {
            try {
                let shiftToken = this.currentToken;
                this.eat(SHIFT);
                let token = this.currentToken;
                let node;

                if(token.type === ID){
                    node = new IdAST(this.id());
                }
                else if(token.type === RANDINT){
                    node = this.randint();
                }
                else if(token.type === DIGIT || token.type === EVAL){
                    node = this.digitExpression();
                }
                else {
                    this.error();
                }
                return new ShiftAST(shiftToken, node);
            }
            catch (ex) {
                throw ex;
            }
        }

        note() {
            try {
                const note = this.currentToken;
                this.eat(NOTE);
                return new NoteAST(note, null);
            }
            catch (ex) {
                throw ex;
            }
        }

        noteList() {
            try {
                const notes = [];
                let node = this.note();
                let root = node;
                while (this.currentToken && this.currentToken.type === SEP) {
                    let sepToken = this.sep();
                    let temp = this.note();
                    node.child = temp;
                    node = temp;
                }
                return root;
            }
            catch (ex) {
                throw ex;
            }
        }

        sep() {
            try {
                const sep = this.currentToken;
                this.eat(SEP);
            }
            catch (ex) {
                throw ex;
            }
        }

        for() {
            try {
                const op = this.currentToken;
                this.eat(FOR);
                return op;
            }
            catch (ex) {
                throw ex;
            }
        }

        id() {
            try {
                let idToken = this.currentToken;
                this.eat(ID);
                return idToken;
            }
            catch (ex) {
                throw ex;
            }
        }

        beat() {
            try {
                const beat = this.currentToken;
                this.eat(BEAT);
                return new BeatAST(beat);
            }
            catch (ex) {
                throw ex;
            }
        }

        expr() {
            try {
                if (this.currentToken.type === NOTE || this.currentToken.type === CHOOSE) {
                    let noteRoot;
                    if(this.currentToken.type === NOTE){
                        noteRoot = this.noteList();
                    }
                    else {
                        noteRoot = this.chooseExpression();
                    }

                    if (this.currentToken.type === FOR) {
                        let op = this.for();
                        let beat;
                        if(this.currentToken.type === BEAT){
                            beat = this.beat();
                        }
                        else if(this.currentToken.type == ID){
                            beat = new IdAST(this.currentToken);
                            this.eat(ID);
                        }
                        let forNode = new ForAST(op, noteRoot, beat)
                        return forNode;
                    }
                    else {
                        return noteRoot;
                    }
                }
                else if (this.currentToken.type === ID) {
                    let varToken = this.id();
                    if (this.currentToken.type === FOR) {
                        let op = this.for();
                        let leftNode = new IdAST(varToken);
                        let rightNode;
                        if (this.currentToken.type === BEAT) {
                            rightNode = this.beat();
                        }
                        else if (this.currentToken.type === ID) {
                            const leftVarToken = this.id();
                            rightNode = new IdAST(leftVarToken);
                        }
                        let forNode = new ForAST(op, leftNode, rightNode);
                        return forNode;
                    }
                    return new IdAST(varToken);
                }
                else if (this.currentToken.type === FOR) {
                    let forToken = this.currentToken;
                    this.for();
                    let beat = this.beat();
                    //let forNode = new ForAST(forToken, beat, null);
                    return beat;
                }
            } catch (ex) {
                throw ex;
            }
        }
    }

    const ARTYPES = { PROGRAM: "PROGRAM", PROCEDURE: "PROCEDURE", BLOCK: "BLOCK" }
    class HandelActivationRecord {
        constructor(name, type, nestingLevel) {
            this.name = name;
            this.type = type;
            this.nestingLevel = nestingLevel;
            this.members = {};
            this.enclosingRecord;
        }

        setItem(key, value) {
            this.members[key] = value;
        }

        getItem(key, currentRecordOnly = false) {
            if (this.members[key] !== null && this.members[key] !== undefined) {
                return this.members[key];
            }

            if (currentRecordOnly) {
                return this.members[key];
            }

            if (this.enclosingRecord) {
                return this.enclosingRecord.getItem(key, currentRecordOnly);
            }
        }

        get(key, currentRecordOnly = false) {
            return this.getItem(key, currentRecordOnly);
        }
    }


    class HandelCallStack {
        constructor() {
            this.records = [];
        }

        push(val) {
            this.records.push(val);
        }
        pop() {
            this.records.pop();
        }

        peek() {
            if (this.records.length <= 0) {
                return null;
            }
            return this.records[this.records.length - 1];
        }
    }

    class HandelInterpreter {
        constructor(parser, config, midi) {
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
            this.totalSamples = 0;
            this.samplesCount = 0;
            this.increment = this.increment.bind(this);
        }

        exportMidi() {
            let a = document.createElement("a");
            let file = new Blob([this.midi.toArray()], { type: 'audio/midi' });
            a.href = URL.createObjectURL(file);
            a.download = "my-midi.mid"
            a.click();
            URL.revokeObjectURL(a.href);
        }

        waitForSamples(){
            if(this.totalSamples === this.samplesCount){
                this.totalSamples = 0;
                this.samplesCount = 0;
                //Tone.Transport.stop(Tone.now());
                Tone.Transport.start("+0.1");
            }
            else {
                waiter = setTimeout(this.waitForSamples.bind(this), 300);
            }
        }

        increment(){
            this.samplesCount += 1;
        }

        visitProgram(node) {
            try {
                Tone.Transport.bpm.value = 1000
                let ar = new HandelActivationRecord('program', ARTYPES.PROGRAM, 1);
                ar.enclosingRecord = null;
                this.currentComposition = new Composition(Tone.AMSynth, 140,
                    { trackName: 'global', midi: this.midi });
                this.currentComposition.enclosingComposition = null;
                this.callStack.push(ar);
                this.visitStatementList(node.child);
                this.currentComposition.play();
                this.callStack.pop();
                //Tone.Transport.stop();
                if (this.config && this.config.outputMidi) {
                    this.exportMidi();
                }
                else {
                    if(waiter){
                        clearInterval(waiter);
                    }
                    this.waitForSamples();
                }
            }   
            catch(ex){
                throw ex;
            }
        }

        visitSectionDeclaration(node) {
        }

        visitProcedureCall(node) {
            let procSymbol = node.procSymbol;
            let ar = new HandelActivationRecord(node.value, ARTYPES.PROCEDURE, procSymbol.scopeLevel + 1);
            ar.enclosingRecord = this.callStack.peek();

            let prevCompositon = this.currentComposition;
            this.currentComposition = new Composition(Tone.AMSynth, 140, { trackName: node.value, midi: this.midi });
            this.currentComposition.enclosingComposition = prevCompositon;

            let formalParams = procSymbol.params;
            let actualParams = node.actualParams;
            for (let i = 0; i < formalParams.length; i++) {
                let actualValue;
                if (actualParams[i].token.type === FOR) {
                    actualValue = this.visitFor(actualParams[i]);
                }
                else if (actualParams[i].token.type === BEAT) {
                    actualValue = this.visitBeat(actualParams[i]);
                }
                else if (actualParams[i].token.type === ID) {
                    actualValue = this.visitId(actualParams[i]);
                }
                else if (actualParams[i].token.type === NOTE) {
                    actualValue = this.visitNoteList(actualParams[i]);
                }
                ar.setItem(formalParams[i].name, actualValue);
            }

            for (let customization of node.customizationList) {
                if (customization.token.type === BPM) {
                    this.visitBPM(customization);
                }
                else if (customization.token.type === SOUND) {
                    this.visitSound(customization);
                }
                else if (customization.token.type === LOOP) {
                    this.visitLoop(customization);
                }
                else if (customization.token.type === VOLUME) {
                    this.visitVolume(customization);
                }
                else if (customization.token.type === PAN) {
                    this.visitPan(customization);
                }
                else if (customization.token.type === REVERB) {
                    this.visitReverb(customization);
                }
            }

            this.callStack.push(ar);;

            //execute body
            this.visitStatementList(procSymbol.statementList);
            this.currentComposition.play();

            this.callStack.pop(ar);
            this.currentComposition = this.currentComposition.enclosingComposition;
        }

        mapHelper(val, ogStart, ogEnd, newStart, newEnd) {
            if(newStart > newEnd){
                let temp = newStart;
                newStart = newEnd;
                newEnd = temp;
            }
            let ratio = val / (Math.abs(ogStart) + Math.abs(ogEnd));
            let output = newStart + ((Math.abs(newEnd - newStart)) * ratio);
            return output;
        }

        visitChoose(node){
            let amt = this.visitBinOp(node.digitNode);
            let notesNode = node.notesNode;
            let notelist;
            if(notesNode.token.type === ID){
                notelist = this.visitId(notesNode);
            }
            else{
                notelist = this.visitNoteList(notesNode);
            }
            let output = [];
            let copy = notelist.slice();
            while(amt > 0 && copy.length > 0){
                let i = Math.floor(Math.random() * copy.length);
                output.push(copy[i]);
                copy.splice(i, 1);
                amt -= 1;
            }
            return output;
        }

        visitReverb(node) {
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }
            if (value < 1) {
                return
            }
            let reverb = value / 1000;
            this.currentComposition.reverb = reverb;
        }

        visitPan(node) {
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }

            if (value > 100 || value < 0) {
                return
            }
            let pan = this.mapHelper(value, 0, 100, -1, 1);
            this.currentComposition.pan = pan;
        }

        visitVolume(node) {
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }

            if (value > 100 || value < 0) {
                return
            }
            let vol = this.mapHelper(value, 0, 100, -70, 70);
            this.currentComposition.volume = vol;
        }

        visitBPM(node) {
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }
            this.currentComposition.bpm = value;
            return
        }

        visitSound(node) {
            let instrument = node.instrument;
            if (instrument === 'kick') {
                let kick = new Kick(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = kick;
            }
            else if (instrument === 'snare') {
                let snare = new Snare(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = snare;
            }
            else if (instrument === 'hihat') {
                let hihat = new HiHat(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = hihat;
            }
            else if (instrument === 'casio') {
                let casio = new Casio(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = casio;
            }
            else if (instrument === 'synth') {
                let synth = new FMSynth().synth;
                this.currentComposition.synth = synth;
            }
            else if (instrument === 'piano') {
                let piano = new Piano(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = piano;
            }
            else if (instrument === 'guitar') {
                let piano = new Guitar(this.increment).synth;
                this.totalSamples += 1;
                this.currentComposition.synth = piano;
            }
            else {
                let synth = this.callStack.peek().getItem(instrument);
                //this.totalSamples += 1;
                this.currentComposition.synth = synth;
            }
        }

        visitBoolean(node){
            return node.value;
        }

        visitComparisonOperator(node){
            return node.value;
        }

        visitCondition(node){
            try{
                let leftValue;
                let rightValue;
                if(node.left.token.type === ID){
                    leftValue = this.visitId(node.left);
                }
                else if (node.left.token.type === BEAT) {
                    leftValue = this.visitBeat(node.left);
                }
                else if (node.left.token.type === FOR) {
                    leftValue = this.visitFor(node.left);
                }
                else if (node.left.token.type === NOTE) {
                    leftValue = this.visitNoteList(node.left);
                }
                else if (node.left.token.type === DIGIT) {
                    leftValue = this.visitDigit(node.left);
                }
                else if (node.left.token.type === RANDINT) {
                    leftValue = this.visitRandint(node.left);
                }
                else if (node.left.token.type === CHOOSE) {
                    leftValue = this.visitChoose(node.left);
                }
                else {
                    leftValue = this.visitBinOp(node.left);
                }

                if(node.right.token.type === ID){
                    rightValue = this.visitId(node.right);
                }
                else if (node.right.token.type === BEAT) {
                    rightValue = this.visitBeat(node.right);
                }
                else if (node.right.token.type === FOR) {
                    rightValue = this.visitFor(node.right);
                }
                else if (node.right.token.type === NOTE) {
                    rightValue = this.visitNoteList(node.right);
                }
                else if (node.right.token.type === DIGIT) {
                    rightValue = this.visitDigit(node.right);
                }
                else if (node.right.token.type === RANDINT) {
                    rightValue = this.visitRandint(node.right);
                }
                else if (node.right.token.type === RANDINT) {
                    rightValue = this.visitChoose(node.right);
                }
                else {
                    rightValue = this.visitBinOp(node.right);
                }

                let operation = this.visitComparisonOperator(node.operator); 

                if(typeof leftValue != typeof rightValue){
                    throw Error(`Type error in condition statement at line: ${node.token.lineno}`);
                }

                if(Array.isArray(leftValue)){
                    return this.compareNoteLists(operation, leftValue, rightValue);
                }
                else if(typeof leftValue == "number"){
                    return this.compareDigits(operation, leftValue, rightValue);
                }
                else if(typeof leftValue == "string"){
                    return this.compareDigits(operation, parseInt(leftValue), parseInt(rightValue));
                }
                else if(leftValue instanceof PlayEvent){
                    return this.comparePlayevents(operation, leftValue, rightValue);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        compareNoteLists(op, notelist1, notelist2){
            if(op === "equalto"){
                if(notelist1.length !== notelist2.length){
                    return false;
                }
                let eq = true;
                for(let i = 0; i < notelist1.length; i++){
                    if(!notelist2.includes(notelist1[i])){
                        eq = false;
                    };
                }
                return eq;
            }
            else {
                let leftsum = 0;
                let rightsum = 0;
                for(let i = 0; i < notelist1.length; i++){
                    leftsum += Tone.Frequency(notelist1[i]).toFrequency();
                }
                for(let i = 0; i < notelist2.length; i++){
                    rightsum += Tone.Frequency(notelist2[i]).toFrequency();
                }
                if(op === "greaterthan"){
                    return leftsum > rightsum
                }
                else if(op === "lessthan"){
                    return leftsum < rightsum;
                }
            }
        }
        comparePlayevents(op, event1, event2){
            if(event1.notes && event2.notes){
                return this.compareNoteLists(op, event1.notes, event2.notes);
            }
            else {
                this.compareDigits(op, event1.numBeats, event2.numBeats);
            }
        }
        compareDigits(op, val1, val2){
            if(op === "equalto"){
                return val1 === val2;
            }
            else if(op === "greaterthan"){
                return val1 > val2;
            }
            else if(op === "lessthan"){
                return val1 < val2;
            }
        }

        visitConditionalStatement(node){
            try {
                let decision = this.visitCondition(node.condition);
                if(decision){
                    this.visitStatementList(node.ifStatementList);
                }
                else if(node.elseStatementList){
                    this.visitStatementList(node.elseStatementList);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitLoop(node) {
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }
            if(value < 1){
                return;
            }

            this.currentComposition.loopTimes = value;
            return;
        }

        visitStatementList(node) {
            try{
                for (let child of node.children) {
                    if (child.token.type === PLAY) {
                        this.visitPlay(child);
                    }
                    else if (child.token.type === REST) {
                        this.visitRest(child);
                    }
                    else if (child.token.type === ID) {
                        if (child.token.category) {
                            this.visitProcedureCall(child);
                        }
                        else {
                            this.visitSectionDeclaration(child);
                        }
                    }
                    else if (child.token.type === ASSIGN) {
                        this.visitSave(child);
                    }
                    else if (child.token.type === UPDATE) {
                        this.visitUpdate(child);
                    }
                    else if (child.token.type === BLOCK) {
                        this.visitBlockLoop(child);
                    }
                    else if (child.token.type === IF) {
                        this.visitConditionalStatement(child);
                    }
                    else if (child.token.type === LOAD) {
                            this.visitLoad(child);
                    }
                }
            }
            catch(ex){throw ex;}
        }

        visitLoad(node) {
            try {
                if (node.instrumentName in this.config.instruments) {
                    this.callStack.peek().setItem(node.localVarName,
                        this.config.instruments[node.instrumentName]);
                }
                else {
                    throw Error(`invalid instrument at line: ${node.token.lineno}`);
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitBlockLoop(node) {
            try {
                let loopNode = node.loopTimes;
                let whileCondition = node.whileCondition;
                let value;
                if(loopNode){
                    if(loopNode.token.type === DIGIT){
                        value = this.visitDigit(loopNode);
                    }
                    else if(loopNode.token.type === ID){
                        value = this.visitId(loopNode);
                    }
                    else {
                        value = this.visitBinOp(loopNode);
                    }
                    for (let i = 0; i < value; i++) {
                        this.visitStatementList(node.statementList);
                    }
                }
                else if(whileCondition){
                    while(this.visitCondition(whileCondition)){
                        this.visitStatementList(node.statementList);
                    }
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitPlay(node) {
            if (node.child.token.type === FOR) {
                let forNode = node.child;
                this.currentComposition.configurePart([this.visitFor(forNode, node.rep)]);
            }
            else if (node.child.token.type === ID) {
                this.currentComposition.configurePart([this.visitId(node.child, node.rep)]);
            }
        }

        visitRest(node) {
            let child = node.child;
            let events;
            if (child.token.type === FOR) {
                this.visitFor(child);
                events = [this.visitFor(child)];
            }
            else if (child.token.type === ID) {
                events = [new PlayEvent(null, "", this.visitId(child))];
            }
            else {
                this.error();
            }

            this.currentComposition.configurePart(events);
        }

        error() {
        }


        visitBinOp(node){
            try {
                let op = node.token; 
                if(op.type === DIGIT){
                    return this.visitDigit(node);
                }
                else if(op.type === ID){
                    let value = this.visitId(node);
                    if(typeof value !== "number"){
                        throw Error(`Type error in eval expression in line: ${node.token.lineno}`);
                    }
                    return value;
                }
                else if(op.type === MUL){
                    return this.visitBinOp(node.left) * this.visitBinOp(node.right);
                }
                else if(op.type === DIV){
                    return Math.floor(this.visitBinOp(node.left) / this.visitBinOp(node.right));
                }
                else if(op.type === MOD){
                    return this.visitBinOp(node.left) % this.visitBinOp(node.right);
                }
                else if(op.type === PLUS){
                    return this.visitBinOp(node.left) + this.visitBinOp(node.right);
                }
                else if(op.type === MINUS){
                    return this.visitBinOp(node.left) - this.visitBinOp(node.right);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitSave(node) {
            try {
                let varNode = node.left;
                let valueNode = node.right;
                let value;
                if (valueNode.token.type === ID) {
                    value = this.visitId(valueNode);
                }
                else if (valueNode.token.type === BEAT) {
                    value = this.visitBeat(valueNode);
                }
                else if (valueNode.token.type === FOR) {
                    value = this.visitFor(valueNode);
                }
                else if (valueNode.token.type === NOTE) {
                    value = this.visitNoteList(valueNode);
                }
                else if (valueNode.token.type === DIGIT) {
                    value = this.visitDigit(valueNode);
                }
                else if (valueNode.token.type === RANDINT) {
                    value = this.visitRandint(valueNode);
                }
                else if (valueNode.token.type === CHOOSE) {
                    value = this.visitChoose(valueNode);
                }
                else {
                    value = this.visitBinOp(valueNode);
                }
                this.callStack.peek().setItem(varNode.value, value);
            }
            catch(ex){
                throw ex;
            }
        }

        visitDigit(node){
            return node.value;
        }

        visitRandint(node){
            try {
            let start = node.start;
            let end = node.end;
            let startval;
            let endval;
            if(start.token.type === ID){
                startval = this.visitId(start);
            }
            else if(start.token.type === RANDINT){
                startval = this.visitRandint(start);
            }
            else if((start.token.type === MUL
                || start.token.type === DIV || start.token.type === MOD
                || start.token.type === PLUS || start.token.type === MINUS
                || start.token.type === DIGIT
                )){
                startval = this.visitBinOp(start);
            }

            if(end.token.type === ID){
                endval = this.visitId(end);
            }
            else if(end.token.type === RANDINT){
                endval = this.visitRandint(end);
            }
            else if((end.token.type === MUL
                || end.token.type === DIV || end.token.type === MOD
                || end.token.type === PLUS || end.token.type === MINUS
                || end.token.type === DIGIT
                )){
                endval = this.visitBinOp(end);
            }
            
            if(typeof startval !== "number" || typeof endval !== "number"){
                throw Error(`Type error in randint expression in line: ${node.token.lineno}`);
            }
            let num = Math.floor(Math.random() * Math.floor(100));
            let output = Math.floor(this.mapHelper(num, 0, 100, startval, endval));
            return output;
            }
            catch(ex){
                throw ex;
            }
        }

        visitUpdate(node) {
            if (!node.isShift) {
                this.visitSave(node);
            }
            else {
                let varNode = node.left;
                let valueNode = node.right;
                let shiftSymbol = valueNode.symbol;
                let shiftAmt = this.visitShift(valueNode);
                let shiftTarget = this.callStack.peek().getItem(varNode.value);
                if(Array.isArray(shiftTarget)){
                    for (let i = 0; i < shiftTarget.length; i++) {
                        shiftTarget[i] = Tone.Frequency(shiftTarget[i]).transpose(shiftAmt);
                    }
                    this.callStack.peek().setItem(varNode.value, shiftTarget.slice());
                }
                else if(typeof shiftTarget == "number"){
                    this.callStack.peek().setItem(varNode.value, shiftTarget + shiftAmt);
                }
                else if(typeof shiftTarget == "string"){
                    this.callStack.peek().setItem(varNode.value, JSON.stringify(parseInt(shiftTarget) + shiftAmt));
                }
                else if(shiftTarget instanceof PlayEvent){
                    if(shiftTarget.notes){
                        let notes = shiftTarget.notes.slice();
                        for (let i = 0; i < notes.length; i++) {
                            notes[i] = Tone.Frequency(notes[i]).transpose(shiftAmt);
                        }
                        shiftTarget.notes = notes;
                    }
                    else {
                        shiftTarget.numBeats += shiftAmt;
                    }
                }
            }
        }
        visitShift(node) {
            let shiftAmount;
            let shiftNode = node.shiftNode;
            if(shiftNode.token.type === ID){
                shiftAmount = this.visitId(node.shiftNode);
                shiftAmount = parseInt(shiftAmount);
            }
            else if(shiftNode.token.type === RANDINT){
                shiftAmount = this.visitRandint(shiftNode);
            }
            else{
                shiftAmount = this.visitBinOp(shiftNode);
            }

            if (node.token.value === 'lshift') {
                return -1 * shiftAmount;
            }
            return shiftAmount;
        }

        visitId(node) {
            return this.callStack.peek().get(node.value);
        }

        visitFor(node, rep) {
            let value = rep ? rep.value : 1

            if (node.right) {
                let notelist;
                let duration = node.right.value;
                if (node.left.token.type === ID) {
                    notelist = this.visitId(node.left);
                }
                else if(node.left.token.type === CHOOSE){
                    notelist = this.visitChoose(node.left);
                }
                else{
                    notelist = this.visitNoteList(node.left);
                }
                if (node.right.token.type === ID) {
                    duration = this.visitId(node.right);
                }
                let nl = notelist.slice();
                return new PlayEvent(nl, this.beatToValue[duration], duration, value);
            }
            else {
                return new PlayEvent(null, this.beatToValue[node.left.value], node.left.value, value);
            }
        }

        visitNoteList(node) {
            let notes = [];
            while (node != null) {
                notes.push(node.value)
                node = node.child;
            }
            return notes;
        }

        visitNote(node) {
            return node.value;
        }

        visitBeat(node) {
            return node.value;
        }
    }


    class SymbolTableBuilder {
        constructor() {
            this.currentScope;
        }

        visitProgram(node) {
            try {
                this.currentScope = new HandelSymbolTable('global', 1, null);

                //subtree
                this.visitStatementList(node.child);

                this.currentScope = this.currentScope.enclosingScope;
            }
            catch (ex) {
                throw ex;
            }
        }

        visitBoolean(node){
        }

        visitComparisonOperator(node){
        }

        visitCondition(node){
            try{
                if(node.left && node.left.token.type === ID){
                    this.visitId(node.left);
                }
                else if(node.left && node.left.token.type === RANDINT){
                    this.visitRandint(node.left);
                }
                else if(node.left && node.left.token.type === CHOOSE){
                    this.visitChoose(node.left);
                }
                else if(node.left && (node.left.token.type === MUL
                    || node.left.token.type === DIV || node.left.token.type === MOD
                    || node.left.token.type === PLUS || node.left.token.type === MINUS
                    || node.left.token.type === DIGIT
                    )){
                    this.visitBinOp(node.left);
                }
                
                if(node.right && node.right.token.type === ID){
                    this.visitId(node.right);
                }
                else if(node.right && node.right.token.type === RANDINT){
                    this.visitRandint(node.right);
                }
                else if(node.right && node.right.token.type === CHOOSE){
                    this.visitChoose(node.right);
                }
                else if(node.right && (node.right.token.type === MUL
                    || node.right.token.type === DIV || node.right.token.type === MOD
                    || node.right.token.type === PLUS || node.right.token.type === MINUS
                    || node.right.token.type === DIGIT
                    )){
                    this.visitBinOp(node.right);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitConditionalStatement(node){
            try {
                this.visitCondition(node.condition);
                this.visitStatementList(node.ifStatementList);
                if(node.elseStatementList){
                    this.visitStatementList(node.elseStatementList);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitChoose(node){
            try{
                this.visitBinOp(node.digitNode);
                let notesNode = node.notesNode;
                if(notesNode.token.type === ID){
                    this.visitId(notesNode);
                    let varSymbol = this.currentScope.lookup(notesNode.token.value);
                    if(varSymbol.type.name !== "NOTELIST"){
                        throw Error(`Type error in the choose expression at line: ${notesNode.token.lineno}`);
                    }
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitSectionDeclaration(node) {
            try {
                let procName = node.value;
                let procSymbol = new ProcedureSymbol(procName);
                this.currentScope.define(procSymbol);

                this.currentScope = new HandelSymbolTable(procName,
                    this.currentScope.scopeLevel + 1, this.currentScope);

                if (node.parameterList) {
                    for (let param of node.parameterList.children) {
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
            catch (ex) {
                throw ex;
            }
        }

        genericDigitVisit(node){
            let child = node.value;
            let value;
            if(child.token.type === DIGIT){
                value = this.visitDigit(child);
            }
            else if (child.token.type === ID){
                value = this.visitId(child);
            }
            else if(child.token.type === RANDINT){
                value = this.visitRandint(child)
            }
            else if(child.token.type === MUL || child.token.type === DIV
                || child.token.type === PLUS || child.token.type === MINUS
                || child.token.type === MOD){
                value = this.visitBinOp(child)
            }
        }

        visitBPM(node) {
            this.genericDigitVisit(node);
        }

        visitLoop(node) {
            this.genericDigitVisit(node);
        }

        visitSound(node) {
        }

        visitVolume(node) {
            this.genericDigitVisit(node);
        }

        visitReverb(node) {
            this.genericDigitVisit(node);
        }

        visitPan(node) {
            this.genericDigitVisit(node);
        }

        visitDigit(node){
        }

        visitProcedureCall(node) {
            try {
                let procSymbol = this.currentScope.lookup(node.value)
                if (!procSymbol) {
                    throw Error(`invalid chunk name at line: ${node.token.lineno}`);
                }
                let formalParams = procSymbol.params
                if (node.actualParams.length != formalParams.length) {
                    throw Error(`invalid arguments at line: ${node.token.lineno}`);
                }

                node.procSymbol = procSymbol;

                for (let customization of node.customizationList) {
                    if (customization.token.type === BPM) {
                        this.visitBPM(customization);
                    }
                    else if (customization.token.type === SOUND) {
                        this.visitSound(customization);
                    }
                    else if (customization.token.type === LOOP) {
                        this.visitLoop(customization);
                    }
                    else if (customization.token.type === VOLUME) {
                        this.visitVolume(customization);
                    }
                    else if (customization.token.type === PAN) {
                        this.visitPan(customization);
                    }
                    else if (customization.token.type === REVERB) {
                        this.visitReverb(customization);
                    }
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitStatementList(node) {
            try {
                for (let child of node.children) {
                    if (child.token.type === PLAY) {
                        this.visitPlay(child);
                    }
                    else if (child.token.type === REST) {
                        this.visitRest(child);
                    }
                    else if (child.token.type === ID) {
                        if (child.token.category) {
                            this.visitProcedureCall(child);
                        }
                        else {
                            this.visitSectionDeclaration(child);
                        }
                    }
                    else if (child.token.type === ASSIGN) {
                        this.visitSave(child);
                    }
                    else if (child.token.type === UPDATE) {
                        this.visitUpdate(child);
                    }
                    else if (child.token.type === BLOCK) {
                        this.visitBlockLoop(child);
                    }
                    else if (child.token.type === LOAD) {
                        this.visitLoad(child);
                    }
                    else if (child.token.type === IF) {
                        this.visitConditionalStatement(child);
                    }
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitLoad(node) {
            let anyType = this.currentScope.lookup('ANY');
            let localVarName = node.localVarName;
            let varSymbol = new VarSymbol(localVarName, anyType);
            this.currentScope.define(varSymbol);
        }

        visitBlockLoop(node) {
            this.visitStatementList(node.statementList);
            if(node.whileCondition){
                this.visitCondition(node.whileCondition);
                return;
            }
            let loopNode = node.loopTimes;
            if(loopNode.token.type === ID){
                this.visitId(loopNode);
            }
            else if(this.isBinOp(loopNode.token)){
                this.visitBinOp(loopNode);
            }

        }

        isBinOp(token){
            if(token.type === MUL || token.type === DIV || token.type === PLUS || token.type === MINUS
                || token.type === MOD){
                    return true;
                }
            return false;
        }

        visitPlay(node) {
            try {
                if (node.child.token.type === FOR) {
                    let forNode = node.child;
                    this.visitFor(forNode)
                }
                else if (node.child.token.type === ID) {
                    this.visitId(node.child)
                }

                if (node.rep) {
                    this.visitRep(node.rep);
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitRep(node) {
        }

        visitRest(node) {
            try {
                let child = node.child;
                if (child.token.type === FOR) {
                    this.visitFor(child);
                }
                else if (child.token.type === ID) {
                    this.visitId(child);
                }
                else {
                    this.error();
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitSave(node) {
            try {
                let varNode = node.left;
                let varName = varNode.token.value;
                let valueNode = node.right;
                if (this.currentScope.lookup(varName, true)) {
                    throw Error(`Name error in line ${varNode.token.lineno}: ${varName} already exists`);
                }
                let varSymbol;
                if (valueNode.token.type === ID) {
                    this.visitId(valueNode);
                    let symbol = this.currentScope.lookup(valueNode.value, true);
                    if (!symbol) {
                        throw Error(`Name error in line ${valueNode.token.lineno}: ${valueNode.value} does not exist`);
                    }
                    let type = symbol.type;
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup(type.name));
                }
                else if (valueNode.token.type === BEAT) {
                    this.visitBeat(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('BEAT'));
                }
                else if (valueNode.token.type === FOR) {
                    this.visitFor(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('PLAYABLE'));
                }
                else if (valueNode.token.type === NOTE) {
                    this.visitNoteList(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('NOTELIST'));
                }
                else if (valueNode.token.type === DIGIT) {
                    this.visitDigit(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('DIGIT'));
                }
                else if (valueNode.token.type === RANDINT) {
                    this.visitRandint(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('DIGIT'));
                }
                else if (valueNode.token.type === CHOOSE) {
                    this.visitChoose(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('NOTELIST'));
                }
                else{
                    this.visitBinOp(valueNode);
                    varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('DIGIT'));
                }
                this.currentScope.define(varSymbol);
            }
            catch (ex) {
                throw ex;
            }
        }
        visitBinOp(node){
            let op = node.token; 
            if(op.type === DIGIT){
                this.visitDigit(node);
            }
            else if(op.type === ID){
                this.visitId(node);
            }
            if(node.left){
                this.visitBinOp(node.left);
            }
            if(node.right){
                this.visitBinOp(node.right);
            }
        }

        visitRandint(node){
            try {
                let start = node.start;
                let end = node.end;
                if(start.token.type === ID){
                    this.visitId(start);
                }
                else if(start.token.type === RANDINT){
                    this.visitRandint(start);
                }
                else if((start.token.type === MUL
                    || start.token.type === DIV || start.token.type === MOD
                    || start.token.type === PLUS || start.token.type === MINUS
                    )){
                    this.visitBinOp(start);
                }

                if(end.token.type === ID){
                    this.visitId(end);
                }
                else if(end.token.type === RANDINT){
                    this.visitRandint(end);
                }
                else if((end.token.type === MUL
                    || end.token.type === DIV || end.token.type === MOD
                    || end.token.type === PLUS || end.token.type === MINUS
                    )){
                    this.visitBinOp(end);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitShift(node) {
            try {
                let shiftNode = node.shiftNode;
                let shiftToken = shiftNode.token;
                if(shiftNode.token.type === ID){
                    let found = this.currentScope.lookup(shiftToken.value);
                    if(!found){
                        throw Error(`Name error in line ${shiftToken.lineno}: ${shiftToken.value} does not exist`);
                    }
                    if(found.type.name !== "DIGIT"){
                        throw Error(`Type error in line ${shiftToken.lineno}: ${shiftToken.value} is not of type DIGIT`);
                    }
                }
                else if(shiftNode.token.type === RANDINT){
                    this.visitRandint(node.shiftNode);
                }
                else if((shiftNode.token.type === MUL
                    || shiftNode.token.type === DIV || shiftNode.token.type === MOD
                    || shiftNode.token.type === PLUS || shiftNode.token.type === MINUS
                    )){
                    this.visitBinOp(shiftNode);
                }
            }
            catch(ex){
                throw ex;
            }
        }

        visitUpdate(node) {
            try {
                let varNode = node.left;
                let varName = varNode.token.value;
                let valueNode = node.right;

                if (node.isShift) {
                    this.visitShift(valueNode);
                    return;
                }

                if (!this.currentScope.lookup(varName)) {
                    throw Error(`Name error in line ${varNode.token.lineno}: ${varName} does not exist`);
                }
                if (valueNode.token.type === ID) {
                    this.visitId(valueNode);
                    let symbol = this.currentScope.lookup(valueNode.value);
                    if (!symbol) {
                        throw Error(`Name error in line ${valueNode.token.lineno}: ${valueNode.value} does not exist`);
                    }
                }
                else if (valueNode.token.type === BEAT) {
                    this.visitBeat(valueNode);
                }
                else if (valueNode.token.type === FOR) {
                    this.visitFor(valueNode);
                }
                else if (valueNode.token.type === NOTE) {
                    this.visitNoteList(valueNode);
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitId(node) {
            let varName = node.value;
            if (!this.currentScope.lookup(varName, false)) {
                throw Error(`Name error in line ${node.token.lineno}: ${varName} does not exist`);
            }
        }

        visitFor(node) {
            try {
                let right = node.right;
                let left = node.left;
                if (left.token.type === NOTE) {
                    this.visitNoteList(left);
                }
                else if (left && left.token.type === ID) {
                    this.visitId(left);
                }
                else if (left && left.token.type === BEAT) {
                    this.visitBeat(left);
                }
                else if(left && left.token.type === CHOOSE){
                    this.visitChoose(left);
                }
                if (right && right.token.type === ID) {
                    this.visitId(right);
                }
                else if (right && right.token.type === BEAT) {
                    this.visitBeat(right);
                }
            }
            catch (ex) {
                throw ex;
            }
        }

        visitNoteList(node) {
            while (node != null) {
                node = node.child;
            }
        }

        visitNote(node) {
        }

        visitBeat(node) {
        }
    }
    return ({
        Interpreter: HandelInterpreter,
        Lexer: HandelLexer,
        Parser: HandelParser,
        SymbolTableBuilder: SymbolTableBuilder,
    })
})();

export function RunHandel(code, config) {
    try {
        StopHandel();

        const lexer = new Handel.Lexer(code);
        const parser = new Handel.Parser(lexer);

        //(handle midi config in interpreter)
        let midi;
        if (config && config.outputMidi) { midi = new Midi() }
        const interpreter = new Handel.Interpreter(parser, config, midi);
        
        const symTableBuilder = new Handel.SymbolTableBuilder();
        const programNode = parser.program();
        symTableBuilder.visitProgram(programNode);
        interpreter.visitProgram(programNode);
    }
    catch (ex) {
        throw ex;
    }
}

export function StopHandel() {
    Tone.Transport.cancel(0);
    Tone.Transport.stop(Tone.now());
}

export function MakeInstrument(urls, increment) {
    let sampler = new Tone.Sampler({
        urls: urls,
        onload: () => {
            //increment();
        },
    }).toDestination()
    return sampler
}

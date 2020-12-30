// Token types
const [NOTE, BEAT, DIGIT, FOR, SEP, CHUNK, 
    ENDCHUNK, ID, START, FINISH, SAVE, DOT, PLAY,
     REST, WITH, RUN, ASSIGN, USING, EOF] = ["NOTE", "BEAT", "DIGIT", "FOR", "SEP", "CHUNK", 
    "ENDCHUNK", "ID", "START", "FINISH", "SAVE", "DOT", "PLAY", 
    "REST", "WITH", "RUN", "ASSIGN", "USING", "EOF"];


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
    with: new Token(WITH, 'with')
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
        //console.log("LOOKING FOR", name, "in", this.scopeName);
        if(symbol){
            //console.log("FOUND", name);
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
                return RESERVED_KEYWORDS[result];
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
                console.log("DIGIT is", Number.parseInt(digit));
                return new Token(DIGIT, Number.parseInt(digit), this.lineno);
            }
        }
        
        this.error();
    }
}

/*
class HandelInterpreter {
    constructor(lexer){
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
	    this.composition = new Composition(Tone.AMSynth, 140);
        this.beatToValue = {
            1: '4n',
            2: '2n',
            3: '2n.',
            4: '1m'
        }
        this.currentScope; 
        //this.globalVariables = {};
        this.callStack = new HandelCallStack();
    }

    error(lineno){
        throw new Error(`error parsing input at line ${lineno}`);
    }
    
    varNotFoundError(varName, lineno){
        throw new Error(`no variable ${lineno} exists`);
    }

    eat(type){
        if(this.currentToken.type === type){
            this.currentToken = this.lexer.getNextToken();
        }
        else{
            this.error(this.currentToken.lineno);
        }
    }

    finish(){
        this.eat(FINISH);
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
        this.eat(START);
        this.currentScope = new HandelSymbolTable('global', 1);
        let ar = new HandelActivationRecord("GLOBAL", ARTYPES.PROGRAM, 1);
        this.callStack.push(ar);
        console.log('Enter scope: global');
        while(this.currentToken && 
            (this.currentToken.type === CHUNK || 
            this.currentToken.type === PLAY ||
            this.currentToken.type === REST ||
            this.currentToken.type === RUN ||
            this.currentToken.type === SAVE)){
                if(this.currentToken.type === CHUNK){
                    this.section_declaration();
                }
                else{
                    this.statement();
                }
            }
        this.eat(FINISH);
        console.log(this.currentScope)
        console.log('Leaving scope: global');
        this.currentScope = this.currentScope.enclosingScope; 
        this.callStack.push(ar);
    }

    section_declaration(){
        this.chunk();
        let procName = this.id().value;
        let procSymbol = new ProcedureSymbol(procName);
        this.currentScope.define(procSymbol);
        console.log('Enter scope:', procName);

        //create symbol table
        let procScope = new HandelSymbolTable(procName, 
            this.currentScope.scopeLevel + 1,
             this.currentScope);
        this.currentScope = procScope;

        if(this.currentToken.type === USING){
           this.using(); 
           this.parameter_list(procSymbol);
        }
        this.statement_list();
        this.endchunk();
        console.log(this.currentScope)
        this.currentScope = this.currentScope.enclosingScope;
        console.log('Leave scope:', procName);
    }

    parameter_list(procSymbol){
        let paramToken = this.id();
        let paramName = paramToken.value;
        this.defineVarSymbol(paramName, 'PLAYABLE');
        procSymbol.params.push(paramToken.value);
        while(this.currentToken.type && this.currentToken.type === SEP){
            this.sep();
            let paramToken = this.id();
            let paramName = paramToken.value;
            this.defineVarSymbol(paramName, 'PLAYABLE');
            procSymbol.params.push(paramToken.value);
        }
    }

    statement_list(){
        //let playEvents = [];
        while(this.currentToken && 
                (this.currentToken.type === CHUNK || 
                this.currentToken.type === PLAY || 
                this.currentToken.type === REST ||
                this.currentToken.type === SAVE)
            ){
            //playEvents.push(this.expr());
            if(this.currentToken.type === CHUNK){
                this.section_declaration();
            }
            else{
                this.statement();
            }
        }
        //return playEvents;
    }

    play(){
        this.eat(PLAY);
        let events = [];
        events.push(this.expr());
        this.composition.configurePart(events);
        this.composition.play();
    }

    rest(){
        this.eat(REST);
        let beat;
        if(this.currentToken.type === FOR){
            this.for();
            beat = this.beat();
        }
        else if(this.currentToken.type === ID){
            let varName = this.id().value;
            beat = this.globalVariables[varName];
            if(!this.currentScope.lookup(varName)){ this.currentScope.error(varName) }
        }
        else{
            this.error();
        }
        let events = [new PlayEvent(null, this.beatToValue[beat.value])];
        this.composition.configurePart(events);
    }

    save(){
        this.eat(SAVE);
        let varName = this.currentToken.value;
        this.eat(ID);
        if(this.currentScope.lookup(varName, true)){
            throw Error(`${varName} is already defined`);
        }
        this.eat(ASSIGN);
        if(this.currentToken.type === NOTE){
            let value = this.expr();
            //this.globalVariables[varName] = value;
            let ar = this.callStack.peek();
            ar.setItem(varName, value); 
            this.defineVarSymbol(varName, 'PLAYABLE');
        }
        else if(this.currentToken.type === BEAT){
            let beat = this.beat();
            //this.globalVariables[varName] = beat;
            let ar = this.callStack.peek();
            ar.setItem(varName, value); 
            this.defineVarSymbol(varName, 'BEAT');
        }
    }

    defineVarSymbol(varName, typeName){
        let typeSymbol = this.currentScope.lookup(typeName);
        let symbol = new VarSymbol(varName, typeSymbol);
        console.log("DEFINE ", varName, "in", this.currentScope.scopeName)
        this.currentScope.define(symbol);
    }

    statement(){
        if(this.currentToken.type === PLAY){
            this.play();
        }
        else if(this.currentToken.type === REST){
            this.rest();
        }
        else if(this.currentToken.type === RUN){
            this.procedure_call();
        }
        else if(this.currentToken.type === SAVE){
            //variable assignment
            this.save();
        }
    }

    run(){
        this.eat(RUN);
    }

    argument_list(){
        //TODO
        let actualParams = []; 
        actualParams.push(this.expr());
        while(this.currentToken && this.currentToken.type === SEP){
            this.sep();
            actualParams.push(this.expr());
        }
        return actualParams;
    }

    procedure_call(){
        this.eat(RUN);
        let procedureName = this.currentToken.value;
        let procedureSymbol = this.currentScope.lookup(procedureName);
        this.eat(ID);
        this.eat(WITH);
        let actualParams = []; 
        if(this.currentToken.type === NOTE || this.currentToken.type === ID){
            actualParams = this.argument_list();
        }
        let formalParams = procedureSymbol.params;
        if(formalParams.length != actualParams.length){
            this.error(this.currentToken.lineno);
        }
        let ar = new HandelActivationRecord(procedureName, ARTYPES.PROCEDURE, 2);
        for(let i =0; i < formalParams.length; i++){
            ar.setItem(formalParams[i], actualParams[i]);
        }
        this.callStack.push(ar);

        //TODO: execute with body of procedure

        this.callStack.pop();
    }

    note(){
        const note = this.currentToken;
        this.eat(NOTE);
        return note.value;
    }

    note_list(){
        const notes = [];
        notes.push(this.note());
        while(this.currentToken && this.currentToken.type === SEP){
            this.sep();
            notes.push(this.note());
        }
        return notes;
    }

    sep(){
        const sep = this.currentToken;
        this.eat(SEP);
    }

    for(){
        const op = this.currentToken;
        this.eat(FOR);
    }

    beat(){
        const beat = this.currentToken;
        this.eat(BEAT);
        return beat;
    }

    id(){
        let idToken = this.currentToken;
        this.eat(ID);
        return idToken;
    }

    expr(){
        if(this.currentToken.type === NOTE){
            const notes = this.note_list();
            this.for();
            const beat = this.beat(); 
            return new PlayEvent(notes, this.beatToValue[beat.value]);
        }
        else{
            let varName = this.id().value;
            console.log("VARIABLE NAME", varName)
            let symbol = this.currentScope.lookup(varName);
            if(!symbol){
                console.log(symbol);
                this.currentScope.error(varName)
            }
            let ar = this.callStack.peek();
            if(ar.get(varName)){
                return ar.get(varName);
            }
            else{
                this.error(this.currentToken.lineno);
            }
        }
    }
}
*/
// Token types
const [NOTE, BEAT, FOR, SEP, CHUNK, 
    ENDCHUNK, ID, START, FINISH, SAVE, DOT, PLAY, REST, ASSIGN, USING, EOF] = ["NOTE", "BEAT", "FOR", "SEP", "CHUNK", 
    "ENDCHUNK", "ID", "START", "FINISH", "SAVE", "DOT", "PLAY", "REST", "ASSIGN", "USING", "EOF"];


class Token {
    constructor(type, value){
        this.type = type;
        this.value = value;
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
    finish: new Token(FINISH, 'finish')
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
        this.define(beat);
        this.define(note);
    }
    define(symbol){
        this.symbols[symbol.name] = symbol;
    }

    lookup(name){
        let symbol = this.symbols[name];
        console.log("LOOKING FOR", name, "in", this.scopeName);
        if(symbol){
            console.log("FOUND", name);
            return symbol;
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
        this.possibleChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        this.possibleNums= ['0', '1', '2', '3', '4', '5', '6', '7'];
    }

    error(){
        throw new Error("error analyzing input");
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
            return new Token(ID, result);
        }
    }

    getNextToken(){
        // Lexical analyzer
        this.skipWhitespace();

        if(this.pos >= this.text.length){
            return new Token(EOF, null)
        }
        
        if(this.possibleChars.includes(this.currentChar)){
            let note = this.currentChar;
            this.advance();
            if(this.possibleNums.includes(this.currentChar)){
                note += this.currentChar;
                this.advance();
                return new Token(NOTE, note);
            }
            else if(this.currentChar === 'b' || this.currentChar === "#"){
                note += this.currentChar;
                this.advance();
                if(this.possibleNums.includes(this.currentChar)){
                    note += this.currentChar;
                    this.advance();
                    return new Token(NOTE, note);
                }
            }
            else{
                this.error();
            }
        }

        if(this.currentChar === ','){
            this.advance();
            return new Token(SEP, 'sep');
        }

        if(this.currentChar === '.'){
            this.advance();
            return new Token(DOT, 'dot');
        }

        if(this.currentChar === '='){
            this.advance();
            return new Token(ASSIGN, 'assign');
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
                return new Token(BEAT, beatValue);
            }
        }
        
        this.error();
    }
}

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
        this.globalVariables = {};
    }

    error(){
        throw new Error("error parsing input");
    }

    eat(type){
        if(this.currentToken.type === type){
            this.currentToken = this.lexer.getNextToken();
        }
        else{
            this.error();
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
        console.log('Enter scope: global');
        while(this.currentToken && 
            (this.currentToken.type === CHUNK || 
            this.currentToken.type === PLAY ||
            this.currentToken.type === REST ||
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
        procSymbol.params.push(paramToken.value);
        while(this.currentToken.type && this.currentToken.type === SEP){
            this.sep();
            let paramToken = this.id();
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
        this.eat(ASSIGN);
        if(this.currentToken.type === NOTE){
            let value = this.expr();
            this.globalVariables[varName] = value;
            this.defineVarSymbol(varName, 'PLAYABLE');
        }
        else if(this.currentToken.type === BEAT){
            let beat = this.beat();
            this.globalVariables[varName] = beat;
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
        else if(this.currentToken.type === SAVE){
            //variable assignment
            this.save();
        }
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
            if(varName in this.globalVariables){
                return this.globalVariables[varName];
            }
            else{
                this.currentScope.error(varName);
            }
        }
    }
}

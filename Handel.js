// Token types
const [NOTE, BEAT, FOR, SEP, CHUNK, 
    ENDCHUNK, ID, FINISH, SAVE, DOT, PLAY, REST, ASSIGN, EOF] = ["NOTE", "BEAT", "FOR", "SEP", "CHUNK", 
    "ENDCHUNK", "ID", "FINISH", "SAVE", "DOT", "PLAY", "REST", "ASSIGN", "EOF"];


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

    program(){
        this.compoundStatement();
        this.finish();
    }

    chunk(){
        this.eat(CHUNK);
    }

    endchunk(){
        this.eat(ENDCHUNK);
    }

    statement_list(){
        //let playEvents = [];
        while(this.currentToken && 
                (this.currentToken.type === PLAY || 
                this.currentToken.type === REST ||
                this.currentToken.type === SAVE)
            ){
            //playEvents.push(this.expr());
            this.statement();
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
        this.for();
        let beat = this.beat();
        let events = [new PlayEvent(null, this.beatToValue[beat.value])];
        this.composition.configurePart(events);
    }

    assign(){
        this.eat(SAVE);
        let varName = this.currentToken.value;
        this.eat(ID);
        this.eat(ASSIGN);
        let value = this.expr();
        this.globalVariables[varName] = value;
    }

    statement(){
        if(this.currentToken.type === PLAY){
            this.play();
            console.log("Should play")
        }
        else if(this.currentToken.type === REST){
            this.rest();
            console.log("Should rest")
        }
        else if(this.currentToken.type === SAVE){
            //TODO: variable assignment
            this.assign();
            console.log("Should assign")
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
            console.log("NOTE");
            const notes = this.note_list();
            this.for();
            const beat = this.beat(); 
            return new PlayEvent(notes, this.beatToValue[beat.value]);
        }
        else{
            console.log(this.currentToken);
            let varName = this.id().value;
            console.log(this.globalVariables);
            if(varName in this.globalVariables){
                return this.globalVariables[varName];
            }
            else{
                this.error();
            }
        }
    }
}

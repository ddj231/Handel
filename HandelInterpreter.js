// Token types
const [NOTE, BEAT, FOR, SEP, EOF] = ["NOTE", "BEAT", "FOR", "SEP", "EOF"];

class Token {
    constructor(type, value){
        this.type = type;
        this.value = value;
    }
}

class HandelInterpreter {
    constructor(text){
        this.text = text;
        this.pos = 0;
        this.currentToken = null;
        this.currentChar = this.text[this.pos];
        this.possibleChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        this.possibleNums= ['0', '1', '2', '3', '4', '5', '6', '7'];
        this.beatToValue = {
            1: '4n',
            2: '2n',
            3: '2n.',
            4: '1m'
        }
    }

    error(){
        throw new Error("error parsing input");
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
        return ch === ' '  || ch === '\t';
    }
    
    skipWhitespace(){
        while(this.currentChar !== null && this.isSpace(this.currentChar)){
            this.advance();
        }
    }

    getNextToken(){
        // Lexical analyzer
        if(this.pos >= this.text.length){
            return new Token(EOF, null)
        }

        this.skipWhitespace();
        
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

        if(this.currentChar === 'f'){
            this.advance();
            if(this.currentChar === 'o'){
                this.advance();
                if(this.currentChar === 'r'){
                    this.advance();
                    return new Token(FOR, 'for');
                }
            }
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
    
    eat(type){
        if(this.currentToken.type === type){
            this.currentToken = this.getNextToken();
        }
        else{
            this.error();
        }
    }

    note(){
        const note = this.currentToken;
        this.eat(NOTE);
        return note.value;
    }

    sep(){
        const sep = this.currentToken;
        this.eat(SEP);
    }

    expr(){
        //get first token
        this.currentToken = this.getNextToken();
        /*
        const note = this.currentToken;
        this.eat(NOTE);
        */
        const notes = [];
        notes.push(this.note());
        while(this.currentToken && this.currentToken.type === SEP){
            this.sep();
            notes.push(this.note());
        }

        const op = this.currentToken;
        this.eat(FOR);

        const beat = this.currentToken;
        this.eat(BEAT);

        return new PlayEvent(notes, this.beatToValue[beat.value]);
    }
}
// Token types
const [NOTE, BEAT, FOR, SEP, CHUNK, 
    ENDCHUNK, ID, FINISH, SAVE, ASSIGN, EOF] = ["NOTE", "BEAT", "FOR", "SEP", "CHUNK", 
    "ENDCHUNK", "ID", "FINISH", "SAVE", "ASSIGN", "EOF"];

const RESERVED_KEYWORDS = {
    for: new Token(FOR, 'for'),
    chunk: new Token(CHUNK, 'chunk'),
    endchunk: new Token(ENDCHUNK, 'endchunk'),
    save: new Token(SAVE, 'save')
}

class Token {
    constructor(type, value){
        this.type = type;
        this.value = value;
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
        return ch === ' '  || ch === '\t';
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
            return new Token(ID, result);
        }
        
        this.error();
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

        if(this.currentChar === '='){
            this.advance();
            return new Token(ASSIGN, 'assign');
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

        let saveToken = this.save();
        if(save){
            return saveToken;
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

    
    eat(type){
        if(this.currentToken.type === type){
            this.currentToken = this.lexer.getNextToken();
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
//types of activation Records
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

class HandelProcedureBody {
    constructor(name, level){
        this.name = name;
        this.tokens = [];
        this.pos = 0;
        this.nestingLevel = level;
    }

    addToken(token){
        this.tokens.push(token);
    }

    getNextToken(){
        if(this.pos >= this.tokens.length){
            return new Token(EOF, 'EOF');
        }
        let cur = this.tokens[this.pos];
        this.pos += 1;
        return cur;
    }
}

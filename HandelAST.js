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

class PlayAST{
    constructor(token, child = null){
       this.token = token;
       this.value = token.value;
       this.child = child;
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

    error(lineno){
        throw new Error(`error parsing input at line ${lineno}`);
    }

    eat(type){
        if(this.currentToken.type === type){
            this.currentToken = this.lexer.getNextToken();
        }
        else{
            this.error(this.currentToken.lineno);
        }
    }

    play(){
        let token = this.currentToken;
        this.eat(PLAY);
        let child = this.expr();
        return new PlayAST(token, child);
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
            this.currentToken.type === SAVE)){
                statementList = this.statementList();
        }
        else{
            this.error();
        }
        let programNode = new ProgramAST(startToken, statementList);
        //console.log(this.currentToken);
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
            //console.log("CURRENT TOKEN", this.currentToken)
            this.eat(DIGIT);
            return new BPMAST(bpmToken, digit);
        }
        else if(this.currentToken.type === SOUND){
            let soundToken = this.currentToken;
            this.eat(SOUND);
            let instrument = this.currentToken.value;
            this.eat(INSTRUMENT);
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
        //console.log(customizationList);
        return new ProcedureCallAST(procedureToken, actualParams, customizationList);
    }

    statementList(){
        let statementListNode = new StatementListAST();
        while(this.currentToken && 
                (this.currentToken.type === CHUNK || 
                this.currentToken.type === PLAY || 
                this.currentToken.type === REST ||
                this.currentToken.type === RUN ||
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
        else if(this.currentToken.type === SAVE){
            //variable assignment
            return this.save();
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

class HandelInterpreterAST {
    constructor(parser){
        this.parser = parser;
        this.beatToValue = {
            1: '4n',
            2: '2n',
            3: '2n.',
            4: '1m'
        }
        this.currentComposition;
        this.callStack = new HandelCallStack();
    }

    visitProgram(node){
        Tone.Transport.cancel(0);
        let ar = new HandelActivationRecord('program', ARTYPES.PROGRAM, 1);
        this.currentComposition = new Composition(Tone.AMSynth, 140);
        this.currentComposition.enclosingComposition = null;
        this.callStack.push(ar);
        this.visitStatementList(node.child);
        this.callStack.pop();
        //Tone.start().then(() => {
        //});
        Tone.Transport.stop();
        Tone.Transport.start(Tone.now() + 0.1);
    }

    visitSectionDeclaration(node){
    }

    visitProcedureCall(node){
        let procSymbol = node.procSymbol;
        let ar = new HandelActivationRecord(node.value, ARTYPES.PROCEDURE, procSymbol.scopeLevel + 1);
        //console.log(ar);

        let prevCompositon = this.currentComposition;
        this.currentComposition = new Composition(Tone.AMSynth, 140);
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
            //console.log("PARAM",formalParams[i]);
            ar.setItem(formalParams[i].name, actualValue);
        }
        this.callStack.push(ar);;

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

        //execute body
        this.visitStatementList(procSymbol.statementList);
        //console.log(this.currentComposition);

        this.callStack.pop(ar);
        this.currentComposition = this.currentComposition.enclosingComposition;
    }

    visitBPM(node){
        //console.log(this.currentComposition);
        let bpm = node.bpm;
        console.log("BPM", bpm);
        this.currentComposition.bpm = bpm;
        return
    }

    visitSound(node){
        let instrument = node.instrument;
        if(instrument === 'kick'){
            let kick = new Kick().synth;
            //this.currentComposition.synth = new Tone.PolySynth({voice: Tone.MembraneSynth}).toDestination();
            this.currentComposition.synth = kick;
        }
        else if(instrument === 'snare'){
            let snare = new Snare().synth;
            //this.currentComposition.synth = new Tone.PolySynth({voice: Tone.MembraneSynth}).toDestination();
            this.currentComposition.synth = snare;
        }
        else if(instrument === 'hihat'){
            let hihat = new HiHat().synth;
            //this.currentComposition.synth = new Tone.PolySynth({voice: Tone.MembraneSynth}).toDestination();
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
            else {
                this.error();
            }
            this.currentComposition.play();
            console.log("should play");
        }
    }

    visitPlay(node){
        //let forNode = node.child;
        //console.log("configure part");
        if(node.child.token.type === FOR){
            let forNode = node.child;
           // this.visitFor(forNode)
            this.currentComposition.configurePart([this.visitFor(forNode)]);
        }
        else if(node.child.token.type === ID){
            this.currentComposition.configurePart([this.visitId(node.child)]);
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
            events = [this.visitId(child)];
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

    visitFor(node){
        if(node.right){
            return new PlayEvent(this.visitNoteList(node.left), this.beatToValue[node.right.value]);
        }
        else{
            return new PlayEvent(null, this.beatToValue[node.left.value]);
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
        console.log('enter global scope')
        this.currentScope = new HandelSymbolTable('global', 1, null);

        //subtree
        this.visitStatementList(node.child);

        //console.log("GLOBAL Scope", this.currentScope);
        console.log('leave global scope')
        this.currentScope = this.currentScope.enclosingScope;
    }

    visitSectionDeclaration(node){
        let procName = node.value;
        let procSymbol = new ProcedureSymbol(procName);
        this.currentScope.define(procSymbol);

        console.log('ENTER NEW SCOPE', procName);
        this.currentScope = new HandelSymbolTable(procName, 
            this.currentScope.scopeLevel + 1, this.currentScope);
        
        if(node.parameterList){
            //console.log(node);
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

        //console.log(this.currentScope);
        console.log('LEAVE Scope', procName)
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
        let formalParams = procSymbol.params
        //console.log("FORMAL PARAMS", formalParams);
        if(node.actualParams.length != formalParams.length){
            throw Error(`invalid arguments at line: ${node.token.lineno}`);
        }
        node.procSymbol = procSymbol;
        /*
        for(let param of actualParams){
        }
        */

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
        }
    }

    visitPlay(node){
        if(node.child.token.type === FOR){
            let forNode = node.child;
            this.visitFor(forNode)
        }
        else if(node.child.token.type === ID){
            this.visitId(node.child)
        }
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
            varSymbol = new VarSymbol(varNode.token.value, this.currentScope.lookup('BEAT'));
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
        //console.log("FOR", node)
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
# Handel

Handel is a procedural programming language for writting songs in browser.

### Usage

### Handel Snippet
```
start
    chunk example 
        play E3, C3, G3 for 2b
    endchunk
    run example with sound piano, loop for 5 
finish
```

### Example Using Handel In Browser
```
function clicked(){
    RunHandel(`
        start
            chunk example using somePlayable 
                play somePlayable 
                rest for 1b
            endchunk
            save myPlayable = Eb3 for 1b
            run example using myPlayable with sound piano, loop for 5 
        finish
    `)
}
document.addEventListener("click", clicked);
```
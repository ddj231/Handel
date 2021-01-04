function clicked(){
    RunHandel(`
    start
        chunk arb
            play E3, G3, B3 for 10b
            rest for 4b
            play D3, F3, A3 for 10b
            rest for 4b
            play F3, A3, C3 for 10b
            rest for 4b
            play E3, G3, B3 for 10b
        endchunk
        run arb with bpm 200, sound piano 
    finish
    `)
}
document.addEventListener("click", clicked);
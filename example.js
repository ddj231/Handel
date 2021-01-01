function clicked(){
    RunHandel(`
    start
        chunk gerand 
            play E4, G4, B4 for 1b
            rest for 1b
            play D3, G4, C4, E4 for 1b 
            rest for 1b
            play E3, G#4, B4, Eb4 for 1b
            rest for 1b
        endchunk

        chunk backbeat
            rest for 1b
            play E1 for 1b
        endchunk

        run gerand with sound piano, loop for 5
        run gerand with sound snare, loop for 5
        run backbeat with sound kick, loop for 15 
    finish
    `)
}
document.addEventListener("click", clicked);
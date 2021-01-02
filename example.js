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
            rest for 1b
            play E1 for 1b
        endchunk

        chunk hats 
            rest for 1b
            play E1 for 1b
            rest for 1b
        endchunk

        run gerand with bpm 120, sound piano, loop for 50
        run hats with bpm 240, sound hihat, loop for 100
        run backbeat with bpm 240, sound kick, loop for 100
    finish
    `)
}
document.addEventListener("click", clicked);
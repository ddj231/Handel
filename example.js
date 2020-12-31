function clicked(){
    RunHandel(`
    start
        chunk withargs using somechord 
            play somechord 
        endchunk

        run withargs using E3, G3, F3 for 1b with bpm 100, loop for 8, sound piano 
    finish
    `)
}
document.addEventListener("click", clicked);
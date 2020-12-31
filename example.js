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
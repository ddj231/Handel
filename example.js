function clicked(){
    RunHandel(`
    start
        chunk hello
            save myplayable = E4 for 1b
            save myplayabletwo = myplayable
            play myplayabletwo
        endchunk
        run hello
    finish
    `)
}

document.addEventListener("click", clicked);
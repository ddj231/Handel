function clicked(){
    RunHandel(`
    start
        save myplayable = E4 for 1b
        chunk hello
            save myplayabletwo = myplayable
            play myplayabletwo
        endchunk
        run hello
    finish
    `)
}

document.addEventListener("click", clicked);
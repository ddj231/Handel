function clicked(){
    RunHandel(`
        start
            chunk somechunk 
                play E4 for 1b loop for 3
                rest for 1b
            endchunk
            run somechunk with sound piano, loop for 2 
        finish
    `)
}
document.addEventListener("click", clicked);
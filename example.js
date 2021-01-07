function clicked(){
    RunHandel(`
    start
        block 
            play C3, E3, G3 for 1b loop for 2
            play D3, F3, A3 for 1b 
            play E3, G3, B3 for 1b 
            play C4, E3, G4 for 1b 
        endblock loop for 2 

        block 
            play C2, E2, G2 for 4b 
            block
                play C3, E3, G3 for 1b 
                play D3, F3, A3 for 1b 
                play E3, G3, B3 for 1b 
                play C4, E3, G4 for 1b 
            endblock loop for 2
        endblock loop for 2 

        chunk mypiano
            block
                play C2 for 2b
                rest for 2b
                play E2 for 2b
                rest for 2b
            endblock loop for 5
        endchunk

        run mypiano with sound piano
    finish
    `)
}

document.addEventListener("click", clicked);
function clicked(){
    RunHandel(`
    start
	chunk mykeys 
    	play E3, G3, A3, C3 for 1b
        rest for 1b
    	play G3, B3, D3, B3 for 1b
        rest for 1b
    	play F3, A3, C3, E3 for 1b
        rest for 1b
    	play B3, D3, F3, A3 for 1b
        rest for 1b
    endchunk
    chunk mykick
    	rest for 1b
    	play E2 for 1b
    endchunk 
    
    chunk mysnare
    	play E2 for 1b
    	rest for 1b
    endchunk 
    
    chunk myhats
    	play E2 for 1b
    	rest for 1b
    endchunk 
    run mykeys with bpm 100, sound guitar, loop for 300
    run mykick with bpm 100, sound kick, loop for 300
    run myhats with sound hihat, bpm 300, loop for 300
    run mysnare with sound snare, bpm 100, loop for 300
    finish
    `)
}
document.addEventListener("click", clicked);
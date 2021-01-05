function clicked(){
    RunHandel(`
    start
    save myplayablenote = E2 for 2b
    save help = for 2b
    rest help 
    play myplayablenote
    finish
    `)
}
document.addEventListener("click", clicked);
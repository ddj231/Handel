function clicked(){
    RunHandel(`
    start
        load hello as sampler
    finish
    `)
}

document.addEventListener("click", clicked);
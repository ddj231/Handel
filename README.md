# Handel

*soli deo gloria*

Handel is a small procedural programming language for writting songs in browser. 

The Handel Interpreter plays sounds in browser, thanks to [Tone.js](https://tonejs.github.io/).

## Installation

Add the below to your html file:

```
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.74/Tone.js"></script>
<script src="https://unpkg.com/handel-pl"></script>
```

You're all set!

## Usage

### Example Handel Snippet

```
start
    chunk example 
        play E3, C3, G3 for 2b
    endchunk
    run example with sound piano, loop for 5 
finish
```

### Example Using Handel In Browser

```
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
```

## Getting started

A Handel program must be contained within the **start** and **finish** keywords. Below is a complete Handel program (and the shortest syntactically correct program):
```
start
finish
```

The program above does nothing. But it's a start!

### Let's play something

A note or a chord can be played using the play command. Below is an example program that plays a note, then a chord:

```
start
    play C#3 for 1b
    play E3, G3, A4 for 1b
finish
```

Note the syntax above. A **play** command begins with the **play** keyword, then a note or chord (a list of notes separated by commas) follow.

Lastly a duration is needed. The play command above ends with 'for 1b', which states how long the particular note or notelist (chord) should be held. Currently the available beat lenghts are 1b, 2b, 3b, and 4b. 

Phew! We're getting somewhere.

### Let's rest

Similar to the play command, a rest can played using the rest command. Below is an example program that rests for 1 beat then plays a note for 2 beats.

```
start
    rest for 1b
    play G5 for 2b
finish
```

### But are there Variables?

tl;dr
Here is some example usage of variables in Handel

```
save myplayable = E4, F4, G3 for 3b
save myduration = for 1b

play myplayable
rest myduration
```

Variables can be declared that store two builtin types in Handel: Playables and Durations.

We've already seen **Playables** above. Playables are a note or notelist (chord) followed by a duration.
Here are some example playables.

```
Bb3 for 1b
D#6, E#6, G3 for 1b
```

*no promises that the above chord sounds pleasing to the ear :p*

A **Duration** is the keyword **for** followed by a beat length.
Here are all available durations: 

```
for 1b
for 2b
for 3b
for 4b
```

Finally variables!

To store a playable or a duration use the **save** keyword, followed by a variable name, an equal sign and a playable or a duration.

Variable names must be only lowercase letters, and contain no numbers. Variable names must also not be any of the reserved keywords in Handel. (See the Reserved Keywords section below).

Below is an example program using variables.

```
start
    save myplayablenote = E2 for 2b
    save myrest = for 2b

    play myplayablenote
    rest myrest
    play myplayablenote
    rest myrest
finish
```

OK! So far so good!

### Procedures (I thought this was a procedural programming language?)

Procedures in Handel are called chunks. A **chunk** can be conceptualized as a song track. When ran,
chunks play at the same time as other run chunks and the global track. Chunks must begin with the **chunk**
keyword and end with the **endchunk** keyword.

Maybe it will be easier to show rather than tell.

Below is an example program with a kick drum and a piano, playing together.

```
start
    chunk backbeat using myplayable
        play myplayable 
    endchunk

    chunk mykeys 
        play E3, G3, A3 for 1b
        play G3, A2, C3 for 1b
        play F3, A3, C3 for 1b
        play D3, F2, A3 for 1b
    endchunk

    run mykeys with sound piano, loop for 2

    save myplayable = A1 for 1b

    run backbeat using myplayable with sound kick, loop for 8
finish
```

Both the 'backbeat' chunk and the 'mykeys' chunk above play together (not one after the other). This
behavior allows multitrack songs to be created with Handel. 

### More on procedures (chunks) and their syntax

#### Procedure declaration (creating chunks) 

As noted above a chunk is created with the **chunk** keyword. The name of the **chunk** (the chunk name) then follows.

This chunk name must be all lowercase letters, no numbers and cannot be one of Handel's reserved keywords. (See the Reserved Keywords section below).

After the chunk name, parameters can optionally be added. A list of comma separated parameters can follow the **using** keyword.

Together you get the following: `chunk somechunkname using someparam, anotherparam`

After the optional parameter list, a body can be added to the chunk. This is a function body (what you would like to happen when the chunk is ran).

Lastly the chunk must be ended with the **endchunk** keyword.

#### Running Procedures 

A chunk can be ran using the **run** keyword.

To run a chunk use the **run** command followed by the name of the chunk. 

If the chunk has parameters, a matching number of comma separated arguments must be used.

Here is an example running two chunks. One chunk requires arguments the other does not.

```
start
    chunk noargs
        play C3 for 1b
    endchunk

    chunk withtwoargs using argone, argtwo
        play argone
        play argtwo
    endchunk

    run noargs
    save somevar = Cb4 for 1b
    run withtwoargs using E3 for 1b,  somevar
finish
```

Note that saved variables, playables, or durations, can be used as arguments when running a chunk.

OK! Now to configuring a run of a chunk.

#### Configuring a run of a chunk

A run of chunk can be configured by adding the **with** keyword and a comma separated list of customizations to the end of a run command.

There are three main customizations: **bpm**, **sound**, and **loop**.

The **bpm** keyword can be used to set the bpm of the run of the chunk.

For example ```bpm 120```

The **sound** keyword can be used to set the instrument of the run of the chunk.

For example ```sound piano```

The current available sounds to choose from are: piano, synth, casio, kick, snare, hihat

The **loop** keyword can be used to set the amount of times the run of the chunk shoud loop for.

For example ```loop for 10```

All together a run of a chunk can be configured as follows:

```
start
    chunk withargs using somechord 
        play somechord 
    endchunk

    run withargs using E3, G3, F3 for 1b with bpm 100, loop for 8, sound piano 
finish
```

Above we've got a chord, played with a piano, looping 8 times, with a bpm of 100!


### Reference 

Note: A musical note. 7 octaves are available.
*Examples*
```
C3
Eb2
G#7
```

Notelist: A list of notes. Together this list of notes forms a chord. (6 notes maximum).
*Examples*
```
C2, E2, G2
C4, Eb4, G#3
```

Beat: A number of beats. Only 4 possible (1b, 2b, 3b, and 4b).

Duration: An expression that represents the amount of beats to play or hold for.
*Examples*
```
for 1b
for 2b
```

Playable: A note or a notelist, followed by a duration. 
*Examples*
```
C1, F1, E1, D1, for 1b
D1 for 2b
```


play: A command to play a note or notelist for a given duration.
*Examples*
```
play C1, F1, E1, D1, for 1b
play D1 for 2b
```


rest: A command to rest for a given duration.
*Examples*
```
rest for 1b
rest for 2b
```

save: A command to save a variable (see above section on variables for more details). Only playabes and durations can be saved in variables.
*Examples*
```
save myplayable = E2 for 1b
save myduration = for 1b
```

chunk: Used to declare a procedure. (see above section on procedures for more details)
*Examples*
```
chunk mybassline
    play G1 for 2b
endchunk
```

using: Used to prepend a list of paramaters for a chunk.

```
chunk mypiano using nicechord
    play nicechord 
endchunk
```

run: Used to run a chunk. (see above section on running procedures for more details).
*Examples*
```
run mypiano using E2, C#2 for 1b 
```

with: Used to customize a given run of a chunk. (see section on procedures above for more details)

```
run mybassline with bpm 115
```

bpm (beats per minute), loop, sound: Follows the **with** keyword. Used to customize a run of a chunk.

```
run mybassline with bpm 90, loop for 2, sound kick
```

Sounds: possible sounds that can be used to customize a run of a chunk. (piano, synth, casio, kick, snare, hihat)

## Reserved Keywords
start
finish
play
rest
save
chunk
endchunk
using
run
with
bpm
loop
sound
piano
synth
casio
kick
snare

All notes names are reserved, ex. C4, Bb1. 
For this reason use only lowercase letters with no numbers in variable names.







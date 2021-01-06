# Handel

Handel is a small procedural programming language for writting songs in browser. 

The Handel Interpreter interprets Handel programs and plays compositions in browser, thanks to [Tone.js](https://tonejs.github.io/).

Try the Handel Web Editor here: [Handel Web Editor](https://ddj231.github.io/Handel-Web-Editor/)

*soli deo gloria*


# Installation

Add the below to your html file:

```
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.74/Tone.js"></script>
<script src="https://unpkg.com/handel-pl"></script>
```

You're all set!

# Usage

## Example Handel Snippet

```
start
    chunk example 
        play E3, C3, G3 for 2b
    endchunk
    run example with sound piano, loop for 5 
finish
```

See the Examples folder [here](./Examples/) for example Handel programs and inspiration.

## Example Using Handel In Browser

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

Note that you pass the Handel code into the **RunHandel** function. This function is globally available. 

Additionally you can use the **StopHandel** function to stop a running Handel program. 

```
StopHandel();
```

This function is also globally available.


# Getting started

Handel programs are contained within the **start** and **finish** keywords. Below is a complete Handel program:

```
start
    play E4 for 1b
finish
```

The program above only plays 1 note. But it's a start!


# Let's play something

You can be play notes and chords using the play command. Below is an example program that plays a note, then a chord:

```
start
    play C#3 for 1b
    play E3, G3, A4 for 1b
finish
```

Note the syntax above. A **play** command begins with the **play** keyword, then a note or chord (a list of notes separated by commas) follows.

Lastly play commands need a duration. The play commands above end with 'for 1b'. This states how long the particular note or notelist (chord) should be held.  

Phew! We're getting somewhere.


# Let's rest

Similar to the play command, a rest can played using the rest command. Below is an example program that rests for 1 beat then plays a note for 2 beats.

```
start
    rest for 1b
    play G5 for 2b
finish
```


# But are there Variables?

tl;dr
Here is some example usage of variables in Handel

```
save myplayable = E4, F4, G3 for 3b
save myduration = for 1b

play myplayable
rest myduration
```

You can declare Variables in Handel. Variables store two builtin types in Handel: Playables and Durations.

We've already seen **Playables** above. Playables are a note or notelist (chord) followed by a duration.
Here are some example playables.

```
Bb3 for 1b
D#6, E#6, G3 for 1b
```

*no promises that the above chord sounds pleasing to the ear :p*

**Durations** are the keyword **for** followed by a beat.

A **beat** is any whole number followed by the letter 'b' 

All together, here some example durations: 

```
for 1b
for 2b
for 16b
for 32b
```

Finally variables!

To store a playable or a duration use the **save** keyword, followed by a variable name, an equal sign and a playable or a duration.

Variable name must contain only lowercase letters, and no numbers. Variable names must also not be any of the reserved keywords in Handel. (See the Reserved Keywords section below).

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



# Procedures (I thought this was a procedural programming language?)

Procedures in Handel are called chunks. You can conceptualize a **chunk** as a song track. When ran,
chunks play at the same time as other run chunks and the global track. Chunks must begin with the **chunk**
keyword and end with the **endchunk** keyword.

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



# More on procedures (chunks) and their syntax


## Procedure declaration (creating chunks) 

As noted above you can create chunks with the **chunk** keyword. The name of the **chunk** (the chunk name) follows the keyword.

This chunk name must be all lowercase letters, no numbers and cannot be one of Handel's reserved keywords. (See the Reserved Keywords section below).

After the chunk name, you can optionally add parameters. A list of comma separated parameters can follow the **using** keyword.

Together you get the following: `chunk somechunkname using someparam, anotherparam`

After the optional parameter list, you can add a body to the chunk. This is a function body (what you would like to happen when the chunk is ran).

Lastly the chunk must be ended with the **endchunk** keyword.


## Running Procedures 

You can run a chunk using the **run** keyword.

To run a chunk use the **run** command followed by the name of the chunk. 

If the chunk has parameters, a you must use a matching number of comma separated arguments.

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


## Configuring a run of a chunk

You can configure a run of chunk by adding the **with** keyword and a comma separated list of customizations to the end of a run command.

There are three main customizations: **bpm**, **sound**, and **loop**.

You can use **bpm** keyword to set the bpm of a run of a chunk.

For example ```bpm 120```

You can use the **sound** keyword to set the instrument of a run of a chunk.

For example ```sound piano```

The current available sounds to choose from are: piano, synth, casio, kick, snare, hihat

You can use the **loop** keyword to set the amount of times the run of a chunk shoud loop for.

For example ```loop for 10```

All together you can configure a run of a chunk as follows:

```
start
    chunk withargs using somechord 
        play somechord 
    endchunk

    run withargs using E3, G3, F3 for 1b with bpm 100, loop for 8, sound piano 
finish
```

Above we've got a chord, played with a piano, looping 8 times, with a bpm of 100!

# Reference 

**Note**: A musical note. 7 octaves are available.
```
C3
Eb2
G#7
```

<br/>

**Notelist**: A list of notes. Together this list of notes forms a chord. (6 notes maximum).
```
C2, E2, G2
C4, Eb4, G#3
```

<br/>

**Beat**: A number of beats. A whole number followed by the character 'b'.
```
1b
20b
```

<br/>

**Duration**: An expression that represents the amount of beats to play or hold for.
```
for 1b
for 2b
```

<br/>

**Playable**: A note or a notelist, followed by a duration. 
```
C1, F1, E1, D1, for 1b
D1 for 2b
```

<br/>

**play**: A command to play a note or notelist for a given duration. Play commands can also take a loop customization.
```
play C1, F1, E1, D1, for 1b
play D1 for 2b 
play E3 for 2b loop for 5
```

<br/>

**rest**: A command to rest for a given duration.
```
rest for 1b
rest for 2b
```

<br/>

**save**: A command to save a variable (see above section on variables for more details). Only playabes and durations can be saved in variables.
```
save myplayable = E2 for 1b
save myduration = for 1b
```

<br/>

**chunk**: Used to declare a procedure. (see above section on procedures for more details)
```
chunk mybassline
    play G1 for 2b
endchunk
```

<br/>

**using**: Used to prepend a list of paramaters for a chunk.

```
chunk mypiano using nicechord
    play nicechord 
endchunk
```

<br/>

**run**: Used to run a chunk. (see above section on running procedures for more details).
```
run mypiano using E2, C#2 for 1b 
```

<br/>

**with**: Used to customize a given run of a chunk. (see section on procedures above for more details)

```
run mybassline with bpm 115
```

<br/>

**bpm**: beats per minute (bpms are best synced when under 1000). 
**loop**: amount of times to loop
**sound**:  instrument to use. Follows the **with** keyword.
```
run mybassline with bpm 90, loop for 2, sound kick
```

<br/>

**Sounds**: possible sounds that can be used to customize a run of a chunk. (piano, guitar, synth, casio, kick, snare, hihat)

# Reserved Keywords

### start

### finish

### play

### rest

### save

### chunk

### endchunk

### using

### run

### with

### bpm

### loop

### sound

### piano

### synth

### casio

### guitar 

### kick

### snare

All note names are reserved keywords, ex. **C4**, **Bb1**. 
For this reason use only lowercase letters with no numbers in variable names.







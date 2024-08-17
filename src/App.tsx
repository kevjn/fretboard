import './App.css'
import { Fretboard } from './Fretboard'
import React from 'react'
import { IntRange } from 'type-fest'
import { NoteHistory } from './NoteHistory'
import { InitDetectorEvent } from './PitchProcessor'
import workletUrl from "./PitchProcessor?worker&url"
import wasmUrl from "wasm-audio/wasm_audio_bg.wasm?url"

const ClickableTitle = (props: { onClickLeft: () => void, onClickRight: () => void, text: string }) => {
  return (
      <div style={{display: "flex", justifyContent: "center"}} >
        <h1 className='button' onClick={props.onClickLeft} >&#x2190; &nbsp;</h1>
        <h1 style={{width: "600px"}} >{props.text}</h1>
        <h1 className='button' onClick={props.onClickRight} >&nbsp; &#x2192;</h1>
      </div>
  )
}

const setupAudio = async (onPitchDetectedCallback: (pitch: number) => void) => {
  if (!navigator.mediaDevices) throw new Error("This web browser does not support web audio")

  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

  const context = new AudioContext()
  const audioSource = context.createMediaStreamSource(mediaStream)

  const response = await fetch(wasmUrl);
  const wasmBytes = await response.arrayBuffer()

  await context.audioWorklet.addModule(workletUrl)

  const numAudioSamplesPerAnalysis = 1024 * 5
  const sampleRate = context.sampleRate

  const node = new AudioWorkletNode(context, "PitchProcessor")
  const event: InitDetectorEvent = {
    type: "init-detector", wasmBytes, numAudioSamplesPerAnalysis, sampleRate
  }

  node.port.postMessage(event)

  node.port.onmessage = (event) => {
    if (event.data.type === "pitch") {
      onPitchDetectedCallback(event.data.pitch)
    }
  }

  audioSource.connect(node)
  node.connect(context.destination)

  return { context, node }
}

export type Note = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B"
type Ordinal = IntRange<0, 12>

export const NOTE_SYMBOLS: { [key in Ordinal]: Note } = { 0: 'F', 1: 'F#', 2: 'G', 3: 'G#', 4: 'A', 5: 'A#', 6: 'B', 7: 'C', 8: 'C#', 9: 'D', 10: 'D#', 11: 'E' };

// We use A4 as our reference pitch
const LOG_A = Math.log2(440);
// the formula for calculating the frequency f for a given note n is:
// f = 2^(n/12) * 440
// the inversion of this for n is:
// n = (log_2(f) - log_2(440)) * 12
// where n is the number of semitones above A4.
const freqToNote = (freq: number): { note: number, octave: number } => {
  // we need to add 4 here since there are 4 semitones between F and A.
  const note = Math.round((Math.log2(freq) - LOG_A) * 12) + 4
  return { 
    note,
    octave: 3 + Math.ceil((note + 6) / 12) // we use the note between B and C as octave step
  } 
}

const SetupAudioButton = (props: { setLatestPitch: (pitch: number) => void }) => {
  const [running, setRunning] = React.useState(false)
  const [audio, setAudio] = React.useState<Audio | null>(null)

  if (!audio) {
    return (
      <button
        style={{overflow: "auto", height: "50px"}}
        onClick={async () => {
          setAudio(await setupAudio(props.setLatestPitch))
          setRunning(true)
        }}
      >
        Start listening
      </button>
    )
  }

  const { context } = audio
  return (
    <button
      style={{overflow: "auto", height: "50px"}}
      onClick={async () => {
        if (running) await context.suspend()
        else await context.resume()

        setRunning(context.state === "running")
      }}
      disabled={context.state !== "running" && context.state !== "suspended"}
    >
      {running ? <span>&#x23f8;</span> : <span>&#x23f5;</span> }
    </button>
  )
}


type Audio = { context: AudioContext, node: AudioWorkletNode }

function App() {
  const [shift, setShift] = React.useState<Ordinal>(7)
  const [latestPitch, setLatestPitch] = React.useState<number | null>(null)

  const shiftScales = (direction: 1 | -1) => {
    setShift((prevState) => (prevState+direction).mod(12) as Ordinal)
  }

  const keySignature = `${NOTE_SYMBOLS[shift]} Major / ${NOTE_SYMBOLS[(shift + 9).mod(12) as Ordinal]} Minor`
  const latestNote = latestPitch ? freqToNote(latestPitch) : null

  return (
    <>
      <ClickableTitle
        text={keySignature}
        onClickLeft={() => shiftScales(-1)}
        onClickRight={() => shiftScales(1)}
      />
      <div style={{ display: "flex", marginTop: "5vw", marginBottom: "5vw", width: "90vw", aspectRatio: "2200 / 250" }}>
        <Fretboard shift={shift} latestNote={latestNote?.note ?? null} />
      </div>
      <NoteHistory note={latestNote ? NOTE_SYMBOLS[latestNote.note.mod(12) as Ordinal] : null} octave={latestNote?.octave ?? null} />
      <SetupAudioButton setLatestPitch={setLatestPitch} />
    </>
  )
}

export default App

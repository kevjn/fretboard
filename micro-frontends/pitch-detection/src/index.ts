
import { InitDetectorEvent } from "./PitchProcessor"

import wasmUrl from "wasm-audio/wasm_audio_bg.wasm?url"
import workletUrl from "./PitchProcessor?worker&url"

class PitchDetector extends EventTarget {
  constructor() {
    super()
  }

  async connect(media: MediaStream) {

    const audioContext = new AudioContext()
    const audioSource = audioContext.createMediaStreamSource(media)

    const response = await fetch(wasmUrl)
    const wasmBytes = await response.arrayBuffer()

    await audioContext.audioWorklet.addModule(workletUrl)

    const numAudioSamplesPerAnalysis = 1024 * 5
    const sampleRate = audioContext.sampleRate

    const node = new AudioWorkletNode(audioContext, "PitchProcessor")
    const event: InitDetectorEvent = {
      type: "init-detector", wasmBytes, numAudioSamplesPerAnalysis, sampleRate
    }
    node.port.postMessage(event)

    node.port.onmessage = (event) => {
      if (event.data.type === "pitch") {
        console.info(event.data.pitch)
      }
    }

    audioSource.connect(node)
    node.connect(audioContext.destination)
  }
}

export default async (context: any): Promise<void> => {
  if (!navigator.mediaDevices) throw new Error("This web browser does not support web audio")
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

  context.pitch = new PitchDetector()
  await context.pitch.connect(mediaStream)
}
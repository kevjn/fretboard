
import { InitDetectorEvent } from "./PitchProcessor"

import wasmUrl from "wasm-audio/wasm_audio_bg.wasm?url"
import workletUrl from "./PitchProcessor?worker&url"

export default async (context: any): Promise<void> => {
  if (!navigator.mediaDevices) throw new Error("This web browser does not support web audio")
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  
    const audioContext = new AudioContext()
    const audioSource = audioContext.createMediaStreamSource(mediaStream)
  
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
  
    audioSource.connect(node)
    node.connect(audioContext.destination)
  
    context.pitchNode = node
}
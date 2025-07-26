import init, { WasmPitchDetector } from 'wasm-audio'

export type InitDetectorEvent = { type: "init-detector", wasmBytes: ArrayBuffer, numAudioSamplesPerAnalysis: number, sampleRate: number }

class PitchProcessor extends AudioWorkletProcessor {
  samples: Float32Array
  detector: WasmPitchDetector | null

  constructor(_options: unknown) {
    super()

    this.detector = null
    this.samples = new Float32Array()

    this.port.onmessage = (event) => this.onmessage(event.data)
  }

  onmessage(event: InitDetectorEvent) {
    if (event.type === "init-detector") {
      init(WebAssembly.compile(event.wasmBytes)).then(() => {
        this.samples = new Float32Array(event.numAudioSamplesPerAnalysis).fill(0)
        this.detector = WasmPitchDetector.new(event.sampleRate, event.numAudioSamplesPerAnalysis)
        this.port.postMessage({ type: 'wasm-module-loaded' });
      });
    }
  }

  process(inputs: Float32Array[][], _outputs: Float32Array[][]) {
    if (this.detector) {

      const inputChannels = inputs[0]
      const inputSamples = inputChannels[0]

      const numNewSamples = inputSamples.length
      this.samples.copyWithin(0,numNewSamples)
      this.samples.subarray(-numNewSamples).set(inputSamples)

      const pitch = this.detector.detect_pitch(this.samples)
      if (pitch !== 0) {
        this.port.postMessage({ type: "pitch", pitch })
      }
    }

    return true
  }
}

registerProcessor("PitchProcessor", PitchProcessor)
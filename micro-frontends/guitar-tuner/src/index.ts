import P5 from 'p5'

// DISCLAIMER: USE OF AI GENERATED CODE
// The types are wrong because we are using p5.js version 2.0.3 and the types
// are only updated for version 1.7.6.
export default async (root: ShadowRoot, context: { pitchNode: AudioWorkletNode }): Promise<void> => {
  // Create container for p5.js
  root.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }
      #tuner {
        width: 100%;
        height: 100%;
      }
    </style>
    <div id="tuner"></div>
  `

  const container = root.getElementById('tuner')!

  // Note names
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // Current pitch data
  let currentPitch = 0
  let currentNote = ''
  let currentCents = 0
  let targetCents = 0
  let targetNeedleAngle = 0
  let needleAngle = 0
  
  // Find closest note
  function getClosestNote(freq: number) {
    if (freq <= 0) return { note: '', cents: 0 }
    
    const A4 = 440
    const noteNum = 12 * Math.log2(freq / A4) + 69
    const nearest = Math.round(noteNum)
    const nearestFreq = A4 * Math.pow(2, (nearest - 69) / 12)
    const cents = 1200 * Math.log2(freq / nearestFreq)
    const noteIndex = ((nearest % 12) + 12) % 12
    
    return {
      note: notes[noteIndex],
      cents: cents
    }
  }
  
  // Create p5 sketch
  const sketch = (p: P5) => {
    p.setup = () => {
      const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight)
      canvas.parent(container)
      p.textAlign(p.CENTER, p.CENTER)
    }
    
    p.draw = () => {
      // Dark background
      p.background(20)
      
      const centerX = p.width / 2
      const centerY = p.height / 2
      const minDim = Math.min(p.width, p.height)
      const radius = minDim * 0.25
      
      // Calculate vertical center offset to ensure everything fits
      const arcCenterY = centerY + minDim * 0.05
      
      // Draw arc background
      p.push()
      p.translate(centerX, arcCenterY)
      p.noFill()
      p.strokeWeight(3)
      p.stroke(60)
      p.arc(0, 0, radius * 2, radius * 2, -p.PI * 0.75, p.PI * 0.75)
      p.pop()
      
      // Draw tick marks
      p.push()
      p.translate(centerX, arcCenterY)
      for (let i = -50; i <= 50; i += 10) {
        const angle = p.map(i, -50, 50, -p.PI * 0.75, p.PI * 0.75)
        const innerR = radius * 0.9
        const outerR = i === 0 ? radius * 1.15 : (i % 50 === 0 ? radius * 1.1 : radius)
        
        p.stroke(i === 0 ? p.color(100, 255, 100) : 100)
        p.strokeWeight(i === 0 ? 3 : 1)
        
        p.line(
          innerR * p.cos(angle),
          innerR * p.sin(angle),
          outerR * p.cos(angle),
          outerR * p.sin(angle)
        )
      }
      p.pop()
      
      // Smooth needle movement
      targetNeedleAngle = p.map(p.constrain(targetCents, -50, 50), -50, 50, -p.PI * 0.75, p.PI * 0.75)
      needleAngle = p.lerp(needleAngle, targetNeedleAngle, 0.2)
      
      // Draw needle
      p.push()
      p.translate(centerX, arcCenterY)
      p.rotate(needleAngle)
      p.stroke(255)
      p.strokeWeight(4)
      p.line(0, 0, radius * 0.8, 0)
      
      // Needle tip
      p.fill(255)
      p.noStroke()
      p.circle(radius * 0.8, 0, 12)
      p.pop()
      
      // Center dot
      p.fill(255)
      p.noStroke()
      p.circle(centerX, arcCenterY, 16)
      
      // Note display - positioned above the arc
      p.fill(255)
      p.textSize(minDim * 0.12)
      p.text(currentNote || '-', centerX, arcCenterY - radius - minDim * 0.15)
      
      // Frequency display
      p.textSize(minDim * 0.03)
      p.fill(150)
      if (currentPitch > 0) {
        p.text(`${currentPitch.toFixed(1)} Hz`, centerX, arcCenterY - radius - minDim * 0.08)
      }
      
      // In tune indicator - positioned below the arc
      if (Math.abs(currentCents) < 5 && currentNote) {
        p.fill(100, 255, 100)
        p.textSize(minDim * 0.04)
        p.text('IN TUNE', centerX, arcCenterY + radius + minDim * 0.08)
      } else if (currentNote) {
        p.fill(150)
        p.textSize(minDim * 0.035)
        const centsText = currentCents > 0 ? `+${Math.round(currentCents)}¢` : `${Math.round(currentCents)}¢`
        p.text(centsText, centerX, arcCenterY + radius + minDim * 0.08)
      }
    }
    
    p.windowResized = () => {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight)
    }
  }
  
  // Create p5 instance
  new P5(sketch)
  
  // Listen for pitch events
  context.pitchNode.port.onmessage = (event: any) => {
    if (event.data.type === "pitch" && event.data.pitch > 0) {
      currentPitch = event.data.pitch
      const result = getClosestNote(currentPitch)
      currentNote = result.note
      targetCents = result.cents
      currentCents = result.cents
    } else {
      // Gradually reset when no pitch
      targetCents *= 0.95
      if (Math.abs(targetCents) < 0.1) {
        currentNote = ''
        currentPitch = 0
        currentCents = 0
      }
    }
  }
}
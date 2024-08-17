import styles from './fretboard.module.scss'
import React from "react"
import * as d3 from "d3";
import _ from 'lodash';

const STANDARD_TUNING: { [key: number]: number } = { [-2]: 1, [-1]: 1, 0: 1, 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }

// there are 22 frets which cover 6 strings,
// draw 22*5 rectangles which have 1:2 aspect ratio.
const FRET = _.range(0, 22)
const STRING = _.range(0, 6)

const note = (fret: number, string: number): number => {
  return (fret - (string * 5))
}

interface StateProps {
  shift: number
  latestNote: number | null
}

interface CallbackProps { }

type Props = StateProps & CallbackProps

export const Fretboard = (props: Props) => {
  const svgRef = React.useRef<SVGSVGElement>(null)

  const fretboardPosition = (d: { string: number, fret: number }): [number, number] => {
    return [d.fret * 100 - 50 + STANDARD_TUNING[d.string] * 100, d.string * 50]
  }

  React.useEffect(() => {
    if (svgRef.current === null) return

    const svg = d3.select(svgRef.current)

    d3.selectAll("svg > *").remove();

    // whole, whole, half, whole, whole, whole, half
    const majorScale = [0, 2, 4, 5, 7, 9, 11, 12]
    const MODE: { [key: number]: number } = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7, 12: 1 }
    const INTERVAL_COLORS_MAJOR: { [key: number]: string } = { 1: "rgb(229,107,26)", 2: "rgb(35,100,160)", 3: "rgb(44,140,107)", 4: "rgba(128,128,128)", 5: "rgb(232,224,73)", 6: "rgb(35,100,160)", 7: "rgba(128,128,128)" }

    const scaleNotes = d3.cross(_.range(-12, 24), STRING).map(([fret, string]) => {
      return { fret: fret, string: string }
    }).filter(({ fret, string }) => majorScale.includes(note(fret, string).mod(12)))

    const rootNotes = d3.cross(_.range(-12, 24), _.range(-2, 6)).map(([fret, string]) => {
      return { fret: fret, string: string }
    }).filter(({ fret, string }) => note(fret, string) % 12 === 0)

    svg.on("click", (event) => {
      const [x, y] = d3.pointer(event);
      const fret = Math.round(x / 100)
      const string = Math.round(y / 50)
      alert([fret, string, note(fret, string)])
    })

    svg.append("g")
      .attr("class", "frets")
      .selectChildren().data(FRET).enter().append("line").attr("class", "fret")
      .attr("x1", (data) => data * 100)
      .attr("x2", (data) => data * 100)
      .attr("y1", 0)
      .attr("y2", 250)
      .style("stroke", "black")
      .style("stroke-width", (_, i) => i === 0 ? 10 : 1)

    svg.append("g")
      .attr("class", "strings")
      .selectChildren().data(STRING).enter().append("line").attr("class", "string")
      .attr("x1", 0)
      .attr("x2", 22 * 100)
      .attr("y1", (data) => data * 50)
      .attr("y2", (data) => data * 50)
      .style("stroke", "#222")
      .style("stroke-width", (_, i) => i + 1)

    const singleFretMarkers = _.without(_.range(2.5 * 100, 22 * 100, 200), 10.5 * 100, 12.5 * 100)
    const doubleFretMarkers = [11.5 * 100]

    svg.append("g")
      .attr("class", "fret-markers")
      .selectChildren().data(singleFretMarkers).enter().append("circle")
      .attr("r", 10)
      .attr("cx", (d) => d)
      .attr("cy", 125)
      .attr("fill", "#CCCCCC")
      .exit()
      .data(doubleFretMarkers).enter().append("circle")
      .attr("r", 10)
      .attr("cx", (d) => d)
      .attr("cy", 75)
      .attr("fill", "#CCCCCC")
      .exit()
      .data(doubleFretMarkers).enter().append("circle")
      .attr("r", 10)
      .attr("cx", (d) => d)
      .attr("cy", 175)
      .attr("fill", "#CCCCCC")

    const drawBlueRectangle = (d: { string: number, fret: number }): [number, number][] => {
      const [string, fret] = [d.string, d.fret]
      return [
        [string, fret],
        [string, fret + 2],
        [string + 1, fret + 2],
        [string + 2, fret + 2],
        [string + 2, fret],
        [string + 1, fret],
        [string, fret],
      ].map(([string, fret]) => fretboardPosition({ fret, string }))
    }

    const drawRedRectangle = (d: { string: number, fret: number }): [number, number][] => {
      const [string, fret] = [d.string, d.fret]
      return [
        [string, fret],
        [string + 1, fret],
        [string + 1, fret - 3],
        [string, fret - 3],
        [string, fret],
      ].map(([string, fret]) => fretboardPosition({ fret, string }))
    }

    const scalegroup = svg.append("g").attr("class", "scale-group")

    scalegroup.append("g").attr("class", "blueboxes")
      .selectChildren().data(rootNotes).enter().append("path")
      .attr("d", (d) => d3.line()(drawBlueRectangle(d)))
      .attr("fill", "none")
      .style("stroke", "blue")
      .style("stroke-width", "5")

    scalegroup.append("g").attr("class", "redboxes")
      .selectChildren().data(rootNotes).enter().append("path")
      .attr("d", (d) => d3.line()(drawRedRectangle(d)))
      .attr("fill", "none")
      .style("stroke", "red")
      .style("stroke-width", "5")

    const scalenotes = scalegroup.append("g").attr("class", "scale-notes")
      .selectChildren().data(scaleNotes).enter()
      .append("g")

    scalenotes
      .append("circle")
      .attr("r", 15)
      .attr("fill", (d) => INTERVAL_COLORS_MAJOR[MODE[note(d.fret, d.string).mod(12)]])

    scalenotes
      .append("text")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d) => MODE[note(d.fret, d.string).mod(12)])

    scalenotes.attr("transform", (d) => {
      const [x, y] = fretboardPosition(d)
      return `translate(${x},${y})`
    })

    svg.append("g").attr("id", "current-notes")

  }, [svgRef])

  React.useEffect(() => {
    if (svgRef.current === null) return
    const svg = d3.select(svgRef.current)
    const scalegroup = svg.select(".scale-group")

    scalegroup.attr("transform", `translate(${props.shift * 100},0)`)

  }, [props.shift])

  React.useEffect(() => {
    if (svgRef.current === null) return
    if (props.latestNote == null) return
    const svg = d3.select(svgRef.current)

    const currentNotes = d3.cross(FRET, STRING).map(([fret, string]) => {
      return { fret: fret, string: string }
    }).filter(({ fret, string }) => {
      return note(fret, string) === props.latestNote
    }).map((d) => fretboardPosition(d))

    const currentnotes = svg.select("#current-notes")
    currentnotes.selectAll("circle")
      .data(currentNotes)
      .join("circle")
      .attr("r", 15)
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("fill", "black")
      .attr("opacity", 0.8)
      .attr("stroke", "green")

  }, [props.latestNote])

  // there are 22 frets for each string and 5 strings
  return (
    <div className={styles.fretboard}>
      <svg ref={svgRef} style={{ padding: "0%" }} viewBox='0,0,2200,250' preserveAspectRatio='none' overflow="visible">
      </svg>
    </div>
  )
}

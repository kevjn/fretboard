import React from "react";
import { Note } from "./App";

export const NoteHistory = (props: {note: Note | null, octave: number | null }) => {

  const [history, setHistory] = React.useState<Note[]>([])

  React.useEffect(() => {
    setHistory((prevState) => {
      if (props.note) {
        prevState.push(props.note)
      }
      if (prevState.length > 10) {
        prevState.shift()
      }
      return prevState
    })
  }, [props.note])

  if (!props.note) {
    return <></>
 }

  return (
    <div style={{display: "flex", flexDirection: "row", alignItems: "baseline", fontFamily: "monospace"}}>
      <div style={{ flex: 1, textAlign: "right"}}>
        <p>{history.join(", ")}</p>
      </div>
      <div style={{width: "100px", display: "inline-block"}}>
        <h1>{props.note}<sub>{props.octave}</sub></h1>
      </div>
      <div style={{flex: 1}}></div>
    </div>
  )
}
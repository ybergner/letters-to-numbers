import { useEffect, useState } from 'react'
import './App.css'
import { Game } from './game/game'
import { COLORS, ColorType, SessionEndData } from './shared'

export const SessionLocalItem = "sessionData"
export interface LocalStorageInfo {
  sessionId:string,
  color:string
}
const MAX_PLAYER_COUNT = 4;
function App() {

  const [selectedMode, setSelectedMode] = useState<number|undefined>(undefined)
  const [selectedColor, setSelectedColor] = useState<ColorType|undefined>(undefined)
  const [exitData, setExitData] = useState<SessionEndData|undefined>(undefined)

  const getSessionEndTest = ():string => {
    if(exitData?.reason === 'inprogress')return 'Session already in progress'
    else if(exitData?.reason === 'playerdisconnect')return 'You got disconnected from the server'
    else if(exitData?.reason === 'sucess')return 'You have solved it! Good job'
    else if(exitData?.reason === 'time')return 'You ran out of time'
    else if(exitData?.reason === 'trycount')return 'You ran out of tries'
    else if(exitData?.reason === "wrongcolor")return `Color already selected by another player`
    else if(exitData?.reason === "connecterror") return "Error connecting to the session"
    else if(exitData?.reason === "sessionnolongerexists")return "Session no longer exists"
    return 'Unkown'
  }

  useEffect(() => {
    const localStorageItem = window.localStorage.getItem(SessionLocalItem)
    if(localStorageItem === null)return;
    const parsedJson = JSON.parse(localStorageItem) as LocalStorageInfo
    setSelectedColor(parsedJson.color as ColorType)
    setSelectedMode(1);
  })

  return (
    (selectedMode !== undefined && selectedColor !== undefined)?
    <Game playerCount={selectedMode} color={selectedColor} onExit={(e) => {
      setExitData(e)
      setSelectedMode(undefined)
    }}/>:

    <div id="choose">
      <h1>Select color</h1>
      <div id="choose-color">
        {
          COLORS.map(color => 
          <div 
            style={{backgroundColor: `var(--color-${color})`}} 
            key={color} 
            className={selectedColor === color? "selected" : undefined}
            onClick={() => setSelectedColor(color === selectedColor? undefined : color)}></div>)
        }
      </div>
      <h1>Player Count</h1>
      <div id="choose-mode" data-enabled={selectedColor !== undefined}>
        {
          COLORS.map((_, index) => {

            return <span key={index} onClick={() => setSelectedMode(index+1)} style={{backgroundColor: selectedColor == undefined? "gray" : `var(--color-${selectedColor})`}}><span>{index+1}</span></span>
          })
        }
      </div>
      {
        exitData &&
        <div id="exitinfo">
          <p id="exitinfo-reason">{getSessionEndTest()}</p>
          {
            exitData?.sessionId &&
            <p id="exitinfo-sessionid">Session ID: <span style={{color: `var(--color-${selectedColor ?? "red"})`}}>{exitData.sessionId}</span></p>
          }
        </div>
      }
    </div>
  )
}

export default App

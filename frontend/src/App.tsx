import { useState } from 'react'
import './App.css'
import { Button } from './components/button/button'
import { Game } from './game/game'
import { COLORS, ColorType, SessionEndData } from './shared'

function App() {
  const [selectedMode, setSelectedMode] = useState<"singleplayer"|"multiplayer"|undefined>(undefined)
  const [selectedColor, setSelectedColor] = useState<ColorType|undefined>(undefined)
  const [exitData, setExitData] = useState<SessionEndData|undefined>(undefined)

  const getSessionEndTest = ():string => {
    if(exitData?.reason === 'inprogress')return 'Session already in progress'
    else if(exitData?.reason === 'playerdisconnect')return 'You got disconnected from the server'
    else if(exitData?.reason === 'sucess')return 'You have solved it! Good job'
    else if(exitData?.reason === 'time')return 'You ran out of time'
    else if(exitData?.reason === 'trycount')return 'You ran out of tries'
    else if(exitData?.reason === "wrongcolor")return `Color already selected by another player`
    return 'Unkown'
  }

  return (
    (selectedMode !== undefined && selectedColor !== undefined)?
    <Game mode={selectedMode} color={selectedColor} onExit={(e) => {
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
      <h1>Play</h1>
      <div id="choose-mode" data-enabled={selectedColor !== undefined}>
        <Button text='Singleplayer' onClick={() => setSelectedMode('singleplayer')}/>
        <Button text='Multiplayer' onClick={() => setSelectedMode('multiplayer')} id="mode-multiplayer"/>
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
import { ReactNode, useEffect, useState } from 'react'
import './App.css'
import { Game } from './game/game'
import { COLORS, ColorType, SessionEndData, SessionEndReason } from './shared'
import { Button } from './components/button/button'
import {Component} from 'react'

export const ISDEV = process.env.NODE_ENV === "development"
console.log("ISDEV", ISDEV)
export const SessionLocalItem = "sessionData"
export interface LocalStorageInfo {
  sessionId:string,
  color:ColorType
}

type AppState = {
  selectedPlayerCount?:number, 
  selectedColor?:ColorType, 
  shouldBeInGame:boolean, 
  exitData?:SessionEndData
}
export default class App extends Component<any, AppState> {
  constructor(props:any){
    super(props)

    const localStorageItem = window.localStorage.getItem(SessionLocalItem)
    if(localStorageItem != null){
      const parsedJson = JSON.parse(localStorageItem) as LocalStorageInfo
      this.state = {
        selectedColor: parsedJson.color,
        selectedPlayerCount: 1,
        shouldBeInGame: true
      } 
      return;
    }

    this.state = {
      shouldBeInGame: false
    }
  }

  render(): ReactNode {
    if(this.state.shouldBeInGame && this.state.selectedPlayerCount !== undefined && this.state.selectedColor !== undefined){
      return <Game playerCount={this.state.selectedPlayerCount} color={this.state.selectedColor} onExit={(e) => {
        this.setState({
          shouldBeInGame: false,
          exitData: e
        })
      }}/>
    }
    const canProceed = this.state.selectedColor !== undefined && this.state.selectedPlayerCount !== undefined
    return <div id="choose">
        <h1>Select color</h1>
        <div id="choose-color">
          {
            COLORS.map(color => 
            <div 
              style={{backgroundColor: `var(--color-${color})`}} 
              key={color} 
              className={this.state.selectedColor === color? "selected" : undefined}
              onClick={() => this.setState({selectedColor: color === this.state.selectedColor? undefined : color})}></div>)
          }
        </div>
        <h1>Player Count</h1>
        <div id="choose-mode" data-enabled={this.state.selectedColor !== undefined}>
          {
            COLORS.map((_, index) => {

              return <span key={index} onClick={() => {
                const newVal = index+1
                this.setState({selectedPlayerCount: newVal === this.state.selectedPlayerCount? undefined : newVal})
              }} style={{backgroundColor: canProceed? `var(--color-${this.state.selectedColor})`: "gray"}} className={this.state.selectedPlayerCount === index+1? "selected" : undefined}>
                <span>{index+1}</span>
              </span>
            })
          }
        </div>
        <Button text='Connect' style={{backgroundColor: canProceed? `var(--color-${this.state.selectedColor})` : "gray"}} className={canProceed? "enabled" : "disabled"} onClick={() => this.setState({shouldBeInGame: true})}/>
        {
          this.state.exitData &&
          <div id="exitinfo">
            <p id="exitinfo-reason">{getSessionEndText(this.state.exitData.reason)}</p>
            {
              this.state.exitData?.sessionId &&
              <p id="exitinfo-sessionid">Session ID: <span style={{color: `var(--color-${this.state.selectedColor ?? "red"})`}}>{this.state.exitData.sessionId}</span></p>
            }
          </div>
        }
    </div>
  }
  
}

function getSessionEndText(reason:SessionEndReason){
  if(reason === 'inprogress')return 'Session already in progress'
  else if(reason === 'playerdisconnect')return 'You got disconnected from the server'
  else if(reason === 'sucess')return 'You have solved it! Good job'
  else if(reason === 'time')return 'You ran out of time'
  else if(reason === 'trycount')return 'You ran out of tries'
  else if(reason === "wrongcolor")return `Color already selected by another player`
  else if(reason === "connecterror") return "Error connecting to the session"
  else if(reason === "sessionnolongerexists")return "Session no longer exists"
  else if(reason === "youleft")return "You left the game"
  return 'Unkown'
}
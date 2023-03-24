import ws from "ws";
import { GAME_START_TIME } from "./consts";
import { endSession, GameSession, onMessage, sessionSendAll, startSessionTimer } from "./session";
import { GameStep, InitSession, SessionEndData } from "./shared";
import { v4 as uuidv4 } from 'uuid';
import { SessionPlayer } from "./sessionPlayer";

export function generateSessionResultLocalWtf():number[]{
    let numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let initialLength = numbers.length
    let resultArray:number[] = []
    for(let i = 0; i < initialLength; i++){
        let index = Math.floor(Math.random() * numbers.length);
        resultArray.push(numbers[index])
        numbers.splice(index, 1)
    }

    return resultArray
}

export const currentMutliplayerSession:GameSession = {
    finished:false,
    id: uuidv4(),
    players: [],
    resultInput: {
        A: undefined,
        B: undefined,
        C: undefined,
        D: undefined,
        E: undefined,
        F: undefined,
        G: undefined,
        H: undefined,
        I: undefined,
        J: undefined
    },
    results: generateSessionResultLocalWtf(),
    sessionTimer: GAME_START_TIME,
    testTries: [],
    internvalId: undefined,
    currentTextInput: '',
    gameStep: GameStep.PlayersConnecting,
    mode: "multiplayer"
}

export function handleMultiplayer(connection:ws.WebSocket, color:string){
    if(currentMutliplayerSession.gameStep !== GameStep.PlayersConnecting){
        let reason: SessionEndData = {
            reason: 'inprogress',
            sessionId: currentMutliplayerSession.id
        }
        return connection.close(1000, JSON.stringify(reason))
    }
    //somebody has the same color
    if(currentMutliplayerSession.players.findIndex(player => player.color === color) !== -1){
        let reason: SessionEndData = {
            reason: 'wrongcolor',
            sessionId: currentMutliplayerSession.id
        }
        return connection.close(1000, JSON.stringify(reason))
    }
    const newPlayer : SessionPlayer = {
        color: color,
        hasAccepted: false,
        socket: connection
    }
    currentMutliplayerSession.players.push(newPlayer)

    const hasEnoughPlayersToStart = currentMutliplayerSession.players.length >= 3
    currentMutliplayerSession.gameStep = hasEnoughPlayersToStart? GameStep.Equation : GameStep.PlayersConnecting
    const sessionInitData : InitSession = {
        gameStep: currentMutliplayerSession.gameStep,
        id: currentMutliplayerSession.id,
        testTries: currentMutliplayerSession.testTries,
        timer: currentMutliplayerSession.sessionTimer
    }
    connection.send(JSON.stringify({
        type: 'sessionInit',
        color: newPlayer.color,
        session: sessionInitData
        
    }))
    sessionSendAll(currentMutliplayerSession, {
        type: 'connectedColors',
        colors: currentMutliplayerSession.players.map(pl => pl.color)
    })
    //start the session
    if(hasEnoughPlayersToStart){
        currentMutliplayerSession.players.filter(pl => pl !== newPlayer).forEach(player => player.socket.send(JSON.stringify({
            type: 'sessionInit',
            color: player.color,
            session: sessionInitData
        })))
        startSessionTimer(currentMutliplayerSession)
        console.log("starting session")
    }
    connection.onmessage = e => onMessage(e, currentMutliplayerSession)
    connection.onclose = () => {
        
        if(currentMutliplayerSession.gameStep === GameStep.PlayersConnecting){
            const playerIndex = currentMutliplayerSession.players.indexOf(newPlayer)
            if(playerIndex !== -1){
                currentMutliplayerSession.players.splice(playerIndex, 1)
            }
            sessionSendAll(currentMutliplayerSession, {
                type: 'connectedColors',
                colors: currentMutliplayerSession.players.map(pl => pl.color)
            })
            return;
        }
        endSession(currentMutliplayerSession, 'playerdisconnect')
    }
}
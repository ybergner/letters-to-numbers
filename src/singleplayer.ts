import ws from 'ws'
import { v4 as uuidv4 } from 'uuid';
import { endSession, GameSession, generateSessionResult, onMessage, startSessionTimer } from './session';
import { GAME_START_TIME } from './consts';
import { COLORS, GameStep, InitSession } from './shared';

const sessionMap : Map<ws.WebSocket, GameSession> = new Map()

export function handleSinglePlayer(connection:ws.WebSocket, color:string){
    const sessionId = uuidv4()
    console.log("creating new singleplayer session", sessionId)
    connection.onclose = () => {
        let session = sessionMap.get(connection)
        if(session === undefined)return;

        sessionMap.delete(connection)
        if(!session.finished){
            endSession(session, 'playerdisconnect')
            console.log("singlepalyer session closed before finishing", session.id)
            return;
        }
    }
    
    const playerColor = color
    const newSession : GameSession = {
        finished:false,
        id: sessionId,
        players: [{
            color: playerColor,
            hasAccepted: false,
            socket: connection
        }],
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
        results: generateSessionResult(),
        sessionTimer: GAME_START_TIME,
        testTries: [],
        //internvalId: undefined,
        currentTextInput: '',
        gameStep: GameStep.Equation,
        maxPlayers: 1
    }
    startSessionTimer(newSession)
    sessionMap.set(connection, newSession)

    const initSessionData : InitSession = {
        id: newSession.id,
        timer: newSession.sessionTimer,
        testTries: newSession.testTries,
        gameStep: newSession.gameStep
    }
    connection.send(JSON.stringify(
        {
            type: 'sessionInit',
            session: initSessionData,
            color: playerColor
        }
    ))
    connection.onmessage = e => onMessage(e, newSession)
}
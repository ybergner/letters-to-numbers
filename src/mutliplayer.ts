import ws from "ws";
import { GAME_START_TIME } from "./consts";
import { endSession, GameSession, onMessage, sessionSendAll, startSessionTimer } from "./session";
import { GameStep, InitSession, SessionEndData } from "./shared";
import { v4 as uuidv4 } from 'uuid';
import { SessionPlayer } from "./sessionPlayer";
import { isUndefined } from "util";


export function handleMultiplayer(connection:ws.WebSocket, color:string){
    
}
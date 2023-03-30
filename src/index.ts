import http from 'http'
import express from 'express'
import ws from 'ws'
import path from 'path'
import { COLORS, ColorType, GameStep, SessionEndData, SessionEndReason } from './shared';
import { GameSession, handlePlayerConnect, generateNewSession } from './session';


export const sessionMap : Map<string, GameSession> = new Map()

const app = express();

// Set up your express app as normal

const server = http.createServer(app);

// Set up your WebSocket server
const wss = new ws.Server({ server });

function endReasonString(reason:SessionEndReason, id?:string) {
  const endData:SessionEndData = {
    reason: reason,
    sessionId: id ?? "Not found"
  }
  return JSON.stringify(endData)
}

wss.on('connection', (ws, req) => {
  let split = req.url?.split('/')
  if(split === undefined){
    return ws.close(1000, endReasonString("connecterror", undefined))
  }

  if(split[1] !== "connect" && split[1] != "reconnect"){
    return ws.close(1000, endReasonString("connecterror", undefined))
  }
  const color = split[3] as ColorType
  if(COLORS.indexOf(color) === -1){
    return ws.close(1000, endReasonString("connecterror", undefined))
  }
  const mode = split[1]
  
  if(mode === 'connect'){
    const playerCount = parseInt(split[2])
    if(isNaN(playerCount) || playerCount <= 0 || playerCount > COLORS.length){
      return ws.close(1000, endReasonString("connecterror", undefined))
    }
    let session:GameSession|undefined = undefined

    for(let entry of sessionMap){
      if(entry[1].gameStep === GameStep.PlayersConnecting && entry[1].maxPlayers === playerCount){
        session = entry[1]
        break;
      }
    }
    session ??= generateNewSession(playerCount)
    handlePlayerConnect(session, ws, color)
  }
  //reconnect
  else{
    const sessionId = split[2]
    const session = sessionMap.get(sessionId)
    if(session === undefined){
      return ws.close(1000, endReasonString("sessionnolongerexists", sessionId))
    }
    handlePlayerConnect(session, ws, color)
  }
});
const appPath = process.cwd()
app.get('/', (_, res) => {
  res.sendFile(path.join(appPath, "index.html"))
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
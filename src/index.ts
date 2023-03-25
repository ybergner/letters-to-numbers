import http from 'http'
import express from 'express'
import ws from 'ws'
import { handleSinglePlayer } from './singleplayer';
import { COLORS } from './shared';
import { handleMultiplayer } from './mutliplayer';
import path from 'path'

const app = express();

// Set up your express app as normal

const server = http.createServer(app);

// Set up your WebSocket server
const wss = new ws.Server({ server });

function findInArray<T>(array:T[], seachFor:T[]) : T | undefined{
  for(let element of array){
    if(seachFor.indexOf(element) === -1)continue;

    return element;
  }

  return undefined;
}

wss.on('connection', (ws, req) => {
  let split = req.url?.split('/')
  if(split === undefined){
    return ws.close(1000, "Wrong websocket path")
  }
  let mode = findInArray(split, ["singleplayer", "multiplayer"])
  if(mode === undefined)
    return ws.close(1000, "Wrong websocket path")
  
  let color = findInArray(split, COLORS)
  if(color === undefined)
    return ws.close(1000, "Wrong websocket path")

  if(mode === "singleplayer"){
    return handleSinglePlayer(ws, color);
  }
  else if(mode === "multiplayer"){
    return handleMultiplayer(ws, color);
  }
  ws.close(1000, "Wrong websocket path")
});
const appPath = process.cwd()
app.get('/', (_, res) => {
  res.sendFile(path.join(appPath, "index.html"))
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
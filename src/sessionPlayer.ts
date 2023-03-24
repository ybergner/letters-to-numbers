import ws from 'ws'
export interface SessionPlayer{
    socket: ws.WebSocket,
    color: string,
    hasAccepted:boolean
}

export function sendPlayer(player:SessionPlayer, data:any){
    player.socket.send(JSON.stringify(data))
}
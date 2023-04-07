import { GameSession } from "./session";
import { GameStep, SessionEndReason, TestTry } from "./shared";
import fs, { mkdir } from 'fs'
import path from 'path'

interface SessionLog{
    results:number[],
    tries:TestTry[],
    endReason:SessionEndReason,
    endTimer:number,
    sessionId:string,
    endedOnStep:GameStep,
    time: Date
}
function mkDirFunc(dir:string){
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

const appPath = process.cwd()
export const logsFolder = path.join(appPath, "logs")
console.log('Logs folder', logsFolder)
mkDirFunc(logsFolder)

export function logSession(session:GameSession, endReason:SessionEndReason){
    const nowDate = new Date();
    const log:SessionLog = {
        endedOnStep: session.gameStep,
        endTimer: session.sessionTimer,
        endReason: endReason,
        results: session.results,
        sessionId: session.id,
        tries: session.testTries,
        time: nowDate
    }
    const currentDayDir = `${nowDate.getFullYear()}-${nowDate.getMonth()}-${nowDate.getDay()}`
    const fileDir =  path.join(logsFolder, currentDayDir)
    mkDirFunc(fileDir)
    const filePath = path.join(fileDir, `${log.sessionId}.json`)
    fs.writeFile(filePath, JSON.stringify(log), function(){})
    console.log(`Session: ${log.sessionId} logged`)
}

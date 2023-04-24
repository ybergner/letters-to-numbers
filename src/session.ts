import ws from 'ws'
import { logSession } from './sessionLoggin'
import { sendPlayer, SessionPlayer } from './sessionPlayer'
import { v4 as uuidv4 } from 'uuid';
import { ALL_LETTERS, ALL_NUMBERS, ColorType, GameStep, InitSession, ResultInputType, SessionEndData, SessionEndReason, TestTry } from './shared'
import { sessionMap } from './index';

export var CLEAR_SOLUTIONS = false

export interface GameSession{
    results:number[],
    testTries:TestTry[]
    sessionTimer:number
    //internvalId:NodeJS.Timeout|undefined,
    finished:boolean,
    id:string,
    players:SessionPlayer[],
    currentTextInput:string,
    resultInput:ResultInputType,
    gameStep:GameStep,
    maxPlayers:number,
    started:Date,
    logs: any[]
}

export function sessionSendAll(session:GameSession, data:any){
    const json = JSON.stringify(data)
    session.players.forEach(player => player.socket?.send(json))
}

function getLetterNumber(letter:string, session:GameSession){
    const index = ALL_LETTERS.indexOf(letter)
    if(index === -1)return -1;
    return session.results[index]
}

function getNumberLetter(n:number, session:GameSession){
    let index = session.results.indexOf(n)
    if(index === -1)return '?'

    return ALL_LETTERS[index]
}

export function generateNewSession(maxPlayers:number){
    const newSession : GameSession = {
        currentTextInput: '',
        finished: false,
        gameStep: GameStep.PlayersConnecting,
        id: uuidv4(),
        maxPlayers: maxPlayers,
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
        results: generateSessionResult(),
        sessionTimer: 1,
        testTries: [],
        started: new Date(),
        logs: []
    }
    sessionMap.set(newSession.id, newSession)
    return newSession
}

export function handlePlayerConnect(session:GameSession, connection:ws.WebSocket, color:ColorType){
    //reconnect
    let player:SessionPlayer|undefined = undefined
    if(session.gameStep !== GameStep.PlayersConnecting){
        const colorPlayerIndex = session.players.findIndex(x => x.color === color)
        if(colorPlayerIndex === -1){
            let reason: SessionEndData = {
                reason: 'sessionnolongerexists',
                sessionId: session.id
            }
            return connection.close(1000, JSON.stringify(reason))
        }
        player = session.players[colorPlayerIndex]
        if(player.socket !== undefined){
            let reason: SessionEndData = {
                reason: 'wrongcolor',
                sessionId: session.id
            }
            return connection.close(1000, JSON.stringify(reason))
        }
        player.socket = connection;
    }
    //connect
    else{
        //somebody has the same color
        if(session.players.findIndex(player => player.color === color) !== -1){
            let reason: SessionEndData = {
                reason: 'wrongcolor',
                sessionId: session.id
            }
            return connection.close(1000, JSON.stringify(reason))
        }
        player = {
            color: color,
            hasAccepted: false,
            socket: connection
        }
        session.players.push(player)

        const hasEnoughPlayersToStart = session.players.length >= session.maxPlayers
        session.gameStep = hasEnoughPlayersToStart? GameStep.Equation : GameStep.PlayersConnecting

        //start the session
        if(hasEnoughPlayersToStart){
            session.players.filter(pl => pl !== player).forEach(p => p.socket?.send(JSON.stringify({
                type: 'sessionInit',
                color: p.color,
                session: {
                    gameStep: session.gameStep,
                    id: session.id,
                    testTries: session.testTries,
                    timer: session.sessionTimer
                }
            })))
            startSessionTimer(session)
        }
    }

    const sessionInitData : InitSession = {
        gameStep: session.gameStep,
        id: session.id,
        testTries: session.testTries,
        timer: session.sessionTimer
    }
    connection.send(JSON.stringify({
        type: 'sessionInit',
        color: player.color,
        session: sessionInitData
        
    }))
    sessionSendAll(session, {
        type: 'connectedColors',
        colors: session.players.map(pl => pl.color)
    })
    connection.onmessage = e => onMessage(e, session)
    connection.onclose = () => {
        if(session.gameStep === GameStep.PlayersConnecting){
            const playerIndex = session.players.indexOf(player!)
            if(playerIndex !== -1){
                session.players.splice(playerIndex, 1)
            }
            sessionSendAll(session, {
                type: 'connectedColors',
                colors: session.players.map(pl => pl.color)
            })
            return;
        }
        console.log("Player disconnect", player!.color, session.id)
        player!.socket = undefined
        //game in progress
        if(session.players.filter(x=> x.socket !== undefined).length === 0){
            console.log("Ending session all players disconnected", session.id)
            endSession(session, 'playerdisconnect')
        }
    }
}

export function generateSessionResult():number[]{
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

export function onMessage(e:ws.MessageEvent, session:GameSession){
    let player:SessionPlayer|undefined = undefined
    for(let p of session.players)
    {
        if(p.socket !== e.target)continue;

        player = p;
        break;
    }
    if(!player){
        return console.log("Could not find player but got message?")
    }
    try{
        const str = e.data.toString()
        if(str === 'ping')return;
        const data = JSON.parse(str)
        const type = data.type
        if(type === "inputUpdate"){
            session.players.forEach(player => player.hasAccepted = false)
            session.currentTextInput = data.text ?? ""
            session.players.forEach(player => {
                if(player.socket === e.target){
                    return;
                }
                sendPlayer(player, {
                    type: type,
                    text: session.currentTextInput
                })
            })
            session.logs.push({
                type: "text",
                step: session.gameStep,
                newValue: session.currentTextInput,
                playerColor: player.color,
                timestamp: new Date()
            })
        }
        else if(type === "updateResultInput"){
            const letter = (data.letter as string).toUpperCase();
            (session.resultInput as any)[letter] = data.value
            sessionSendAll(session, {
                type,
                letter,
                value: data.value
            })
            session.logs.push({
                type: "letter",
                letter,
                value: data.value,
                playerColor: player.color,
                timestamp: new Date()
            })
            session.players.forEach(pl => pl.hasAccepted = false)
        }
        else if(type === "acceptInput")return acceptInput(session, player)
    }catch(e){
        console.error(e)
    }
}

export function endSession(session:GameSession, endSessionReason:SessionEndReason){
    if(session.finished)return;

    //clearTimeout(session.internvalId)
    
    if(endSessionReason !== 'playerdisconnect')
    {
        logSession(session, endSessionReason)
    }

    const closeReason:SessionEndData = {
        reason: endSessionReason,
        sessionId: session.id
    }
    const endJson = JSON.stringify(closeReason)
    session.players.forEach(player => {
        player.socket?.close(1000, endJson)
    })
    sessionMap.delete(session.id)
}

export function startSessionTimer(session:GameSession){
    /*session.internvalId = setInterval(() => {
        session.sessionTimer -= 1
        if(session.sessionTimer <= 0){
            endSession(session, 'time')
        }
    }, 1000);*/
}


function acceptInput(session:GameSession, player: SessionPlayer){
    if(player.hasAccepted)
        return;
    
    player.hasAccepted = true;
    let acceptedColors:string[] = session.players.filter(x => x.hasAccepted).map(pl => pl.color);
    session.logs.push({
        type: "accept",
        step: session.gameStep,
        playerColor: player.color,
        timestamp: new Date(),
        acceptedColors
    })
    if(acceptedColors.length < session.players.length){
        sessionSendAll(session, {
            type: 'setAccepted',
            colors: acceptedColors
        })
        return;
    }
        
    session.players.forEach(pl => pl.hasAccepted = false)
    let inputText = session.currentTextInput.toUpperCase()
    if(session.gameStep === GameStep.Equation){
        inputText = puriftyString(inputText, ALL_LETTERS + "-+")
        let badFormat = false;
        let numberStr = ''
        let numbers:string[] = []
        let operations:string[] = []
        let position = -1
        for(let char of inputText){
            position++
            let isLast = position+1 >= inputText.length
            let isOperationChar = char === '-' || char === '+' 
            if(isOperationChar || isLast){
                if(!isOperationChar){
                    numberStr += char
                }
                if(numberStr.length === 0){
                    badFormat = true;
                    break;
                }
                if(!isLast){
                    operations.push(char)
                }
                numbers.push(numberStr)
                numberStr = ''
            }
            else numberStr += char
        }
        
        if(numbers.length < 2 || operations.length < 1 || (numbers.length-operations.length) !== 1 )badFormat = true;
        
        if(badFormat){
            return sessionSendAll(session, {
                type: 'badFormat',
                alert: 'There is a problem with the syntax of the equation. Please try again'
            })
        }

        let convertedNumbers:number[] = []
        for(let numbStr of numbers){
            let finalStr = ''
            for(let char of numbStr){
                finalStr += getLetterNumber(char, session)
            }
            convertedNumbers.push(parseInt(finalStr))
        }
        let currentResult = convertedNumbers[0]
        for(let i = 0; i < operations.length; i++){
            let num = convertedNumbers[i+1]
            if(operations[i] === '-')currentResult -= num
            else currentResult += num
        }
        let resultStr = currentResult.toString()
        let equationStr = currentResult < 0? '-' : ''
        console.log(resultStr)
        for(let char of resultStr){
            if(char == '-')continue;
            equationStr += getNumberLetter(parseInt(char), session)
        }
        session.testTries.push({
            equation: inputText + "=" + equationStr,
            feedback: undefined,
            hypothesis: undefined
        })
        session.gameStep = GameStep.Hypothesis
        sessionSendAll(session, {
            type: 'setGameStep',
            gameStep: session.gameStep
        })
        sessionSendAll(session, {
            type: 'updateResults',
            resultArray: session.testTries
        })
    }
    else if(session.gameStep === GameStep.Hypothesis){
        inputText = puriftyString(inputText, ALL_LETTERS + ALL_NUMBERS + '=')
        if(inputText.length !== 3 || inputText[1] !== '=' || isNaN(parseInt(inputText[2])) || ALL_LETTERS.indexOf(inputText[0]) === -1){
            return sessionSendAll(session, {
                type: 'badFormat',
                alert: 'There is a problem with the syntax of the hypothesis. It must be a single formula of the form [Letter] = [Number]. Please try again'
            })
        }
        const number = parseInt(inputText[2])
        const letter = inputText[0]


        session.testTries[session.testTries.length-1].hypothesis = inputText
        session.testTries[session.testTries.length-1].feedback = getLetterNumber(letter, session) === number
        sessionSendAll(session, {
            type: 'updateResults',
            resultArray: session.testTries
        })
        session.gameStep = GameStep.Result
        sessionSendAll(session, {
            type: 'setGameStep',
            gameStep: session.gameStep
        })
    }
    else if(session.gameStep === GameStep.Result){
        const inputValues = Object.values(session.resultInput)
        if(inputValues.indexOf(undefined) !== -1){
            return sessionSendAll(session, {
                type: 'badFormat',
                alert: 'You must fill in all the solution numbers. Please try again.'
            })
        }
        let isSame = true;
        for(let i = 0; i < session.results.length && i < inputValues.length; i++){
            if(session.results[i] != inputValues[i]){
                isSame = false;
                break;
            }
        }
        if(!isSame){
            if(session.testTries.length === 10){
                return endSession(session, "trycount")
            }
            session.gameStep = GameStep.Equation
            if(CLEAR_SOLUTIONS){
                session.resultInput = {
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
                }
                Object.keys(session.resultInput).forEach(letter => {
                    sessionSendAll(session, {
                        type: "updateResultInput",
                        letter,
                        value: undefined
                    })
                })
            }
            sessionSendAll(session, {
                type: 'setGameStep',
                gameStep: session.gameStep
            })
            sessionSendAll(session, {
                type: 'badFormat',
                alert: 'The proposed solution is incorrect, please try again'
            })
        }
        if(isSame){
            endSession(session, "sucess")
        }
    }
}

function puriftyString(stringToPurify:string, purifier:string):string{

    let finalString = ''
    for(let char of stringToPurify){
        if(purifier.indexOf(char) === -1)continue;

        finalString += char
    }

    return finalString
}
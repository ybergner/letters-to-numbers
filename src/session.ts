import { clearTimeout } from 'timers'
import ws from 'ws'
import { currentMutliplayerSession } from './mutliplayer'
import { logSession } from './sessionLoggin'
import { sendPlayer, SessionPlayer } from './sessionPlayer'
import { v4 as uuidv4 } from 'uuid';
import { ALL_LETTERS, ALL_NUMBERS, GameStep, ResultInputType, SessionEndData, SessionEndReason, TestTry } from './shared'
import { GAME_START_TIME } from './consts'
export type SessionMode = "singleplayer"|"multiplayer"
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
    mode:SessionMode
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
        const data = JSON.parse(e.data.toString())
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
        }
        else if(type === "updateResultInput"){
            const letter = (data.letter as string).toUpperCase();
            (session.resultInput as any)[letter] = data.value
            sessionSendAll(session, {
                type,
                letter,
                value: data.value
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
    const isMultiplayerSession = session === currentMutliplayerSession
    if(isMultiplayerSession)
        session.finished = true

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
    
    if(isMultiplayerSession){
        currentMutliplayerSession.id = uuidv4()
        currentMutliplayerSession.results = generateSessionResult()
        currentMutliplayerSession.currentTextInput = ''
        currentMutliplayerSession.players = []
        currentMutliplayerSession.finished = false
        //currentMutliplayerSession.internvalId = undefined
        currentMutliplayerSession.gameStep = GameStep.PlayersConnecting
        currentMutliplayerSession.testTries = []
        currentMutliplayerSession.sessionTimer = GAME_START_TIME
    }
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
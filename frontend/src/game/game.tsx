import React from 'react'
import { ReactNode } from 'react'
import { Button } from '../components/button/button'
import { ResultTable } from '../components/resulttable/resulttable'
import { SharedState, SharedStateToken, useSharedState } from '../SharedState'
import './game.css'
import './inputbutton.css'
import './resultinput.css'
import { AcceptedDiv } from '../components/accepteddiv/accepteddiv'
import { ColorType, GameStep, InitSession, ResultInputNumber, ResultInputType, SessionEndData, TestTry } from '../shared'
import { SessionLocalItem } from '../App'

const PlayerColor = new SharedStateToken<string>("red")
export const PlayersThatAcceptedInput = new SharedStateToken<string[]>([])
const CurrentTextToken = new SharedStateToken<string>("")
const ResultInputToken = new SharedStateToken<ResultInputType>({
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
    })
const ALL_LETTERS = 'ABCDEFGHIJ'
const ALL_NUMBERS = '1234567890'
export class Game extends React.Component<{mode:"singleplayer"|"multiplayer", color: ColorType, onExit:(endData:SessionEndData)=>void}, {
    resultArray:TestTry[],
    connecting:boolean,
    timer:number,
    sessionId?:string,
    gameStep:GameStep,
    connectedColors:ColorType[],
    sessionStared:boolean
}>{
    //timerInternvalId?:any
    webSocket:WebSocket
    constructor(props:any){
        ResultInputToken.setValue({
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
        })
        CurrentTextToken.setValue('')
        PlayersThatAcceptedInput.setValue([])
        super(props)

        this.state = {
            resultArray: [],
            connecting: true,
            timer: 1,
            sessionId: undefined,
            gameStep: GameStep.Equation,
            connectedColors: [],
            sessionStared: false
        }
        this.webSocket = new WebSocket("ws://localhost:3000/" + this.props.mode + "/" + this.props.color)
        this.webSocket.onmessage = (e) => this.onMessage(e)
        this.webSocket.onclose = (e) => {
            if(e.code !== 1000){
                return this.props.onExit({
                    reason: 'playerdisconnect',
                    sessionId: this.state.sessionId
                })
            }
            window.localStorage.removeItem(SessionLocalItem)
            let reasonFromJson:SessionEndData = JSON.parse(e.reason)
            console.log(reasonFromJson)
            this.props.onExit(reasonFromJson)
        }
        SharedState.use(this, PlayerColor)
    }

    componentWillUnmount(): void {
        this.webSocket.close()
    }

    onMessage(e:MessageEvent<string>){
        const data = JSON.parse(e.data)
        const messageType = data.type
        if(messageType === "connectedColors"){
            this.setState({connectedColors: data.colors})
        }
        else if(messageType === "sessionInit"){
            console.log("Got init data")
            const sessionInitData = data.session as InitSession
            window.localStorage.setItem(SessionLocalItem, JSON.stringify({
                id: sessionInitData.id,
                color: data.color
            }))
            PlayerColor.setValue(data.color)
            this.setState({
                connecting: false,
                resultArray: sessionInitData.testTries,
                timer: sessionInitData.timer,
                sessionId: sessionInitData.id,
                gameStep: sessionInitData.gameStep,
                connectedColors: [],
                sessionStared: sessionInitData.gameStep !==  GameStep.PlayersConnecting
            })
            /*if(sessionInitData.gameStep !== GameStep.PlayersConnecting)
                this.timerInternvalId = setInterval(() => {
                    this.setState({timer: this.state.timer-1})
                }, 1000)*/
        }
        else if(messageType === "inputUpdate"){
            PlayersThatAcceptedInput.setValue([])
            const text:string = data.text ?? ""
            CurrentTextToken.setValue(text)
        }

        else if(messageType === "updateResultInput"){
            const letter = (data.letter as string).toUpperCase()
            const number = data.value as number | undefined
            (ResultInputToken.value as any)[letter] = number
            ResultInputToken.emitChange()
            PlayersThatAcceptedInput.setValue([])
        }

        else if(messageType === "updateResults"){
            console.log(data)
            this.setState({resultArray: data.resultArray})
        }

        else if(messageType === "setGameStep"){
            const gameStep:GameStep = data.gameStep
            this.setState({gameStep: gameStep})
            PlayersThatAcceptedInput.setValue([])
            CurrentTextToken.setValue("")
        }

        else if(messageType === "setAccepted"){
            PlayersThatAcceptedInput.setValue(data.colors)
        }
        else if(messageType === "alert"){
            alert(data.alert)
        }
        else if(messageType === "badFormat"){
            PlayersThatAcceptedInput.setValue([])
            alert(data.alert)
        }


        console.log(data)
    }

    updateInputButtonToServer(value:string){
        PlayersThatAcceptedInput.setValue([])
        this.webSocket.send(JSON.stringify({
            type: 'inputUpdate',
            text: value,
        }))
    }

    acceptInput(){
        console.log('acepting')
        if(PlayersThatAcceptedInput.value.indexOf(PlayerColor.value) !== -1)return alert("Already accepted");
        PlayersThatAcceptedInput.setValue([...PlayersThatAcceptedInput.value, PlayerColor.value])
        this.webSocket.send(JSON.stringify({
            type: "acceptInput"
        }))
    }


    render(): ReactNode {
        let mins:any = Math.floor(this.state.timer/60)
        let secs:any = this.state.timer - mins*60
        let isOver = mins <= 0 && secs <= 0
        mins = mins < 10? `0${mins}` : mins
        secs = secs < 10? `0${secs}` : secs

        return this.state.connecting?
        <div id="connecting">
            <h1>Connecting to the server...</h1>
        </div>:
        <div id="game" style={{"--player-color" : `var(--color-${PlayerColor.value})`} as React.CSSProperties}>
            <div id="game-input">
                <h1>Letters to numbers </h1>
                <p id="player-color">Your color is <span style={{color: `var(--player-color)`}}>{PlayerColor.value}</span></p>
                
                {
                    //<h2 id="timeLeft">Time left: {this.state.sessionStared? isOver? "TIME'S UP!" : `${mins}:${secs}` : "Session not started yet."}</h2>
                }
                <span id="sessionId">SessionId: <span>{this.state.sessionId ?? "unknown"}</span></span>
                {
                    this.state.sessionStared?
                    <>
                        <InputAndButton 
                        buttonText='Test' 
                        title="Step 1: Equation"
                        placeholder='Equation (e.g., A + B)'
                        onChange={(e) => this.updateInputButtonToServer(e)}
                        isEnabled={this.state.gameStep === GameStep.Equation}
                        onAccept={() => this.acceptInput()}
                        validInput={ALL_LETTERS + '-+'}/>

                    <InputAndButton 
                        buttonText='Guess' 
                        title="Step 2: Hypothesis"
                        placeholder="Hypothesis (e.g., A  = 1)"
                        onChange={(e) => this.updateInputButtonToServer(e)}
                        isEnabled={this.state.gameStep === GameStep.Hypothesis}
                        onAccept={() => this.acceptInput()}
                        validInput={ALL_LETTERS + ALL_NUMBERS + '='}/>

                    <ResultInput 
                        isEnabled={this.state.gameStep === GameStep.Result}
                        onAccept={() => this.acceptInput()}
                        onChange={(letter, number) => this.webSocket.send(JSON.stringify({
                            type: 'updateResultInput',
                            value: number,
                            letter
                        }))}/>
                    </>:
                    <div id="connectedcolors">
                        <p>Connected players</p>
                        <div>
                            {
                                this.state.connectedColors.map(color => <div key={color} style={{backgroundColor: `var(--color-${color})`}}></div>)
                            }
                        </div>
                    </div>
                }
                

            </div>
            {
                this.state.sessionStared && <ResultTable resultArray={this.state.resultArray}/>
            }
        </div>
    }
}

const ResultInput = (props: {
    isEnabled:boolean,
    onChange:(letter:string, number:ResultInputNumber)=>void,
    onAccept:()=>void
}) => {
    useSharedState(ResultInputToken)
    return <div id="resultinput">
        <p>Step 3: Complete Solution</p>
        <div id="resultinput-inputs" data-enabled={props.isEnabled}>
            {
                Array.from(ALL_LETTERS).map(char => 
                <div key={char}>
                    <p>{char}</p>
                    <input maxLength={1}  onChange={(e:any) => {
                        const key:string = e.nativeEvent.data as string
                        if(e.target.value.length > 1 && key !== null){
                            return;
                        }
                        if(key === null){
                            (ResultInputToken.value as any)[char] = undefined
                            ResultInputToken.emitChange()
                            props.onChange(char, undefined)
                            return 
                        }
                        const number = parseInt(key)
                        if(isNaN(number))return;
                        (ResultInputToken.value as any)[char] = number
                        ResultInputToken.emitChange()
                        props.onChange(char, number)
                    }} value={(ResultInputToken.value as any)[char] ?? ""}/>
                </div>)
            }
            <Button text='Solve' onClick={() => {
                if(!props.isEnabled)return;

                props.onAccept()
            }}/>
            {
                props.isEnabled && <AcceptedDiv />
            }
        </div>
        
    </div>
}

const InputAndButton = (props: {
    buttonText:string, 
    placeholder:string, 
    title:string, 
    onChange:(val:string)=>void,
    isEnabled:boolean,
    onAccept:()=>void,
    validInput:string
}) => {
    useSharedState(CurrentTextToken)
    const inputValue = props.isEnabled? CurrentTextToken.value : ""

    return <div className='inputbutton' data-enabled={props.isEnabled}>
        <p>{props.title}</p>
        <div>
            {
                props.isEnabled && <AcceptedDiv />
            }
            <input value={inputValue} onChange={(e:any) => {
                if(!props.isEnabled)return
                let key:string = e.nativeEvent.data as string
                if(key !== null && props.validInput.indexOf(key.toUpperCase()) === -1)return;

                const value = e.target.value.toUpperCase()
                CurrentTextToken.setValue(value)
                props.onChange(value)
            }} placeholder={props.placeholder}/>
            <Button text={props.buttonText} onClick={props.onAccept}/>
        </div>
    </div>
}
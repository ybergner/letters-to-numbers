export const ALL_LETTERS = 'ABCDEFGHIJ'
export const ALL_NUMBERS = '1234567890'
export type ColorType = "red"|"green"|"blue"|'orange'
export const COLORS:ColorType[] = [ 'red', 'green', 'blue', 'orange']

export interface TestTry{
    equation:string,
    hypothesis?:string,
    feedback?:boolean
}

export enum GameStep{
    PlayersConnecting,
    Equation,
    Hypothesis,
    Result
}
export type ResultInputNumber = number | undefined
export type ResultInputType = {A:ResultInputNumber, B:ResultInputNumber, C:ResultInputNumber, D:ResultInputNumber, E:ResultInputNumber, F:ResultInputNumber
    G:ResultInputNumber, H:ResultInputNumber, I:ResultInputNumber, J:ResultInputNumber}

export interface InitSession{
    id: string,
    timer: number,
    testTries: TestTry[],
    gameStep: GameStep,
}

export type SessionEndReason = "time"|"trycount"|"sucess"|"inprogress"|"wrongcolor"|"playerdisconnect"|"sessionnolongerexists"|"connecterror"
export interface SessionEndData{
    reason: SessionEndReason,
    sessionId:string,

}
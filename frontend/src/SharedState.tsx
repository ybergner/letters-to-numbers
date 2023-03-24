import React, { useEffect, useState } from "react";

export function useSharedState(...tokens:SharedStateToken<any>[]) {
    const [fakeState, setFakeState] = useState(0)
    const callback = () => {
        setFakeState(fakeState + 1)
    }
    useEffect(() => {
        tokens.forEach(token => token.addCallback(callback))
        return () => {
            tokens.forEach(token => token.removeCallback(callback))
        }
    })
}

export class SharedState{
    private component:React.Component
    private tokens:SharedStateToken<any>[]
    private callbackInstance
    constructor(component:React.Component, ...tokens:SharedStateToken<any>[]){
        this.component = component
        this.tokens = tokens
        this.callbackInstance = () => this.callback()
        for(let i = 0; i < tokens.length; i++){
            tokens[i].addCallback(this.callbackInstance)
        }
    }

    public static use(component:React.Component, ...tokens:SharedStateToken<any>[]){
        return new SharedState(component, ...tokens)
    }

    callback(){
        this.component.forceUpdate()
    }

    public dispose(){
        for(let i = 0; i < this.tokens.length; i++){
            this.tokens[i].removeCallback(this.callbackInstance)
        }
    }
}
export type SharedStateCallback = () => void
export class SharedStateToken<T>{
    private callbackSet = new Set<SharedStateCallback>()
    public value : T

    constructor(startValue:T){
        this.value = startValue
    }
    public static createFunc<T>(startValue:() => T) : SharedStateToken<T>{
        return new  SharedStateToken<T>(startValue())
    }

    public addCallback(callback:SharedStateCallback) : void{
        this.callbackSet.add(callback)
    }

    public removeCallback(callback:SharedStateCallback):boolean{
        return this.callbackSet.delete(callback)
    }

    public setValue(value:T){
        this.value = value
        this.emitChange()
    }

    public emitChange(){
        this.callbackSet.forEach(callback => callback())
    }
}
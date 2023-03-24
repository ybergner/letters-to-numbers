import { PlayersThatAcceptedInput } from '../../game/game'
import { useSharedState } from '../../SharedState'
import './accepteddiv.css'

export const AcceptedDiv = () => {
    useSharedState(PlayersThatAcceptedInput)
    return <div id="accepteddiv">
        {
            PlayersThatAcceptedInput.value.map(color => 
            <div key={color} style={{backgroundColor: `var(--color-${color})`}}>

            </div>)
        }
    </div>
}
import { CSSProperties } from 'react';
import './button.css';

export const Button = (props: {text:string, id?:string, onClick?:()=>void, style?:CSSProperties, className?:string}) => {
    return <div className={props.className? `button ${props.className}` : "button"} id={props.id} onClick={props.onClick} style={props.style}>
        <a>{props.text}</a>
    </div>
}
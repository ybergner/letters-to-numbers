import './button.css';

export const Button = (props: {text:string, id?:string, onClick?:()=>void}) => {
    return <div className='button' id={props.id} onClick={props.onClick}>
        <a>{props.text}</a>
    </div>
}
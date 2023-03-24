import { TestTry } from '../../shared'
import './resulttable.css'
const RESULT_COUNT = 10
const emtpyArray:number[] = []
for(let i = 0; i < RESULT_COUNT; i++)
    emtpyArray.push(i)

export const ResultTable = (props: {resultArray:TestTry[]}) => {
    return <div id="resulttable">
        <p>Results</p>
        <table>
            <thead>
                <tr>
                    <th>Trial</th>
                    <th>Equation</th>
                    <th>Hypothesis</th>
                    <th>Feedback</th>
                </tr>
            </thead>
            <tbody>
                {
                    emtpyArray.map(index => 
                        {
                            let instance: TestTry |undefined= props.resultArray[index]
                            return <tr key={index}>
                                <th>{index+1}</th>
                                <td>{instance && instance.equation}</td>
                                <td>{instance && instance.hypothesis}</td>
                                <td>{(instance?.feedback !== undefined) && (instance.feedback? "TRUE" : "FALSE")}</td>
                            </tr>
                        })
                }
            </tbody>
        </table>
    </div>
}
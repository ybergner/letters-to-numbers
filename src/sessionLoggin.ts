import { GameSession } from "./session";
import { GameStep, SessionEndReason } from "./shared";
import mongoose  from 'mongoose'
const connectionString = process.env.ATLAS_URI;
if(!connectionString){
    throw new Error("Not mongodb connection string found");
}
mongoose.connect(connectionString)
const database = mongoose.connection
database.on("connected", () => {
    console.log("Connected to mongodb")
});
database.on('error', (error) => {
    console.log(error)
})

const logSchema = new mongoose.Schema({
    answer: [Number],
    tries: [Object],
    endReason: String,
    sessionId: String,
    endedOnStep: Number,
    started: Date,
    ended: Date,
    maxPlayers: Number,
    inputLogs: [Object]
})
const model = mongoose.model("Game", logSchema)

export async function logSession(session:GameSession, endReason:SessionEndReason){
    const newLog = await model.create({
        answer: session.results,
        endedOnStep: session.gameStep,
        endReason: endReason,
        sessionId: session.id,
        started: session.started,
        tries: session.testTries,
        maxPlayers: session.maxPlayers,
        ended: new Date(),
        inputLogs: session.logs
    })
    await newLog.save();
}

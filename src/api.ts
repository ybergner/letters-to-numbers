import { Router } from "express";
import bodyParser from 'body-parser'
import {readdir} from 'fs/promises'
import { logsFolder } from "./sessionLoggin";
const router = Router()
const jsonParser = bodyParser.json()

const API_KEY = process.env.API_KEY || "defaultApiKey"

router.use(jsonParser, async(req, res, next) => {
    const {key} = req.body
    console.log(key, API_KEY)
    if(key !== API_KEY){
        res.statusCode = 401
        res.statusMessage = 'Api key does not match'
        res.json()
        return;
    }
    next()
})

router.get("/folders", async (_, res) => {
    try{
        const dirs = await readdir(logsFolder)
    res.json(dirs)
    }catch{
        res.statusCode = 500
        res.json("Error listing directories")
    }
})

export default router
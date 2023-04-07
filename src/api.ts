import { Router } from "express";
import bodyParser from 'body-parser'
import {readdir} from 'fs/promises'
import {existsSync} from 'fs'
import { logsFolder } from "./sessionLoggin";
import path from 'path'
const router = Router()
const jsonParser = bodyParser.json()

const API_KEY = process.env.API_KEY || "defaultApiKey"

router.use(jsonParser, async(req, res, next) => {
    const {key} = req.body
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

router.get("/folder/:folderName", async (req, res) => {
    try{
        const files = await readdir(path.join(logsFolder, req.params.folderName))
        res.json(files)
    }catch{
        res.statusCode = 500
        res.json("Error listing files")
    }
})

router.get("/file/:folderName/:file", async (req, res) => {
    try{
        const filePath = path.join(logsFolder, req.params.folderName, req.params.file)
        if(!existsSync(filePath)){
            res.statusCode = 404
            res.json("File not found")
            return;
        }
        res.sendFile(filePath)
    }catch{
        res.statusCode = 500
        res.json("Error getting file")
    }
})

export default router
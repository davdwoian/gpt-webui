import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import * as db from './db/local'
import * as chatgpt from './api/chatgpt'
import { Readable } from 'stream'

import randomstring from 'randomstring'

const server = express()
const port = 8081

server.use(cors())
server.use(express.urlencoded({ extended: false }))
server.use(express.text())

server.get('*', (req, res, next) => {
    console.log(req.url)
    next()
})

server.post('*', (req, res, next) => {
    console.log(req.url)
    next()
})

server.get('/', (req, res) => {
    res.send(200)
})

server.post('/api/gpt/tokenizer', async (req, res) => {
    try {
        res.send(
            (
                await chatgpt.calculateToken('gpt-3.5-turbo', req.body || '')
            ).toString()
        )
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/create', (req, res) => {
    try {
        let trial = 100
        let sessionId = randomstring.generate(
            parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH)
        )
        while (chatgpt.has(sessionId) && trial-- > 0)
            sessionId = randomstring.generate(
                parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH)
            )

        res.send({
            sessionId: sessionId,
            available: !chatgpt.has(sessionId),
        })
        chatgpt.putIfAbsent(sessionId)
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/delete/:sessionId', (req, res) => {
    try {
        chatgpt.remove(req.params.sessionId)
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/clear/:sessionId', (req, res) => {
    try {
        chatgpt.remove(req.params.sessionId)
        chatgpt.putIfAbsent(req.params.sessionId)
        res.send(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/sessions', (req, res) => {
    try {
        res.send(chatgpt.getSessions())
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/metadata/:sessionId', (req, res) => {
    try {
        chatgpt.cleanSession(req.params.sessionId)
        res.send(chatgpt.getSessionData(req.params.sessionId))
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/title/:sessionId', (req, res) => {
    try {
        const title = chatgpt.getSessionData(req.params.sessionId)?.title || ''
        res.send(title)
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.get('/api/gpt/used/:sessionId', (req, res) => {
    try {
        const usedToken =
            chatgpt.getSessionData(req.params.sessionId)?.usedToken || 0
        res.send({ usedToken: usedToken })
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.post('/api/gpt/chat/:sessionId', async (req, res) => {
    try {
        res.setHeader('Content-type', 'text/plain')
        res.setHeader('Transfer-Encoding', 'chunked')

        const stream = new Readable({
            objectMode: true,
            read() {
                //
            },
        })

        chatgpt.chatCompleteStream(
            'gpt-3.5-turbo',
            req.body || 'hello',
            req.params.sessionId,
            (partial) => stream.push(partial),
            (err) => console.log(err),
            () => stream.push(null)
        )

        stream.pipe(res)
    } catch (err) {
        console.log(err)
        res.sendStatus(404)
    }
})

server.listen(port, () => {
    console.log(`\nbackend: sever running at: http://localhost:${port}`)
})

process.stdin.resume() //so the program will not close instantly

const exitHandler = (options: any, exitCode: any) => {
    if (options.cleanup) {
        console.log('\nbackend: cleanning')
        chatgpt.cleanup()
        db.push()
        console.log('backend: cleanup finished')
    }
    if (options.exit) process.exit()
}

process.on('exit', exitHandler.bind(null, { cleanup: true }))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }))
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }))

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))

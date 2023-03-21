import dotenv from 'dotenv'
dotenv.config();

import express from 'express'
import cors from 'cors'
import { Request } from 'express'
import * as chatgpt from './api/chatgpt';

import randomstring from 'randomstring'

const server = express()
const port = 8081

server.use(cors());
server.use(express.urlencoded({ extended: false }))
server.use(express.text());

server.get('*', (req, res, next) => {
    console.log(req.url);
    next();
})

server.get('/api/gpt/create', (req, res) => {
    let trial = 10;
    let sessionId = randomstring.generate(parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH));
    while (chatgpt.has(sessionId) && trial-- > 0) sessionId = randomstring.generate(parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH));

    res.send({
        sessionId: sessionId,
        status: !chatgpt.has(sessionId)
    })
})

server.get('/api/gpt/sessions', (req, res) => {
    res.send({
        sessionIds: chatgpt.getSessionId()
    })
})

server.get('/api/gpt/metadata/:sessionId', (req, res) => {
    try {
        res.send(chatgpt.getSession(req.params.sessionId))
    } catch {
        res.sendStatus(404)
    }
})

server.get('/api/gpt/messages/:sessionId', (req, res) => {
    try {
        const messages = chatgpt.getSession(req.params.sessionId)!.messages.slice(1)
        res.send({ messages: messages })
    } catch {
        res.sendStatus(404)
    }
})

server.post('/api/gpt/chat/:sessionId', async (req, res) => {
    try {
        await chatgpt.chatCompleteStream('gpt-3.5-turbo', req.body || 'hello', req.params.sessionId, (token) => {
            res.write(token);
        }, (err) => {
            console.log(err);
        });

        res.end();
    } catch {
        res.sendStatus(404)
    }
})

server.listen(port)
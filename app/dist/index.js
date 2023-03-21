"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const chatgpt = __importStar(require("./api/chatgpt"));
const randomstring_1 = __importDefault(require("randomstring"));
const server = (0, express_1.default)();
const port = 8081;
server.use((0, cors_1.default)());
server.use(express_1.default.urlencoded({ extended: false }));
server.use(express_1.default.text());
server.get('*', (req, res, next) => {
    console.log(req.url);
    next();
});
server.get('/api/gpt/create', (req, res) => {
    let trial = 10;
    let sessionId = randomstring_1.default.generate(parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH));
    while (chatgpt.has(sessionId) && trial-- > 0)
        sessionId = randomstring_1.default.generate(parseInt(process.env.API_CHATGPT_SESSION_ID_LENGTH));
    res.send({
        sessionId: sessionId,
        status: !chatgpt.has(sessionId)
    });
});
server.get('/api/gpt/sessions', (req, res) => {
    res.send({
        sessionIds: chatgpt.getSessionId()
    });
});
server.get('/api/gpt/metadata/:sessionId', (req, res) => {
    try {
        res.send(chatgpt.getSession(req.params.sessionId));
    }
    catch (_a) {
        res.sendStatus(404);
    }
});
server.get('/api/gpt/messages/:sessionId', (req, res) => {
    try {
        const messages = chatgpt.getSession(req.params.sessionId).messages.slice(1);
        res.send({ messages: messages });
    }
    catch (_a) {
        res.sendStatus(404);
    }
});
server.post('/api/gpt/chat/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield chatgpt.chatCompleteStream('gpt-3.5-turbo', req.body || 'hello', req.params.sessionId, (token) => {
            res.write(token);
        }, (err) => {
            console.log(err);
        });
        res.end();
    }
    catch (_a) {
        res.sendStatus(404);
    }
}));
server.listen(port);

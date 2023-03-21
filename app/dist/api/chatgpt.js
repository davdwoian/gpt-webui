"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatCompleteStream = exports.chatComplete = exports.OpenAIChatModelCost = exports.getSession = exports.putIfAbsent = exports.has = exports.getSessionId = void 0;
const openai_1 = require("openai");
const OPENAI_API_KEY = process.env.API_KEY;
const configuration = new openai_1.Configuration({ apiKey: OPENAI_API_KEY });
const api = new openai_1.OpenAIApi(configuration);
const DEFAULT_SYS_MSG = 'You are a helpful assistant. All markdown given by you are in detailed format.';
const sessions = new Map();
const getSessionId = () => {
    return Array.from(sessions.keys());
};
exports.getSessionId = getSessionId;
const has = (sessionId) => {
    return sessions.has(sessionId);
};
exports.has = has;
const putIfAbsent = (sessionId, sysMsg) => {
    if (!(0, exports.has)(sessionId))
        sessions.set(sessionId, {
            title: 'New Chat',
            sessionId: sessionId,
            messages: [{ role: "system", content: sysMsg }]
        });
};
exports.putIfAbsent = putIfAbsent;
const getSession = (sessionId) => {
    return sessions.get(sessionId);
};
exports.getSession = getSession;
exports.OpenAIChatModelCost = {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': 0.06,
    'gpt-4-32k': 0.12
};
function chatComplete(model, prompt, sessionId, otherOptions) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, exports.has)(sessionId))
            throw new Error('invalid url');
        let messages = (0, exports.getSession)(sessionId).messages;
        messages.push({ role: 'user', content: prompt });
        let temperature = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.temperature) || 0.3;
        let n = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.n) || 1;
        let stop = otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.stop;
        let stream = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.stream) || false;
        let max_tokens = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.maxTokens) || Infinity;
        let frequency_penalty = 0.2;
        let presence_penalty = 0.1;
        const res = yield api.createChatCompletion({
            model: model,
            messages: messages,
            temperature: temperature,
            n: n,
            stop: stop,
            stream: stream,
            max_tokens: max_tokens,
            frequency_penalty: frequency_penalty,
            presence_penalty: presence_penalty
        });
        messages.push({ role: 'assistant', content: ((_a = res.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || '' });
        return res.data;
    });
}
exports.chatComplete = chatComplete;
function chatCompleteStream(model, prompt, sessionId, onData, onError, otherOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, exports.has)(sessionId))
            throw new Error('invalid url');
        let messages = (0, exports.getSession)(sessionId).messages;
        messages.push({ role: 'user', content: prompt });
        let temperature = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.temperature) || 0.3;
        let n = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.n) || 1;
        let stop = otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.stop;
        let stream = true;
        let max_tokens = (otherOptions === null || otherOptions === void 0 ? void 0 : otherOptions.maxTokens) || Infinity;
        let frequency_penalty = 0.2;
        let presence_penalty = 0.1;
        const fetchPromise = fetch(`https://api.openai.com/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                n: n,
                stop: stop,
                stream: stream,
                max_tokens: max_tokens,
                frequency_penalty: frequency_penalty,
                presence_penalty: presence_penalty
            }),
        });
        const response = yield fetchPromise;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        messages.push({ role: 'assistant', content: '' });
        let totalToken = 0;
        while (true) {
            const { done, value } = yield reader.read();
            if (done)
                break;
            const text = decoder.decode(value);
            const lines = text.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                const msg = line.replace(/^data: /, '');
                if (msg === '[DONE]')
                    break;
                // try to parse the line as JSON, and if it works, get the token and call the callback
                try {
                    const parsed = JSON.parse(msg);
                    if (parsed.choices[0].delta.role)
                        messages[messages.length - 1].role = parsed.choices[0].delta.role;
                    const partial = parsed.choices[0].delta.content ? parsed.choices[0].delta.content : '';
                    messages[messages.length - 1].content += partial;
                    totalToken++;
                    onData(partial);
                }
                catch (error) {
                    // todo: handle error better -- retry? inform caller?
                    console.error(`Could not JSON parse stream message`, { text, lines, line, msg, error });
                    try {
                        let errorInfo = JSON.parse(text);
                        console.error(`Error info`, errorInfo);
                        if (errorInfo.message)
                            return onError(errorInfo.message);
                        if (errorInfo.error.message)
                            return onError(errorInfo.error.message);
                    }
                    catch (error) {
                        // ignore
                    }
                }
            }
        }
        return totalToken;
    });
}
exports.chatCompleteStream = chatCompleteStream;
sessions.set('456', { title: 'hi', messages: [], sessionId: '456' });
sessions.set('123', { title: 'test', messages: [], sessionId: '123' });

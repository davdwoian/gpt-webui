import { Configuration, CreateChatCompletionResponse, OpenAIApi } from 'openai';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from 'openai'

const OPENAI_API_KEY = process.env.API_KEY;
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const api = new OpenAIApi(configuration);

const DEFAULT_SYS_MSG = 'You are a helpful assistant. All markdown given by you are in detailed format.'

const sessions: Map<string, ChatSession> = new Map<string, ChatSession>();
export interface ChatSession {
    title: string,
    sessionId: string,
    messages: ChatCompletionRequestMessage[]
}
export const getSessionId = () => {
    return Array.from(sessions.keys())
}
export const has = (sessionId: string): boolean => {
    return sessions.has(sessionId);
}
export const putIfAbsent = (sessionId: string, sysMsg: string): void => {
    if (!has(sessionId)) sessions.set(sessionId, {
        title: 'New Chat',
        sessionId: sessionId,
        messages: [{ role: "system", content: sysMsg }]
    })
}
export const getSession = (sessionId: string): ChatSession | undefined => {
    return sessions.get(sessionId);
}

interface ChatOptions {
    temperature?: number;
    n?: number;
    stop?: string | string[];
    stream?: boolean;
    maxTokens?: number;
}

interface ChatChunk {
    choices: {
        delta: {
            role?: ChatCompletionRequestMessageRoleEnum
            content?: string
        },
        finish_reason?: string,
        index: number
    }[],
    created: number,
    id: string,
    model: string,
    object: string
}

export type OpenAIChatModel =
    'gpt-4' |
    'gpt-4-32k' |
    'gpt-3.5-turbo'

export const OpenAIChatModelCost: Record<OpenAIChatModel, number> = {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': 0.06,
    'gpt-4-32k': 0.12
};

export async function chatComplete(model: OpenAIChatModel, prompt: string, sessionId: string, otherOptions?: ChatOptions): Promise<CreateChatCompletionResponse> {
    if (!has(sessionId)) throw new Error('invalid url')

    let messages = getSession(sessionId)!.messages;
    messages.push({ role: 'user', content: prompt })

    let temperature = otherOptions?.temperature || 0.3;
    let n = otherOptions?.n || 1;
    let stop = otherOptions?.stop;
    let stream = otherOptions?.stream || false;
    let max_tokens = otherOptions?.maxTokens || Infinity;
    let frequency_penalty = 0.2;
    let presence_penalty = 0.1;

    const res = await api.createChatCompletion({
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

    messages.push({ role: 'assistant', content: res.data.choices[0].message?.content || '' })
    return res.data
}

export async function chatCompleteStream(model: OpenAIChatModel, prompt: string, sessionId: string, onData: (data: string) => any, onError: (err: string) => any, otherOptions?: ChatOptions): Promise<number> {
    if (!has(sessionId)) throw new Error('invalid url');

    let messages = getSession(sessionId)!.messages;
    messages.push({ role: 'user', content: prompt })

    let temperature = otherOptions?.temperature || 0.3;
    let n = otherOptions?.n || 1;
    let stop = otherOptions?.stop;
    let stream = true
    let max_tokens = otherOptions?.maxTokens || Infinity;
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

    const response = await fetchPromise;
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    messages.push({ role: 'assistant', content: '' })
    let totalToken = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            const msg = line.replace(/^data: /, '');
            if (msg === '[DONE]') break;

            // try to parse the line as JSON, and if it works, get the token and call the callback
            try {
                const parsed = JSON.parse(msg) as ChatChunk

                if (parsed.choices[0].delta.role) messages[messages.length - 1].role = parsed.choices[0].delta.role
                const partial = parsed.choices[0].delta.content ? parsed.choices[0].delta.content : ''

                messages[messages.length - 1].content += partial
                totalToken++;
                onData(partial);

            } catch (error) {
                // todo: handle error better -- retry? inform caller?
                console.error(`Could not JSON parse stream message`, { text, lines, line, msg, error });

                try {
                    let errorInfo = JSON.parse(text);
                    console.error(`Error info`, errorInfo);
                    if (errorInfo.message) return onError(errorInfo.message);
                    if (errorInfo.error.message) return onError(errorInfo.error.message);
                } catch (error) {
                    // ignore
                }
            }
        }
    }

    return totalToken;
}










sessions.set('456', { title: 'hi', messages: [], sessionId: '456' });
sessions.set('123', { title: 'test', messages: [], sessionId: '123' });
import * as db from '../db/local'
import { Configuration, OpenAIApi } from 'openai'
import {
    ChatCompletionRequestMessage,
    ChatCompletionRequestMessageRoleEnum,
} from 'openai'
import { exec } from 'child_process'
import { resolve } from 'path'

let sessions: { [sessionId: string]: SessionData } = {}

const OPENAI_API_KEY = process.env.API_KEY
const configuration = new Configuration({ apiKey: OPENAI_API_KEY })
// const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

const api = new OpenAIApi(configuration)

const DEFAULT_SYS_MSG =
    'You are a helpful assistant. All markdown given by you are in detailed format.'

export type OpenAIChatModel = 'gpt-4' | 'gpt-4-32k' | 'gpt-3.5-turbo'
export const OpenAIChatModelCost: Record<OpenAIChatModel, number> = {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': 0.06,
    'gpt-4-32k': 0.12,
}
export const OpenAIChatModelMaxToken: Record<OpenAIChatModel, number> = {
    'gpt-3.5-turbo': 4096,
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
}

export interface SessionData {
    title: string
    sessionId: string
    model: OpenAIChatModel
    messages: { role: string; content: string; token: number }[]
    usedToken: number
    maxToken: number
    onReply: boolean
}
export interface SessionDataOption {
    title?: string
    sessionId?: string
    model?: OpenAIChatModel
    messages?: { role: string; content: string; token: number }[]
    systemMessage?: string
    usedToken?: number
    maxToken?: number
    onReply?: boolean
}
export const has = (sessionId: string) => {
    return !!sessions[sessionId]
}
export const getSessions = () => {
    return Array.from(Object.keys(sessions))
}
export const getSessionData = (sessionId: string): SessionData | undefined => {
    return sessions[sessionId]
}
export const putIfAbsent = async (
    sessionId: string,
    options?: SessionDataOption
): Promise<void> => {
    if (!has(sessionId))
        sessions[sessionId] = {
            title: options?.title || 'New Chat',
            sessionId: sessionId,
            model: options?.model || 'gpt-3.5-turbo',
            messages: options?.messages || [
                {
                    role: 'system',
                    content: options?.systemMessage || DEFAULT_SYS_MSG,
                    token: await calculateToken(
                        options?.model || 'gpt-3.5-turbo',
                        options?.systemMessage || DEFAULT_SYS_MSG
                    ),
                },
            ],
            usedToken: options?.usedToken || 0,
            maxToken:
                options?.maxToken ||
                OpenAIChatModelMaxToken[options?.model || 'gpt-3.5-turbo'],
            onReply: options?.onReply || false,
        }
}

interface ChatOptions {
    temperature?: number
    n?: number
    stop?: string | string[]
    maxTokens?: number
    frequencyPenalty: number
    presencePenalty: number
}

interface ChatChunk {
    choices: {
        delta: {
            role?: ChatCompletionRequestMessageRoleEnum
            content?: string
        }
        finish_reason?: string
        index: number
    }[]
    created: number
    id: string
    model: string
    object: string
}

export async function chatComplete(
    model: OpenAIChatModel,
    prompt: string,
    sessionId: string,
    options?: ChatOptions
): Promise<void> {
    const sdata = getSessionData(sessionId)
    if (sdata == undefined) throw new Error('Invalid SessionID')
    if (sdata.onReply) throw new Error('Synchronous Request Omitted')
    sdata.messages.push({
        role: 'user',
        content: prompt,
        token: await calculateToken(model, prompt),
    })
    sdata.onReply = true

    const res = await api.createChatCompletion({
        model: model,
        messages: sdata.messages.map((x): ChatCompletionRequestMessage => {
            return {
                role: x.role as ChatCompletionRequestMessageRoleEnum,
                content: x.content,
            }
        }),
        temperature: options?.temperature || 0.3,
        n: options?.n || 1,
        stop: options?.stop,
        stream: false,
        max_tokens: options?.maxTokens || Infinity,
        frequency_penalty: options?.frequencyPenalty || 0.2,
        presence_penalty: options?.presencePenalty || 0.1,
    })
    if (res.status != 200) {
        sdata.messages.pop()
        sdata.onReply = false
        throw new Error('Bad Response from OpenAIApi')
    }

    sdata.messages.push({
        role: 'assistant',
        content: res.data.choices[0].message?.content || '',
        token: await calculateToken(
            model,
            res.data.choices[0].message?.content || ''
        ),
    })
    sdata.usedToken += res.data.usage?.total_tokens || 0
    sdata.onReply = false
}

export async function chatCompleteStream(
    model: OpenAIChatModel,
    prompt: string,
    sessionId: string,
    onData: (data: string) => void,
    onError: (err: string) => void,
    onEnd: () => void,
    options?: ChatOptions
): Promise<void> {
    const sdata = getSessionData(sessionId)
    if (sdata == undefined) throw new Error('Invalid SessionID')
    if (sdata.onReply) throw new Error('Synchronous Request Omitted')
    sdata.onReply = true
    sdata.messages.push({
        role: 'user',
        content: prompt,
        token: await calculateToken(model, prompt),
    })

    const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: model,
            messages: sdata.messages.map((x): ChatCompletionRequestMessage => {
                return {
                    role: x.role as ChatCompletionRequestMessageRoleEnum,
                    content: x.content,
                }
            }),
            temperature: options?.temperature || 0.3,
            n: options?.n || 1,
            stop: options?.stop,
            stream: true,
            max_tokens: options?.maxTokens || Infinity,
            frequency_penalty: options?.frequencyPenalty || 0.2,
            presence_penalty: options?.presencePenalty || 0.1,
        }),
    })
    if (response.status != 200) {
        sdata.messages.pop()
        sdata.onReply = false
        throw new Error('Bad Response from OpenAIApi')
    }

    const reader = response.body?.getReader()
    if (reader == undefined) {
        sdata.onReply = false
        throw new Error(
            'Cannot Read From Response Stream: https://api.openai.com/v1/chat/completions'
        )
    }

    const decoder = new TextDecoder()
    const msgs = sdata.messages
    msgs.push({ role: 'assistant', content: '', token: 0 })

    let cnt = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter((line) => line.trim() !== '')
        for (const line of lines) {
            const msg = line.replace(/^data: /, '')
            if (msg === '[DONE]') break

            try {
                const parsed = JSON.parse(msg) as ChatChunk
                const partial = parsed.choices[0].delta.content || ''

                msgs[msgs.length - 1].content += partial
                cnt++
                onData(partial)
            } catch (error) {
                sdata.onReply = false
                console.error(`Could not JSON parse stream message`, {
                    lines,
                    line,
                    msg,
                    error,
                })

                try {
                    const errorInfo = JSON.parse(text)
                    console.error(`Error info`, errorInfo)
                    if (errorInfo.message) {
                        onError(errorInfo.message)
                        return
                    }
                    if (errorInfo.error.message)
                        return onError(errorInfo.error.message)
                } catch (error) {
                    // ignore
                }
            }
        }
    }
    msgs[msgs.length - 1].token = await calculateToken(
        model,
        msgs[msgs.length - 1].content
    )
    if (cnt != msgs[msgs.length - 1].token) console.log('miss!')
    sdata.usedToken += msgs[msgs.length - 2].token + msgs[msgs.length - 1].token
    sdata.onReply = false

    onEnd()
}

export async function calculateToken(
    model: OpenAIChatModel,
    text: string
): Promise<number> {
    const basePath = resolve('./bin')
    const encoded = Buffer.from(text, 'utf8').toString('base64')

    return await new Promise((resolve, reject) => {
        exec(
            `python3 ${basePath}/count.py "${model}" "${encoded}"`,
            (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`)
                    reject()
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`)
                    reject()
                }
                if (stdout) resolve(parseInt(stdout))
            }
        )
    })
}

export const cleanSession = (sessionId: string) => {
    if (!has(sessionId)) return
    if (!sessions[sessionId].onReply) return

    const msgs = sessions[sessionId].messages
    do {
        const msg = msgs.pop()
        sessions[sessionId].usedToken -= msg!.token
    } while (
        msgs[msgs.length - 1].role != 'system' ||
        msgs[msgs.length - 1].role != 'assistant'
    )
    sessions[sessionId].onReply = false
}
export const cleanup = () => {
    if (!sessions) return
    for (const sessionId in Object.keys(sessions)) {
        cleanSession(sessionId)
    }
}
;(async () => {
    await db.pull()
    sessions = db.read('gpt', 'sessions') as {
        [sessionId: string]: SessionData
    }
    putIfAbsent('dev', { title: 'dev' })
    putIfAbsent('test', { title: 'test' })
    cleanup()
})()

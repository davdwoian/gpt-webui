declare namespace NodeJS {
    interface ProcessEnv {
        readonly API_KEY: string
        readonly MODEL: string
        readonly API_CHATGPT_SESSION_ID_LENGTH: string
    }
}
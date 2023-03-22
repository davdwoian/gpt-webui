/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_SERVER_ADDRESS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

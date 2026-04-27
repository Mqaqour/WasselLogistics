/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RESPONDIO_CHANNEL_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

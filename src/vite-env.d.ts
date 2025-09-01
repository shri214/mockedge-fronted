
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_X?: string; // optional
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


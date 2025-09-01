// src/config/env.ts
const { VITE_API_URL, VITE_FEATURE_X } = import.meta.env;

if (!VITE_API_URL) {
  // Fail fast during startup if required envs are missing
  throw new Error("VITE_API_URL is not defined. Check your .env files.");
}

export const ENV = {
  API_URL: VITE_API_URL,
  FEATURE_X: VITE_FEATURE_X === "true",
  MODE: import.meta.env.MODE,    // "development" | "production" | "test"
  DEV: import.meta.env.DEV,      // boolean
  PROD: import.meta.env.PROD,    // boolean
  SSR: import.meta.env.SSR,      // boolean (usually false on client)
} as const;

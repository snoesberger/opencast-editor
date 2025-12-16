/**
 * Types for our user defined variables
 */
interface ImportMetaEnv {
  readonly VITE_APP_SETTINGS_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

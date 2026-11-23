/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

interface ImportMetaEnv {
  readonly VITE_ASSET_BASE_URL?: string;
}

declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";

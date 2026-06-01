// Must run BEFORE cesium loads. Side-effect import; keep it first in
// CesiumScene's import list so CESIUM_BASE_URL is set before cesium init.
// Assets are copied to /public/cesium by scripts/copy-cesium.mjs.
declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

if (typeof window !== "undefined") {
  window.CESIUM_BASE_URL = "/cesium";
}

export {};

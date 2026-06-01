// Browser download helpers (DOM side of the export hub).

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function saveText(text: string, filename: string, mime = "application/json"): void {
  saveBlob(new Blob([text], { type: mime }), filename);
}

export function savePngDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// Self-contained read-only share link: the project is encoded into the URL
// hash (base64url), no server needed. A tokenized, Supabase-backed share-link
// (/share/<id>?token=<jwt>) is M1.8; this is the anon-first MVP.
import type { PlannerProject } from "@/lib/db/db";
import { serializeProject, parseProject, type ProjectExport } from "./project";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Encode a project into a URL-hash fragment (without the leading #). */
export function encodeShare(project: PlannerProject): string {
  const json = serializeProject(project);
  return toBase64Url(new TextEncoder().encode(json));
}

/** Decode a project export from a share fragment, or null if invalid. */
export function decodeShare(fragment: string): ProjectExport["project"] | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(fragment));
    return parseProject(json);
  } catch {
    return null;
  }
}

/** Build the full share URL for the current origin. */
export function buildShareUrl(origin: string, locale: string, project: PlannerProject): string {
  return `${origin}/${locale}/share#${encodeShare(project)}`;
}

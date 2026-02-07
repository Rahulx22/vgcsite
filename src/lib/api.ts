// lib/api.ts
import { DEFAULT_CACHE_OPTIONS } from './cache';

export const API_URL = "https://panel.vgcadvisors.com/api/v1/pages";
export const SETTINGS_URL = "https://panel.vgcadvisors.com/api/v1/settings";
export const IMAGE_BASE = "https://panel.vgcadvisors.com/storage/builder/";

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Add default caching if not specified
    const fetchInit = {
      ...DEFAULT_CACHE_OPTIONS, // Use 5-minute cache by default
      ...init
    };
    
    const res = await fetch(input, { ...fetchInit, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Ensure provided image path becomes an absolute URL acceptable by next/image.
 * Accepts already-absolute URLs or builder/relative paths returned by API.
 */
export function ensureUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  // strip leading slashes and optional "builder/" prefix
  const normalized = String(path).replace(/^\/+/, "").replace(/^builder\//, "");
  return IMAGE_BASE + normalized;
}

/**
 * Remove HTML tags (simple)
 */
export function stripHtml(html = ""): string {
  return String(html).replace(/<[^>]+>/g, "").trim();
}

/**
 * Fetch settings data
 */
export async function fetchSettings() {
  try {
    const res = await fetchWithTimeout(SETTINGS_URL, { 
      cache: 'force-cache',
      next: { revalidate: 3600 } // Cache settings for 1 hour
    });
    if (!res.ok) {
      throw new Error(`Settings API returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("[Settings] API fetch failed:", err);
    return null;
  }
}
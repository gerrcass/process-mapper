import { parseProcessMap, type ParseResult } from "./schema";
import type { ProcessMap } from "./types";

/**
 * A share link carries a snapshot of one process map inside the URL fragment
 * (ADR-0003). The payload is version-prefixed: `z1.` is deflate-raw plus
 * base64url of the UTF-8 JSON, and `u1.` is plain base64url of the same JSON.
 */
export const SHARE_FRAGMENT_PREFIX = "shared=";

/**
 * The maximum length of an encoded share payload, in characters. Maps whose
 * payload exceeds this cannot be shared as a link; the author is pointed at
 * the JSON export instead.
 */
export const SHARE_LINK_BUDGET = 16_000;

const COMPRESSED_PREFIX = "z1.";
const PLAIN_PREFIX = "u1.";

const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const utf8 = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let out = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const triple = (first << 16) | (second << 8) | third;
    out += BASE64URL_ALPHABET[(triple >> 18) & 63];
    out += BASE64URL_ALPHABET[(triple >> 12) & 63];
    if (index + 1 < bytes.length) out += BASE64URL_ALPHABET[(triple >> 6) & 63];
    if (index + 2 < bytes.length) out += BASE64URL_ALPHABET[triple & 63];
  }
  return out;
}

/** Returns null when the input is not valid base64url (with optional padding). */
function base64UrlToBytes(value: string): Uint8Array | null {
  const body = value.replace(/=+$/, "");
  if (body.length === 0) return new Uint8Array(0);
  if (body.length % 4 === 1) return null;

  const output = new Uint8Array(Math.floor((body.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of body) {
    const digit = BASE64URL_ALPHABET.indexOf(char);
    if (digit === -1) return null;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[index] = (buffer >> bits) & 0xff;
      index += 1;
    }
  }
  return output;
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

/**
 * Runs `input` through a transform stream and returns its full output. Both
 * the readable and the writable side are awaited so a stream failure is
 * rejected exactly once instead of surfacing as an unhandled rejection.
 */
async function pump(
  stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream },
  input: Uint8Array,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  const output = readStream(stream.readable);
  const settled = Promise.allSettled([output, writer.closed]);
  try {
    await writer.write(input);
    await writer.close();
  } catch {
    // The readable side carries the same failure; await it below.
  }
  const [readResult] = await settled;
  if (readResult.status === "rejected") throw readResult.reason;
  return readResult.value;
}

async function compressJson(json: string): Promise<Uint8Array> {
  return pump(new CompressionStream("deflate-raw"), utf8.encode(json));
}

async function decompressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  return pump(new DecompressionStream("deflate-raw"), bytes);
}

/**
 * Encodes a process map into a fragment payload. Prefers the compressed
 * `z1.` format when the runtime exposes CompressionStream and falls back to
 * the plain `u1.` format otherwise. Never throws.
 */
export async function encodeSharePayload(map: ProcessMap): Promise<string> {
  const json = JSON.stringify(map);
  if (typeof CompressionStream !== "undefined") {
    try {
      const compressed = await compressJson(json);
      return `${COMPRESSED_PREFIX}${bytesToBase64Url(compressed)}`;
    } catch {
      // Compression can be unavailable or blocked; the plain format always works.
    }
  }
  return `${PLAIN_PREFIX}${bytesToBase64Url(utf8.encode(json))}`;
}

/**
 * Decodes a fragment payload into a validated process map. Accepts both the
 * compressed and the plain format. Returns a result instead of throwing, and
 * distinguishes empty payloads, unknown prefixes, bad base64, non-JSON, and
 * schema failures in the error message.
 */
export async function decodeSharePayload(payload: string): Promise<ParseResult<ProcessMap>> {
  if (payload.length === 0) {
    return { ok: false, error: "This share link carries no payload." };
  }

  let body: string;
  let compressed: boolean;
  if (payload.startsWith(PLAIN_PREFIX)) {
    body = payload.slice(PLAIN_PREFIX.length);
    compressed = false;
  } else if (payload.startsWith(COMPRESSED_PREFIX)) {
    body = payload.slice(COMPRESSED_PREFIX.length);
    compressed = true;
  } else {
    return { ok: false, error: "This share link uses an unsupported format." };
  }

  if (body.length === 0) {
    return { ok: false, error: "This share link carries no payload." };
  }

  const bytes = base64UrlToBytes(body);
  if (!bytes) {
    return { ok: false, error: "This share link is damaged: the payload is not valid base64." };
  }

  let jsonBytes: Uint8Array;
  if (compressed) {
    if (typeof DecompressionStream === "undefined") {
      return { ok: false, error: "This browser cannot read compressed share links." };
    }
    try {
      jsonBytes = await decompressBytes(bytes);
    } catch {
      return { ok: false, error: "This share link is damaged: the payload is corrupt." };
    }
  } else {
    jsonBytes = bytes;
  }

  const json = new TextDecoder().decode(jsonBytes);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "This share link is damaged: the payload is not valid JSON." };
  }

  const parsed = parseProcessMap(raw);
  if (!parsed.ok) {
    return { ok: false, error: `Could not read this share link: ${parsed.error}.` };
  }
  return parsed;
}

/** True when an encoded payload is too long to share as a link. */
export function exceedsShareLinkBudget(payload: string): boolean {
  return payload.length > SHARE_LINK_BUDGET;
}

/** The payload of a `#shared=` fragment, or null when the fragment is not a share fragment. */
export function sharePayloadFromHash(hash: string): string | null {
  if (!hash.startsWith(`#${SHARE_FRAGMENT_PREFIX}`)) return null;
  return hash.slice(`#${SHARE_FRAGMENT_PREFIX}`.length);
}

/**
 * Builds a share link from the browser's own location: origin plus pathname,
 * with the search and hash replaced by the share fragment. The Pages base
 * path is inherited from the browser, never duplicated into configuration.
 */
export function buildShareLink(
  payload: string,
  location: { origin: string; pathname: string },
): string {
  return `${location.origin}${location.pathname}#${SHARE_FRAGMENT_PREFIX}${payload}`;
}

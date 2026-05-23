import type { DiscoveredFile, FileWithText } from "./types";
import {
  MAX_SINGLE_FILE_BYTES,
  MAX_TOTAL_BYTES,
} from "./constants";

const GITHUB_API = "https://api.github.com";
const INITIAL_TEXT_CHARS = 12_000;

async function fetchBlobContent(
  owner: string,
  repo: string,
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<{ bytes: Buffer; encoding: string }> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub contents ${res.status} for ${path}`);
  }
  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
    size?: number;
  };
  if (!data.content) {
    throw new Error(`No content for ${path}`);
  }
  const buf = Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8");
  return { bytes: buf, encoding: data.encoding ?? "base64" };
}

async function extractPdfText(buf: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buf });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export function sliceDocChunk(text: string, chunkIndex: number): string {
  const start = chunkIndex * 12_000;
  const end = start + 12_000;
  return text.slice(start, end);
}

export async function extractAllText(
  owner: string,
  repo: string,
  files: DiscoveredFile[],
  githubToken: string,
  signal?: AbortSignal,
): Promise<{ files: FileWithText[]; warnings: string[] }> {
  const warnings: string[] = [];
  const results: FileWithText[] = [];
  let totalBytes = 0;

  for (const file of files) {
    if (totalBytes >= MAX_TOTAL_BYTES) {
      warnings.push(`Total byte cap (${MAX_TOTAL_BYTES}) reached; skipping remaining files.`);
      break;
    }

    try {
      const { bytes } = await fetchBlobContent(owner, repo, file.path, githubToken, signal);
      if (bytes.length > MAX_SINGLE_FILE_BYTES) {
        warnings.push(`Skipped ${file.path}: exceeds ${MAX_SINGLE_FILE_BYTES} byte limit.`);
        results.push({
          path: file.path,
          text: null,
          bytes: bytes.length,
          truncated: false,
          error: "file_too_large",
        });
        continue;
      }

      totalBytes += bytes.length;
      const lower = file.path.toLowerCase();

      let text: string;
      if (lower.endsWith(".pdf")) {
        try {
          text = await extractPdfText(bytes);
        } catch {
          results.push({
            path: file.path,
            text: null,
            bytes: bytes.length,
            truncated: false,
            error: "pdf_extract_failed",
          });
          continue;
        }
      } else {
        text = bytes.toString("utf8");
      }

      const truncated = text.length > INITIAL_TEXT_CHARS;
      results.push({
        path: file.path,
        text: truncated ? text.slice(0, INITIAL_TEXT_CHARS) : text,
        fullText: text,
        bytes: bytes.length,
        truncated,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "extract_failed";
      results.push({
        path: file.path,
        text: null,
        bytes: 0,
        truncated: false,
        error: msg,
      });
    }
  }

  return { files: results, warnings };
}

export function fileTextByPath(files: FileWithText[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of files) {
    const full = f.fullText ?? f.text;
    if (full) map.set(f.path, full);
  }
  return map;
}

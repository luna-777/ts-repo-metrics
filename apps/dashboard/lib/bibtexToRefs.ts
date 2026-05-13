/**
 * Minimal BibTeX field extraction for displaying references on the Research page.
 * Not a full BibTeX parser; tuned for ACM-style refs.bib from this project.
 */

import fs from "fs";
import path from "path";

export interface FormattedRef {
  key: string;
  line: string;
}

/** Extract {...} value starting at first `{`, respecting nested braces. */
function extractBracedValue(fromIndex: number, source: string): string | null {
  const open = source.indexOf("{", fromIndex);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(open + 1, i).replace(/\s+/g, " ").trim();
      }
    }
  }
  return null;
}

function fieldMatch(body: string, field: string): string | null {
  const re = new RegExp(`(?:^|\\n)\\s*${field}\\s*=\\s*`, "m");
  const m = body.match(re);
  if (!m || m.index === undefined) return null;
  const start = m.index + m[0].length;
  if (sourceStartsWithQuoted(body, start)) return extractQuotedValue(body, start);
  return extractBracedValue(start, body);
}

function sourceStartsWithQuoted(body: string, index: number): boolean {
  const ch = body[index]?.trim();
  return ch === '"';
}

function extractQuotedValue(body: string, index: number): string | null {
  const q = body.indexOf('"', index);
  if (q === -1) return null;
  let end = q + 1;
  while (end < body.length) {
    if (body[end] === '"' && body[end - 1] !== "\\") break;
    end++;
  }
  if (end >= body.length) return null;
  return body.slice(q + 1, end).replace(/\s+/g, " ").trim();
}

function shortenAuthors(authors: string): string {
  const cleaned = authors.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return cleaned;
  const first = parts[0];
  return `${first.split(",")[0]?.trim() ?? first}, et al.`;
}

function normalizeTex(str: string): string {
  return str
    .replace(/\{([^}]*)\}/g, "$1")
    .replace(/\\([a-zA-Z]+)/g, "")
    .replace(/[`']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntries(raw: string): FormattedRef[] {
  const chunks = raw.split(/\n@/).filter((c) => c.trim().length > 0);
  const out: FormattedRef[] = [];

  for (const chunk of chunks) {
    const header = chunk.match(/^(\w+)\s*\{\s*([^,\s]+)\s*,/);
    if (!header) continue;
    const key = header[2]!;
    const body = chunk.slice(header[0].length);

    const author = fieldMatch(body, "author");
    const title = fieldMatch(body, "title");
    const year = fieldMatch(body, "year");
    const journal = fieldMatch(body, "journal");
    const booktitle = fieldMatch(body, "booktitle");
    const doi = fieldMatch(body, "doi");

    if (!title || !year) continue;

    const venue = journal ?? booktitle ?? "";
    const au = author ? shortenAuthors(normalizeTex(author)) : "Unknown";
    const ti = normalizeTex(title);
    const ven = venue ? normalizeTex(venue) : "";
    let line = `${au} (${year}). ${ti}.`;
    if (ven) line += ` ${ven}.`;
    if (doi) line += ` https://doi.org/${doi}`;
    out.push({ key, line });
  }

  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export function loadFormattedRefsFromPublic(): FormattedRef[] {
  const bibPath = path.join(
    process.cwd(),
    "public/research/paper/refs.bib",
  );
  if (!fs.existsSync(bibPath)) return [];
  const raw = fs.readFileSync(bibPath, "utf8");
  return parseEntries(raw);
}

import { describe, expect, it } from "vitest";
import { parseTypeScript } from "../src/parsing/tsParser.js";
import { extractSilentFailures } from "../src/extract/silentFailures.js";

describe("extractSilentFailures", () => {
  it("detects empty catch", () => {
    const code = `
function f() {
  try { doWork(); } catch (e) {}
}
`;
    const tree = parseTypeScript(code, "tsx");
    const ev = extractSilentFailures(tree.rootNode, "f.tsx");
    expect(ev).toHaveLength(1);
    expect(ev[0]!.kind).toBe("empty_catch");
  });

  it("detects console-only catch", () => {
    const code = `
function f() {
  try { doWork(); } catch (e) { console.error(e); }
}
`;
    const tree = parseTypeScript(code, "tsx");
    const ev = extractSilentFailures(tree.rootNode, "f.tsx");
    expect(ev).toHaveLength(1);
    expect(ev[0]!.kind).toBe("console_only_catch");
  });

  it("returns empty when catch rethrows or handles", () => {
    const code = `
function f() {
  try { doWork(); } catch (e) { throw e; }
}
`;
    const tree = parseTypeScript(code, "tsx");
    expect(extractSilentFailures(tree.rootNode, "f.tsx")).toHaveLength(0);
  });
});

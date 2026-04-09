import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../src/parsing/tsParser.js";
import { collectHalsteadAtoms } from "../src/parsing/tokenScanner.js";
import { halsteadFromAtoms, computeHalsteadForFunction } from "../src/extract/halstead.js";
import { walkTree } from "../src/utils/astWalker.js";
import { FUNCTION_NODE_TYPES } from "../src/utils/constants.js";
import type { SyntaxNode } from "tree-sitter";

function firstFunction(root: SyntaxNode): SyntaxNode {
  let fn: SyntaxNode | null = null;
  walkTree(root, {
    enter(node) {
      if (fn) return;
      if (FUNCTION_NODE_TYPES.has(node.type)) fn = node;
    },
  });
  if (!fn) throw new Error("expected a function");
  return fn;
}

describe("Halstead / tokenScanner", () => {
  it("handles minimal function without throwing", () => {
    const tree = parseTypeScript(`function f() {}`, "ts");
    const fn = firstFunction(tree.rootNode);
    const h = computeHalsteadForFunction(fn);
    expect(h.n1).toBeGreaterThanOrEqual(0);
    expect(h.n2).toBeGreaterThanOrEqual(0);
  });

  it("counts ?? in binary expression", () => {
    const tree = parseTypeScript(
      `function f(x: number | null) { return x ?? 0; }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    const { operators } = collectHalsteadAtoms(fn);
    expect(operators.some((o) => o.includes("??"))).toBe(true);
  });

  it("counts spread_element", () => {
    const tree = parseTypeScript(
      `function f(a: number[]) { return [...a]; }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    const { operators } = collectHalsteadAtoms(fn);
    expect(operators.filter((o) => o === "op:...").length).toBeGreaterThan(0);
  });

  it("counts arrow_function operator", () => {
    const tree = parseTypeScript(`const f = () => 1;`, "ts");
    const fn = firstFunction(tree.rootNode);
    const { operators } = collectHalsteadAtoms(fn);
    expect(operators.includes("op:=>")).toBe(true);
  });

  it("optional chaining adds ?. operator", () => {
    const tree = parseTypeScript(
      `function f(o: any) { return o?.a?.b; }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    const { operators } = collectHalsteadAtoms(fn);
    const optional = operators.filter((o) => o === "op:?.");
    expect(optional.length).toBeGreaterThan(0);
  });

  it("AI-style snippet has non-zero volume", () => {
    const simple = parseTypeScript(
      `function a(x: number) { return x; }`,
      "ts",
    );
    const fancy = parseTypeScript(
      `function b(o: any) { return o?.x ?? o?.y ?? [...o.z]; }`,
      "ts",
    );
    const v1 = computeHalsteadForFunction(firstFunction(simple.rootNode)).volume;
    const v2 = computeHalsteadForFunction(firstFunction(fancy.rootNode)).volume;
    expect(v2).toBeGreaterThan(v1);
  });

  it("halsteadFromAtoms aggregates n1 n2 N1 N2", () => {
    const atoms = {
      operators: ["op:a", "op:a", "op:b"],
      operands: ["id:x", "id:y"],
    };
    const h = halsteadFromAtoms(atoms);
    expect(h.n1).toBe(2);
    expect(h.n2).toBe(2);
    expect(h.N1).toBe(3);
    expect(h.N2).toBe(2);
  });
});

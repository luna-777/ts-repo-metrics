import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../src/parsing/tsParser.js";
import { computeCognitiveComplexity } from "../src/extract/cognitiveComplexity.js";
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

describe("computeCognitiveComplexity", () => {
  it("is 0 for empty function body", () => {
    const tree = parseTypeScript(`function f() {}`, "ts");
    const fn = firstFunction(tree.rootNode);
    expect(computeCognitiveComplexity(fn)).toBe(0);
  });

  it("adds 1 for root-level if", () => {
    const tree = parseTypeScript(
      `function f() { if (true) { return 1; } }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    expect(computeCognitiveComplexity(fn)).toBe(1);
  });

  it("adds 1 + 2 for nested if (additive story)", () => {
    const tree = parseTypeScript(
      `function f() { if (a) { if (b) { return 1; } } }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    expect(computeCognitiveComplexity(fn)).toBe(3);
  });

  it("adds structural penalty for break inside loop", () => {
    const tree = parseTypeScript(
      `function f() { while (true) { break; } }`,
      "ts",
    );
    const fn = firstFunction(tree.rootNode);
    const score = computeCognitiveComplexity(fn);
    expect(score).toBeGreaterThanOrEqual(2);
  });
});

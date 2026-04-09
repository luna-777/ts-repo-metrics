/**
 * JSX and React component helpers for Tree-sitter TSX ASTs.
 */

import type { SyntaxNode } from "tree-sitter";
import { SKIP, walkTree } from "../../utils/astWalker.js";

const JSX_TYPES = new Set([
  "jsx_element",
  "jsx_self_closing_element",
  "jsx_fragment",
]);

export function nodeContainsJsx(node: SyntaxNode): boolean {
  let found = false;
  walkTree(node, {
    enter(n) {
      if (JSX_TYPES.has(n.type)) {
        found = true;
        return SKIP;
      }
    },
  });
  return found;
}

/** Max depth of nested JSX (1 = leaf element, <a><b/></a> => 2). */
export function maxJsxDepthInSubtree(node: SyntaxNode): number {
  let max = 0;
  walkTree(node, {
    enter(n) {
      if (n.type === "jsx_element" || n.type === "jsx_self_closing_element") {
        const d = jsxNodeDepth(n);
        if (d > max) max = d;
      }
    },
  });
  return max;
}

function jsxNodeDepth(node: SyntaxNode): number {
  if (node.type === "jsx_self_closing_element") return 1;
  if (node.type !== "jsx_element") return 0;

  let maxChild = 0;
  for (let i = 0; i < node.namedChildCount; i++) {
    const ch = node.namedChild(i);
    if (!ch) continue;
    if (ch.type === "jsx_element" || ch.type === "jsx_self_closing_element") {
      const d = jsxNodeDepth(ch);
      if (d > maxChild) maxChild = d;
    }
  }
  return 1 + maxChild;
}

export function getFunctionLikeName(node: SyntaxNode): string {
  const nameChild = node.childForFieldName("name");
  if (nameChild) return nameChild.text;

  if (node.parent?.type === "variable_declarator") {
    const id = node.parent.childForFieldName("name");
    if (id) return id.text;
  }

  if (node.parent?.type === "pair") {
    const key = node.parent.childForFieldName("key");
    if (key) return key.text;
  }

  return "(anonymous)";
}

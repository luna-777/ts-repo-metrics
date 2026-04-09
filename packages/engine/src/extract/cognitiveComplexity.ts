/**
 * Additive cognitive complexity (Sonar-inspired).
 * Control structures add (nestingDepth + 1); break/continue/throw add +1 when nested.
 * Does not descend into nested function bodies.
 */

import type { SyntaxNode } from "tree-sitter";
import { FUNCTION_NODE_TYPES } from "../utils/constants.js";

const COGNITIVE_CONTROL = new Set([
  "if_statement",
  "for_statement",
  "for_in_statement",
  "while_statement",
  "do_statement",
  "switch_statement",
  "catch_clause",
  "ternary_expression",
]);

const JUMP_TYPES = new Set([
  "break_statement",
  "continue_statement",
  "throw_statement",
]);

/**
 * Compute cognitive complexity for a function subtree.
 */
export function computeCognitiveComplexity(fnNode: SyntaxNode): number {
  let score = 0;

  function visit(node: SyntaxNode, controlDepth: number): void {
    if (node !== fnNode && FUNCTION_NODE_TYPES.has(node.type)) {
      return;
    }

    if (COGNITIVE_CONTROL.has(node.type)) {
      score += controlDepth + 1;
      for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child) visit(child, controlDepth + 1);
      }
      return;
    }

    if (JUMP_TYPES.has(node.type) && controlDepth > 0) {
      score += 1;
    }

    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i);
      if (child) visit(child, controlDepth);
    }
  }

  visit(fnNode, 0);
  return score;
}

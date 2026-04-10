/**
 * Phase 3 — Silent failure patterns in TSX (try/catch hygiene).
 *
 * Flags empty catch bodies and catch bodies that only log to console,
 * which can hide errors and inflate perceived stability.
 */

import type { SyntaxNode } from "tree-sitter";
import { walkTree } from "../utils/astWalker.js";

export type SilentFailureKind = "empty_catch" | "console_only_catch";

export interface SilentFailureEvent {
  file: string;
  line: number;
  kind: SilentFailureKind;
}

const CONSOLE_METHODS = new Set(["log", "warn", "error", "debug", "info"]);

function isConsoleCall(node: SyntaxNode): boolean {
  if (node.type !== "call_expression") return false;
  const fn = node.childForFieldName("function");
  if (fn?.type !== "member_expression") return false;
  const obj = fn.childForFieldName("object");
  const prop = fn.childForFieldName("property");
  return (
    obj?.type === "identifier" &&
    obj.text === "console" &&
    prop !== null &&
    CONSOLE_METHODS.has(prop.text)
  );
}

/**
 * True if the statement block contains only console.* expression statements (possibly with empty lines).
 */
function isConsoleOnlyBody(block: SyntaxNode): boolean {
  if (block.type !== "statement_block") return false;
  const meaningful: SyntaxNode[] = [];
  for (let i = 0; i < block.namedChildCount; i++) {
    const ch = block.namedChild(i);
    if (!ch) continue;
    if (ch.type === "expression_statement") {
      const inner = ch.namedChild(0);
      if (inner && isConsoleCall(inner)) {
        meaningful.push(ch);
        continue;
      }
      return false;
    }
    if (ch.type === "empty_statement") continue;
    return false;
  }
  return meaningful.length > 0;
}

function isEmptyStatementBlock(block: SyntaxNode | null): boolean {
  if (!block || block.type !== "statement_block") return false;
  return block.namedChildCount === 0;
}

/**
 * Extract silent-failure sites from a parsed TSX/TS tree.
 *
 * @param root - Root syntax node
 * @param relativePath - Repo-relative file path (for events)
 */
export function extractSilentFailures(
  root: SyntaxNode,
  relativePath: string,
): SilentFailureEvent[] {
  const events: SilentFailureEvent[] = [];

  walkTree(root, {
    enter(node) {
      if (node.type !== "catch_clause") return;

      const body = node.childForFieldName("body");
      const line = node.startPosition.row + 1;

      if (isEmptyStatementBlock(body)) {
        events.push({ file: relativePath, line, kind: "empty_catch" });
        return;
      }

      if (body && isConsoleOnlyBody(body)) {
        events.push({ file: relativePath, line, kind: "console_only_catch" });
      }
    },
  });

  return events;
}

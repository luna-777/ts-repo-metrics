/**
 * Same-file prop pass-through MVP: props received and only forwarded to JSX children.
 */

import type { SyntaxNode } from "tree-sitter";
import { walkTree } from "../../utils/astWalker.js";

/** Bound names from destructured props / first parameter. */
export function collectParamBindingNames(params: SyntaxNode | null): Set<string> {
  const names = new Set<string>();
  if (!params) return names;

  walkTree(params, {
    enter(node) {
      if (node.type === "identifier" && node.parent?.type === "required_parameter") {
        names.add(node.text);
      }
      if (node.type === "shorthand_property_identifier") {
        names.add(node.text);
      }
      if (node.type === "shorthand_property_identifier_pattern") {
        names.add(node.text);
      }
      if (node.type === "assignment_pattern") {
        const left = node.childForFieldName("left");
        if (left?.type === "identifier") names.add(left.text);
      }
    },
  });

  return names;
}

function jsxAttributeNames(jsxNode: SyntaxNode): Set<string> {
  const attrs = new Set<string>();
  if (jsxNode.type === "jsx_self_closing_element") {
    collectAttrNamesFromOpening(jsxNode, attrs);
    return attrs;
  }
  if (jsxNode.type === "jsx_element") {
    const open = jsxNode.namedChild(0);
    if (open?.type === "jsx_opening_element") {
      collectAttrNamesFromOpening(open, attrs);
    }
  }
  return attrs;
}

function collectAttrNamesFromOpening(open: SyntaxNode, attrs: Set<string>): void {
  walkTree(open, {
    enter(n) {
      if (n.type === "jsx_attribute") {
        const aname = n.namedChild(0);
        if (aname?.type === "property_identifier") attrs.add(aname.text);
      }
    },
  });
}

/**
 * Count edges where a param name is used only as a JSX attribute value to a child
 * (heuristic pass-through).
 */
export function countPropPassThroughEdges(
  functionBody: SyntaxNode,
  paramNames: Set<string>,
): number {
  if (paramNames.size === 0) return 0;

  let edges = 0;
  walkTree(functionBody, {
    enter(node) {
      if (node.type !== "jsx_element" && node.type !== "jsx_self_closing_element") {
        return;
      }

      const attrNames = jsxAttributeNames(node);
      for (const name of attrNames) {
        if (!paramNames.has(name)) continue;
        edges++;
      }
    },
  });

  return edges;
}

import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "mdast";

type Options = { tokens: Record<string, string> };

const plugin: Plugin<[Options], Root> = (options) => {
  const { tokens } = options;
  const replace = (s: string) =>
    Object.entries(tokens).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`__${k}__`, "g"), v),
      s,
    );
  const walkEstree = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "Literal" && typeof node.value === "string") {
      node.value = replace(node.value);
      if (typeof node.raw === "string") {
        node.raw = replace(node.raw);
      }
    }
    if (node.type === "TemplateElement" && node.value) {
      if (typeof node.value.raw === "string") {
        node.value.raw = replace(node.value.raw);
      }
      if (typeof node.value.cooked === "string") {
        node.value.cooked = replace(node.value.cooked);
      }
    }
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(walkEstree);
      } else if (child && typeof child === "object" && child.type) {
        walkEstree(child);
      }
    }
  };
  return (tree) => {
    // Markdown parses __TOKEN__ as bold (strong wrapping text "TOKEN").
    // Detect that shape and rewrite the strong node into a plain text node.
    visit(tree, (node: any, index, parent: any) => {
      if (
        node.type === "strong" &&
        Array.isArray(node.children) &&
        node.children.length === 1 &&
        node.children[0].type === "text" &&
        typeof node.children[0].value === "string" &&
        Object.prototype.hasOwnProperty.call(tokens, node.children[0].value) &&
        parent &&
        typeof index === "number"
      ) {
        parent.children[index] = {
          type: "text",
          value: tokens[node.children[0].value],
        };
      }
    });
    visit(tree, (node: any) => {
      if (
        node.type === "text" ||
        node.type === "code" ||
        node.type === "inlineCode"
      ) {
        if (typeof node.value === "string") {
          node.value = replace(node.value);
        }
      }
      // MDX JSX attribute values (e.g. <Terminal lines={[...]} />)
      if (
        node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement"
      ) {
        if (Array.isArray(node.attributes)) {
          for (const attr of node.attributes) {
            const estree = attr?.value?.data?.estree;
            if (estree) walkEstree(estree);
          }
        }
      }
      // MDX expressions inside markdown (e.g. {someString})
      if (
        node.type === "mdxFlowExpression" ||
        node.type === "mdxTextExpression"
      ) {
        const estree = node?.data?.estree;
        if (estree) walkEstree(estree);
      }
    });
  };
};

export default plugin;

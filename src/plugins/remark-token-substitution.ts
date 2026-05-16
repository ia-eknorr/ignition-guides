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
  return (tree) => {
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
    });
  };
};

export default plugin;

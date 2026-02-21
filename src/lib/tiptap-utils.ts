interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export function extractPlainText(doc: TipTapNode): string {
  const parts: string[] = [];

  function walk(node: TipTapNode) {
    if (node.text) {
      parts.push(node.text);
      return;
    }

    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }

      // Add newline after block-level nodes (paragraph, heading, etc.)
      if (
        node.type &&
        node.type !== "doc" &&
        node.type !== "text" &&
        parts.length > 0
      ) {
        parts.push("\n");
      }
    }
  }

  walk(doc);

  return parts.join("").trim();
}

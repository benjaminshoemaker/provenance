export function getSystemPrompt(
  mode: "inline" | "side_panel" | "freeform"
): string {
  switch (mode) {
    case "inline":
      return "You are a writing assistant helping to improve selected text. Provide direct text replacements without explanations or markdown formatting. Match the style and tone of the surrounding content.";
    case "side_panel":
      return "You are a writing assistant with full access to the document context. Help the user with research, brainstorming, and writing suggestions. Be conversational and helpful.";
    case "freeform":
      return "You are a writing assistant. Help the user with their writing request. Provide clear, actionable content that can be inserted into a document.";
  }
}

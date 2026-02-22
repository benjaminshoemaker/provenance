"use client";

import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Render from message.parts (v6 UIMessage pattern)
  const displayText = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = message.metadata as Record<string, any> | undefined;
  const modelName = metadata?.model as string | undefined;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-gray-100 text-foreground"
            : "border border-gray-200 bg-white text-foreground"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{displayText}</div>
        {isStreaming && !displayText && (
          <div className="flex gap-1 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
          </div>
        )}
        {!isUser && modelName && !isStreaming && (
          <div className="mt-1 text-[10px] text-muted-foreground">
            {modelName}
          </div>
        )}
      </div>
    </div>
  );
}

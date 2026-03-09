"use client";

import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  const displayText = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className="flex flex-col gap-1">
      {/* Role label */}
      <span
        className={`text-xs font-semibold uppercase tracking-wide ${
          isUser ? "text-muted-foreground" : "text-violet-600"
        }`}
      >
        {isUser ? "You" : "Claude"}
      </span>

      {/* Message card */}
      <div
        data-chat-role={isUser ? "user" : "assistant"}
        className={`rounded-lg px-3 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "border border-border bg-white text-foreground"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{displayText}</div>
        ) : (
          <div className="chat-prose break-words">
            <ReactMarkdown>{displayText}</ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="streaming-cursor" />
        )}
      </div>
    </div>
  );
}

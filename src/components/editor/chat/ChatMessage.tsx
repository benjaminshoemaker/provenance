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
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          isUser ? "text-gray-500" : "text-violet-600"
        }`}
      >
        {isUser ? "You" : "Claude"}
      </span>

      {/* Message card */}
      <div
        className={`rounded-lg px-3 py-2.5 text-[14px] leading-relaxed ${
          isUser
            ? "bg-gray-100 text-gray-800"
            : "border border-gray-200 bg-white text-gray-700"
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

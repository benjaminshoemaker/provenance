"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { logAIInteraction } from "@/app/actions/ai-interactions";

interface SidePanelProps {
  documentId: string;
  provider: string;
  model?: string;
  getDocumentContent: () => Record<string, unknown>;
  onAIResponse?: (responseText: string) => void;
}

export function SidePanel({
  documentId,
  provider,
  model,
  getDocumentContent,
  onAIResponse,
}: SidePanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastPromptRef = useRef("");

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/complete",
    }),
    onFinish: ({ message }) => {
      const responseText = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");

      const prompt = lastPromptRef.current;
      lastPromptRef.current = "";

      void logAIInteraction({
        documentId,
        mode: "side_panel",
        prompt,
        response: responseText,
        action: "received",
        provider,
        model: model ?? "",
      });

      onAIResponse?.(responseText);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || (status !== "ready" && status !== "error")) return;

      const prompt = inputValue;
      lastPromptRef.current = prompt;

      sendMessage(
        { text: prompt },
        {
          body: {
            mode: "side_panel",
            provider,
            model,
            context: JSON.stringify(getDocumentContent()),
          },
        }
      );
      setInputValue("");
    },
    [inputValue, status, sendMessage, provider, model, getDocumentContent]
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="border-b px-3 py-2 text-sm font-medium">
        AI Assistant
      </div>

      {/* Chat message list */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask the AI about your document...
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.parts
                .filter(
                  (p): p is { type: "text"; text: string } =>
                    p.type === "text"
                )
                .map((p, i) => (
                  <span key={i}>{p.text}</span>
                ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Failed to get AI response. Please try again.
        </div>
      )}

      {/* Message input with send button */}
      <form onSubmit={handleSubmit} className="border-t p-2">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your document..."
            className="flex-1 rounded-md border px-2 py-1 text-sm"
            disabled={status !== "ready" && status !== "error"}
          />
          <button
            type="submit"
            disabled={
              !inputValue.trim() || (status !== "ready" && status !== "error")
            }
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {(status === "streaming" || status === "submitted") && (
          <button
            type="button"
            onClick={stop}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Stop generating
          </button>
        )}
      </form>
    </div>
  );
}

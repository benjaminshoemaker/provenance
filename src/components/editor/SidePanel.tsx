"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useChat, DefaultChatTransport } from "@ai-sdk/react";
import { logAIInteraction } from "@/app/actions/ai-interactions";

interface SidePanelProps {
  documentId: string;
  provider: string;
  documentContent: Record<string, unknown>;
  defaultOpen?: boolean;
}

export function SidePanel({
  documentId,
  provider,
  documentContent,
  defaultOpen = false,
}: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Full document content sent as context with each chat message
  const contextPayload = JSON.stringify(documentContent);

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/complete",
      body: {
        mode: "side_panel",
        provider,
        context: contextPayload,
      },
    }),
    onFinish: ({ message }) => {
      const responseText = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");

      logAIInteraction({
        documentId,
        mode: "side_panel",
        prompt: "",
        response: responseText,
        action: "accepted",
        provider,
        model: "",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || status !== "ready") return;

      sendMessage({ text: inputValue });
      setInputValue("");
    },
    [inputValue, status, sendMessage]
  );

  // panel sidebar with toggle
  return (
    <div className="flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
        aria-label="Toggle AI panel"
      >
        {isOpen ? "✕" : "AI"}
      </button>

      {isOpen && (
        <div className="ml-2 flex h-[70vh] w-80 flex-col rounded-lg border bg-background shadow-lg">
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

          {/* Message input with send button */}
          <form onSubmit={handleSubmit} className="border-t p-2">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your document..."
                className="flex-1 rounded-md border px-2 py-1 text-sm"
                disabled={status !== "ready"}
              />
              <button
                type="submit"
                disabled={
                  !inputValue.trim() || status !== "ready"
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
      )}
    </div>
  );
}

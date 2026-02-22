"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatEmptyState } from "./ChatEmptyState";
import {
  getChatThread,
  saveChatThread,
} from "@/app/actions/chat-threads";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number | null;
  updatedAt: Date | null;
}

interface ChatPanelProps {
  documentId: string;
  provider: string;
  model?: string;
  getDocumentContent: () => Record<string, unknown>;
  initialThreads: ThreadSummary[];
  onClose: () => void;
}

function extractPlainTextFromContent(
  content: Record<string, unknown>
): string {
  const extract = (node: Record<string, unknown>): string => {
    if (node.text && typeof node.text === "string") return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map((child) => extract(child)).join("");
    }
    return "";
  };
  return extract(content);
}

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function ChatPanel({
  documentId,
  provider,
  model,
  getDocumentContent,
  initialThreads,
  onClose,
}: ChatPanelProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  // Stable ref for the thread ID used during a streaming session,
  // preventing race conditions when thread switching mid-stream.
  const streamThreadIdRef = useRef<string | null>(null);
  // Guard against duplicate thread creation when first save is in-flight
  const savingRef = useRef(false);

  // Memoize document context extraction so it doesn't run on every render
  const documentContext = useMemo(
    () => extractPlainTextFromContent(getDocumentContent()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getDocumentContent]
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        documentContext,
        threadId: activeThreadId,
        provider,
        model,
      },
    }),
    experimental_throttle: 50,
    onFinish: async ({ message, messages: allMessages }) => {
      // Use the thread ID that was active when streaming started
      const threadId = streamThreadIdRef.current;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = message.metadata as Record<string, any> | undefined;
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);

      const firstUserMsg = allMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? getTextFromMessage(firstUserMsg).slice(0, 50) || "New conversation"
        : "New conversation";

      // Guard against duplicate saves for new threads
      if (!threadId && savingRef.current) return;
      savingRef.current = true;

      try {
        const saved = await saveChatThread({
          documentId,
          threadId: threadId ?? undefined,
          title,
          messages: allMessages,
          messageCount: allMessages.length,
          summary: {
            messageCount: allMessages.length,
            durationMinutes: elapsed,
            category: "ask",
            provider: metadata?.provider ?? provider,
            model: metadata?.model ?? model ?? "",
            ...(metadata?.tokenCount
              ? { tokenCount: metadata.tokenCount }
              : {}),
          },
        });

        if (!threadId && saved) {
          // New thread was created — persist its ID
          setActiveThreadId(saved.id);
          streamThreadIdRef.current = saved.id;
          setThreads((prev) => [
            {
              id: saved.id,
              title: saved.title,
              messageCount: saved.messageCount,
              updatedAt: saved.updatedAt,
            },
            ...prev,
          ]);
        } else if (saved) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === saved.id
                ? {
                    ...t,
                    title: saved.title,
                    messageCount: saved.messageCount,
                    updatedAt: saved.updatedAt,
                  }
                : t
            )
          );
        }
      } catch (err) {
        console.error("[ChatPanel] Failed to save thread:", err);
      } finally {
        savingRef.current = false;
      }
    },
  });

  const isStreaming = status === "streaming";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleThreadSelect = useCallback(
    async (threadId: string | null) => {
      // Stop any in-progress stream before switching
      if (isStreaming) stop();

      if (!threadId) {
        setActiveThreadId(null);
        streamThreadIdRef.current = null;
        setMessages([]);
        startTimeRef.current = Date.now();
        return;
      }

      try {
        const thread = await getChatThread(threadId);
        setActiveThreadId(thread.id);
        streamThreadIdRef.current = thread.id;
        setMessages((thread.messages ?? []) as UIMessage[]);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("[ChatPanel] Failed to load thread:", err);
      }
    },
    [setMessages, isStreaming, stop]
  );

  const handleNewThread = useCallback(() => {
    if (isStreaming) stop();
    setActiveThreadId(null);
    streamThreadIdRef.current = null;
    setMessages([]);
    setInputValue("");
    startTimeRef.current = Date.now();
  }, [setMessages, isStreaming, stop]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue("");
    // Snapshot the current thread ID for this streaming session
    streamThreadIdRef.current = activeThreadId;
    startTimeRef.current = startTimeRef.current || Date.now();
    sendMessage({ text });
  }, [inputValue, sendMessage, activeThreadId]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue("");
      streamThreadIdRef.current = activeThreadId;
      startTimeRef.current = Date.now();
      sendMessage({ text: suggestion });
    },
    [sendMessage, activeThreadId]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <ChatHeader
        threads={threads}
        activeThreadId={activeThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <ChatMessage
                key={message.id ?? i}
                message={message}
                isStreaming={
                  isStreaming && i === messages.length - 1 && message.role === "assistant"
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onStop={stop}
        isStreaming={isStreaming}
      />
    </div>
  );
}

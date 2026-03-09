"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ClipboardEvent as ReactClipboardEvent,
} from "react";
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
import {
  PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME,
  createProvenanceClipboardPayload,
} from "@/lib/provenance-clipboard";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number | null;
  updatedAt: Date | null;
}

interface ChatPanelProps {
  documentId: string;
  clipboardSessionToken?: string;
  provider: string;
  model?: string;
  getDocumentContent: () => Record<string, unknown>;
  initialThreads: ThreadSummary[];
  onAssistantResponse?: (responseText: string) => void;
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

function getNodeElement(node: Node | null): Element | null {
  if (node instanceof Element) return node;
  if (node instanceof Node) return node.parentElement;
  return null;
}

function isSelectionInsideSingleAssistantMessage(selection: Selection): boolean {
  if (selection.isCollapsed || selection.rangeCount === 0) return false;

  const anchorElement = getNodeElement(selection.anchorNode);
  const focusElement = getNodeElement(selection.focusNode);
  if (!anchorElement || !focusElement) return false;

  const anchorAssistantMessage = anchorElement.closest(
    "[data-chat-role='assistant']"
  );
  const focusAssistantMessage = focusElement.closest(
    "[data-chat-role='assistant']"
  );

  return (
    anchorAssistantMessage !== null &&
    anchorAssistantMessage === focusAssistantMessage
  );
}

export function ChatPanel({
  documentId,
  clipboardSessionToken,
  provider,
  model,
  getDocumentContent,
  initialThreads,
  onAssistantResponse,
  onClose,
}: ChatPanelProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [selectedModel, setSelectedModel] = useState(model);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const streamThreadIdRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  const getDocumentContext = useCallback(
    () => extractPlainTextFromContent(getDocumentContent()),
    [getDocumentContent]
  );

  const wordCount = useMemo(
    () => getDocumentContext().split(/\s+/).filter(Boolean).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getDocumentContent]
  );

  const handleModelChange = useCallback(
    (newProvider: string, newModel: string) => {
      setSelectedProvider(newProvider);
      setSelectedModel(newModel);
    },
    []
  );

  const transportRef = useRef({ getDocumentContext, activeThreadId, selectedProvider, selectedModel });
  transportRef.current = { getDocumentContext, activeThreadId, selectedProvider, selectedModel };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages: msgs, id }) => ({
          body: {
            id,
            messages: msgs,
            documentContext: transportRef.current.getDocumentContext(),
            ...(transportRef.current.activeThreadId
              ? { threadId: transportRef.current.activeThreadId }
              : {}),
            provider: transportRef.current.selectedProvider,
            model: transportRef.current.selectedModel,
          },
        }),
      }),
    []
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport,
    experimental_throttle: 50,
    onFinish: async ({ message, messages: allMessages }) => {
      const threadId = streamThreadIdRef.current;
      const assistantText = getTextFromMessage(message).trim();
      if (assistantText) {
        onAssistantResponse?.(assistantText);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = message.metadata as Record<string, any> | undefined;
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);

      const firstUserMsg = allMessages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? getTextFromMessage(firstUserMsg).slice(0, 50) || "New conversation"
        : "New conversation";

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
            provider: metadata?.provider ?? selectedProvider,
            model: metadata?.model ?? selectedModel ?? "",
            ...(metadata?.tokenCount
              ? { tokenCount: metadata.tokenCount }
              : {}),
          },
        });

        if (!threadId && saved) {
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

  useEffect(() => {
    if (initialThreads.length === 0) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      return;
    }

    let cancelled = false;
    const latestThreadId = initialThreads[0]?.id;
    if (!latestThreadId) return;

    void (async () => {
      try {
        const thread = await getChatThread(latestThreadId);
        if (cancelled) return;
        setActiveThreadId(thread.id);
        streamThreadIdRef.current = thread.id;
        setMessages((thread.messages ?? []) as UIMessage[]);
        startTimeRef.current = Date.now();
      } catch (err) {
        if (!cancelled) {
          console.error("[ChatPanel] Failed to restore latest thread:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialThreads, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleThreadSelect = useCallback(
    async (threadId: string | null) => {
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

  const handleCopy = useCallback(
    (event: ReactClipboardEvent<HTMLDivElement>) => {
      if (!clipboardSessionToken) return;
      const selection = window.getSelection();
      if (!selection) return;
      if (!isSelectionInsideSingleAssistantMessage(selection)) return;

      try {
        event.clipboardData.setData(
          PROVENANCE_AI_SIDEBAR_CLIPBOARD_MIME,
          JSON.stringify(
            createProvenanceClipboardPayload({
              documentId,
              sessionToken: clipboardSessionToken,
            })
          )
        );
      } catch {
        // Ignore browsers that block custom clipboard mime writes.
      }
    },
    [clipboardSessionToken, documentId]
  );

  return (
    <div className="flex h-full flex-col bg-muted">
      <ChatHeader
        threads={threads}
        activeThreadId={activeThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
        onClose={onClose}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

      <div className="flex-1 overflow-y-auto px-4 py-5" onCopy={handleCopy}>
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="flex flex-col gap-4">
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
        wordCount={wordCount}
        hasMessages={messages.length > 0}
      />
    </div>
  );
}

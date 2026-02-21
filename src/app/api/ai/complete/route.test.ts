import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockToUIMessageStreamResponse = vi.fn(
    () => new Response("stream", { status: 200 })
  );
  const mockDbWhere = vi.fn().mockResolvedValue([{ aiProvider: "anthropic", aiModel: null }]);
  const mockDbFrom = vi.fn(() => ({ where: mockDbWhere }));
  const mockDbSelect = vi.fn(() => ({ from: mockDbFrom }));
  return {
    mockAuth: vi.fn(),
    mockStreamText: vi.fn(() => ({
      toUIMessageStreamResponse: mockToUIMessageStreamResponse,
    })),
    mockToUIMessageStreamResponse,
    mockGetModel: vi.fn(() => "mock-model"),
    mockIsValidModel: vi.fn(() => true),
    mockCheckRateLimit: vi.fn(),
    mockConvertToModelMessages: vi.fn((msgs: unknown) => msgs),
    mockDbSelect,
    mockDbFrom,
    mockDbWhere,
  };
});

vi.mock("@/auth", () => ({
  auth: mocks.mockAuth,
}));

vi.mock("ai", () => ({
  streamText: mocks.mockStreamText,
  convertToModelMessages: mocks.mockConvertToModelMessages,
}));

vi.mock("@/lib/ai/providers", () => ({
  getModel: mocks.mockGetModel,
  isValidModel: mocks.mockIsValidModel,
  providers: {
    anthropic: {
      id: "anthropic",
      name: "Anthropic",
      defaultModel: "claude-sonnet-4-5",
      models: [],
    },
    openai: {
      id: "openai",
      name: "OpenAI",
      defaultModel: "gpt-4o",
      models: [],
    },
  },
}));

vi.mock("@/lib/ai/rate-limit", () => ({
  checkRateLimit: mocks.mockCheckRateLimit,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.mockDbSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  users: {
    id: "id",
    aiProvider: "ai_provider",
    aiModel: "ai_model",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col, val) => ({ _eq: val })),
}));

import { POST } from "./route";

function createRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/ai/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockAuth.mockResolvedValue({
      user: { id: "user-1", name: "Test User", email: "test@test.com" },
    });
    mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mocks.mockIsValidModel.mockReturnValue(true);
    mocks.mockToUIMessageStreamResponse.mockReturnValue(
      new Response("stream", { status: 200 })
    );
    mocks.mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: mocks.mockToUIMessageStreamResponse,
    });
  });

  it("should return 401 when unauthenticated", async () => {
    mocks.mockAuth.mockResolvedValue(null);
    const req = createRequest({
      prompt: "test",
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 when required fields are missing", async () => {
    const req = createRequest({ prompt: "test" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid provider", async () => {
    const req = createRequest({
      prompt: "test",
      mode: "inline",
      provider: "invalid",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid mode", async () => {
    const req = createRequest({
      prompt: "test",
      mode: "unknown",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when prompt exceeds max length", async () => {
    const req = createRequest({
      prompt: "x".repeat(10_001),
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when context exceeds max length", async () => {
    const req = createRequest({
      prompt: "test",
      context: "x".repeat(100_001),
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when neither prompt nor messages provided", async () => {
    const req = createRequest({
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid model", async () => {
    mocks.mockIsValidModel.mockReturnValue(false);
    const req = createRequest({
      prompt: "test",
      mode: "inline",
      provider: "anthropic",
      model: "nonexistent-model",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should call streamText and return streaming response", async () => {
    const req = createRequest({
      prompt: "improve this text",
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mocks.mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-model",
        system: expect.any(String),
        prompt: expect.stringContaining("improve this text"),
      })
    );
    expect(mocks.mockToUIMessageStreamResponse).toHaveBeenCalled();
  });

  it("should handle blocked/refused requests with metadata", async () => {
    const req = createRequest({
      prompt: "test",
      mode: "inline",
      provider: "anthropic",
    });
    await POST(req);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = (mocks.mockToUIMessageStreamResponse.mock.calls as any[][])[0]?.[0] as Record<string, (...args: unknown[]) => unknown> | undefined;
    expect(callArgs).toHaveProperty("messageMetadata");

    // Simulate a content-filter finish event
    const metadata = callArgs!.messageMetadata({
      part: { type: "finish", finishReason: "content-filter" },
    });
    expect(metadata).toEqual(
      expect.objectContaining({ blocked: true })
    );

    // Normal finish should not return blocked metadata
    const normalMetadata = callArgs!.messageMetadata({
      part: { type: "finish", finishReason: "stop" },
    });
    expect(normalMetadata).toBeUndefined();
  });

  it("should return 429 when rate limited", async () => {
    mocks.mockCheckRateLimit.mockResolvedValue({ allowed: false });
    const req = createRequest({
      prompt: "test",
      mode: "inline",
      provider: "anthropic",
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("should include selectedText in prompt when provided", async () => {
    const req = createRequest({
      prompt: "make it formal",
      selectedText: "hey whats up",
      mode: "inline",
      provider: "anthropic",
    });
    await POST(req);

    expect(mocks.mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("hey whats up"),
      })
    );
  });

  it("should use convertToModelMessages when messages array is provided", async () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const req = createRequest({
      messages,
      mode: "side_panel",
      provider: "openai",
    });
    await POST(req);

    expect(mocks.mockConvertToModelMessages).toHaveBeenCalledWith(
      messages
    );
    expect(mocks.mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages,
      })
    );
  });

  it("should inject context into system prompt for messages mode", async () => {
    const messages = [
      { role: "user", content: "Summarize the document" },
    ];
    const req = createRequest({
      messages,
      context: "This is the document content.",
      mode: "side_panel",
      provider: "anthropic",
    });
    await POST(req);

    expect(mocks.mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Document context:\nThis is the document content."),
        messages,
      })
    );
  });

  it("should handle useChat DefaultChatTransport format with parts instead of content", async () => {
    // Exact format sent by useChat + DefaultChatTransport
    const messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello, what is this document about?" }],
        createdAt: "2026-02-21T12:00:00.000Z",
      },
    ];
    const req = createRequest({
      id: "chat-123",
      messages,
      mode: "side_panel",
      provider: "anthropic",
      context: JSON.stringify({ type: "doc", content: [] }),
      trigger: "user",
      messageId: "msg-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mocks.mockConvertToModelMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          parts: [{ type: "text", text: "Hello, what is this document about?" }],
        }),
      ])
    );
  });
});

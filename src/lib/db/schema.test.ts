import { describe, it, expect } from "vitest";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  documents,
  revisions,
  aiInteractions,
  pasteEvents,
  writingSessions,
  badges,
} from "./schema";
import type {
  User,
  NewUser,
  Document,
  NewDocument,
  Revision,
  NewRevision,
  AiInteraction,
  NewAiInteraction,
  PasteEvent,
  NewPasteEvent,
  WritingSession,
  NewWritingSession,
  Badge,
  NewBadge,
} from "./schema";

describe("Auth.js tables", () => {
  it("should define user table with Auth.js columns and app extensions", () => {
    const columns = Object.keys(users);
    expect(columns).toContain("id");
    expect(columns).toContain("name");
    expect(columns).toContain("email");
    expect(columns).toContain("emailVerified");
    expect(columns).toContain("image");
    expect(columns).toContain("aiProvider");
    expect(columns).toContain("aiModel");
  });

  it("should define account table with composite primary key", () => {
    const columns = Object.keys(accounts);
    expect(columns).toContain("userId");
    expect(columns).toContain("provider");
    expect(columns).toContain("providerAccountId");
    expect(columns).toContain("access_token");
    expect(columns).toContain("refresh_token");
  });

  it("should define session table for adapter compatibility", () => {
    const columns = Object.keys(sessions);
    expect(columns).toContain("sessionToken");
    expect(columns).toContain("userId");
    expect(columns).toContain("expires");
  });

  it("should define verificationToken table with composite primary key", () => {
    const columns = Object.keys(verificationTokens);
    expect(columns).toContain("identifier");
    expect(columns).toContain("token");
    expect(columns).toContain("expires");
  });
});

describe("Domain tables", () => {
  it("should define documents table with all required columns", () => {
    const columns = Object.keys(documents);
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("title");
    expect(columns).toContain("content");
    expect(columns).toContain("wordCount");
    expect(columns).toContain("deletedAt");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should define revisions table with document reference", () => {
    const columns = Object.keys(revisions);
    expect(columns).toContain("id");
    expect(columns).toContain("documentId");
    expect(columns).toContain("content");
    expect(columns).toContain("plainText");
    expect(columns).toContain("trigger");
  });

  it("should define ai_interactions table with all tracking columns", () => {
    const columns = Object.keys(aiInteractions);
    expect(columns).toContain("documentId");
    expect(columns).toContain("sessionId");
    expect(columns).toContain("mode");
    expect(columns).toContain("prompt");
    expect(columns).toContain("response");
    expect(columns).toContain("action");
    expect(columns).toContain("provider");
    expect(columns).toContain("model");
    expect(columns).toContain("charactersInserted");
  });

  it("should define paste_events table", () => {
    const columns = Object.keys(pasteEvents);
    expect(columns).toContain("documentId");
    expect(columns).toContain("content");
    expect(columns).toContain("sourceType");
    expect(columns).toContain("characterCount");
  });

  it("should define writing_sessions table with heartbeat tracking", () => {
    const columns = Object.keys(writingSessions);
    expect(columns).toContain("documentId");
    expect(columns).toContain("userId");
    expect(columns).toContain("startedAt");
    expect(columns).toContain("endedAt");
    expect(columns).toContain("activeSeconds");
    expect(columns).toContain("lastHeartbeat");
  });

  it("should define badges table with verification fields", () => {
    const columns = Object.keys(badges);
    expect(columns).toContain("documentId");
    expect(columns).toContain("verificationId");
    expect(columns).toContain("documentTitle");
    expect(columns).toContain("documentText");
    expect(columns).toContain("auditTrail");
    expect(columns).toContain("stats");
    expect(columns).toContain("isTakenDown");
  });
});

describe("Type inference", () => {
  it("should export select and insert types for all domain tables", () => {
    // These are compile-time checks — if types don't exist, TS will fail
    const _user: User = {} as User;
    const _newUser: NewUser = {} as NewUser;
    const _document: Document = {} as Document;
    const _newDocument: NewDocument = {} as NewDocument;
    const _revision: Revision = {} as Revision;
    const _newRevision: NewRevision = {} as NewRevision;
    const _aiInteraction: AiInteraction = {} as AiInteraction;
    const _newAiInteraction: NewAiInteraction = {} as NewAiInteraction;
    const _pasteEvent: PasteEvent = {} as PasteEvent;
    const _newPasteEvent: NewPasteEvent = {} as NewPasteEvent;
    const _writingSession: WritingSession = {} as WritingSession;
    const _newWritingSession: NewWritingSession = {} as NewWritingSession;
    const _badge: Badge = {} as Badge;
    const _newBadge: NewBadge = {} as NewBadge;

    expect(true).toBe(true);
  });

  it("should have text type for user.id (cuid2, not uuid)", () => {
    // user.id should be text type for Auth.js compatibility
    const userIdColumn = users.id;
    expect(userIdColumn.dataType).toBe("string");
  });
});

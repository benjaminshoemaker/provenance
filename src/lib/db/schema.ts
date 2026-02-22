import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ─── Auth.js Managed Tables ─────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // App-specific extensions:
  aiProvider: text("ai_provider").default("anthropic"),
  aiModel: text("ai_model"),
});

export const accounts = pgTable("account", {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ─── Domain Tables ──────────────────────────────────────────────────────────

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull().default("Untitled"),
    content: jsonb("content")
      .notNull()
      .default('{"type":"doc","content":[{"type":"paragraph"}]}'),
    wordCount: integer("word_count").default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("documents_user_updated_idx").on(table.userId, table.updatedAt)]
);

export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    content: jsonb("content").notNull(),
    plainText: text("plain_text").notNull(),
    trigger: text("trigger").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("revisions_document_created_idx").on(table.documentId, table.createdAt)]
);

export const aiInteractions = pgTable(
  "ai_interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    sessionId: uuid("session_id").references(() => writingSessions.id),
    mode: text("mode").notNull(),
    prompt: text("prompt").notNull(),
    selectedText: text("selected_text"),
    response: text("response").notNull(),
    action: text("action").notNull(),
    documentDiff: jsonb("document_diff"),
    charactersInserted: integer("characters_inserted").default(0),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("ai_interactions_document_created_idx").on(table.documentId, table.createdAt)]
);

export const pasteEvents = pgTable(
  "paste_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    sessionId: uuid("session_id").references(() => writingSessions.id),
    content: text("content").notNull(),
    sourceType: text("source_type").notNull(),
    characterCount: integer("character_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("paste_events_document_created_idx").on(table.documentId, table.createdAt)]
);

export const writingSessions = pgTable(
  "writing_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    activeSeconds: integer("active_seconds").default(0),
    lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),
  },
  (table) => [
    index("writing_sessions_document_idx").on(table.documentId),
    index("writing_sessions_user_idx").on(table.userId),
  ]
);

export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    verificationId: text("verification_id").notNull().unique(),
    documentTitle: text("document_title").notNull(),
    documentText: text("document_text").notNull(),
    documentContent: jsonb("document_content").notNull(),
    auditTrail: jsonb("audit_trail").notNull(),
    stats: jsonb("stats").notNull(),
    imageUrl: text("image_url"),
    isTakenDown: boolean("is_taken_down").default(false),
    takedownReason: text("takedown_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("badges_document_created_idx").on(table.documentId, table.createdAt)]
);

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull().default("New conversation"),
    messages: jsonb("messages").notNull().default([]),
    mode: text("mode").notNull().default("ask"),
    summary: jsonb("summary"),
    model: text("model"),
    messageCount: integer("message_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("chat_threads_document_idx").on(table.documentId, table.updatedAt),
  ]
);

export const aiRequestLog = pgTable(
  "ai_request_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("ai_request_log_user_created_idx").on(table.userId, table.createdAt)]
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  documents: many(documents),
  writingSessions: many(writingSessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  revisions: many(revisions),
  aiInteractions: many(aiInteractions),
  pasteEvents: many(pasteEvents),
  writingSessions: many(writingSessions),
  badges: many(badges),
  chatThreads: many(chatThreads),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  document: one(documents, {
    fields: [revisions.documentId],
    references: [documents.id],
  }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  document: one(documents, {
    fields: [aiInteractions.documentId],
    references: [documents.id],
  }),
  writingSession: one(writingSessions, {
    fields: [aiInteractions.sessionId],
    references: [writingSessions.id],
  }),
}));

export const pasteEventsRelations = relations(pasteEvents, ({ one }) => ({
  document: one(documents, {
    fields: [pasteEvents.documentId],
    references: [documents.id],
  }),
  writingSession: one(writingSessions, {
    fields: [pasteEvents.sessionId],
    references: [writingSessions.id],
  }),
}));

export const writingSessionsRelations = relations(
  writingSessions,
  ({ one, many }) => ({
    document: one(documents, {
      fields: [writingSessions.documentId],
      references: [documents.id],
    }),
    user: one(users, {
      fields: [writingSessions.userId],
      references: [users.id],
    }),
    aiInteractions: many(aiInteractions),
    pasteEvents: many(pasteEvents),
  })
);

export const badgesRelations = relations(badges, ({ one }) => ({
  document: one(documents, {
    fields: [badges.documentId],
    references: [documents.id],
  }),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one }) => ({
  document: one(documents, {
    fields: [chatThreads.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id],
  }),
}));

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;

export type AiInteraction = typeof aiInteractions.$inferSelect;
export type NewAiInteraction = typeof aiInteractions.$inferInsert;

export type PasteEvent = typeof pasteEvents.$inferSelect;
export type NewPasteEvent = typeof pasteEvents.$inferInsert;

export type WritingSession = typeof writingSessions.$inferSelect;
export type NewWritingSession = typeof writingSessions.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type ChatThread = typeof chatThreads.$inferSelect;
export type NewChatThread = typeof chatThreads.$inferInsert;

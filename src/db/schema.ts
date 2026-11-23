import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Игровые данные хранятся построчно: одна строка = одна сущность (jsonb).
 * Движок игры (src/server/engine.ts) загружает их, применяет действие и записывает только изменившиеся строки.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
});

export const saves = pgTable("saves", {
  userId: integer("user_id").primaryKey(),
  data: jsonb("data").notNull(),
});

export const listings = pgTable("listings", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
});

export const likes = pgTable("likes", {
  targetId: integer("target_id").primaryKey(),
  data: jsonb("data").notNull(),
});

export const reports = pgTable("reports", {
  id: integer("id").primaryKey(),
  data: jsonb("data").notNull(),
});

export const logs = pgTable(
  "logs",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id").notNull(),
    data: jsonb("data").notNull(),
  },
  (t) => [index("logs_user_idx").on(t.userId)],
);

export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { pgTable, text, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";

export const duelSessions = pgTable("duel_sessions", {
  id: varchar("id", { length: 24 }).primaryKey(),
  state: jsonb("state").notNull(),         // full GameState JSON
  playerAToken: text("player_a_token").notNull(),
  playerBToken: text("player_b_token"),    // null until friend joins
  inviteCode: varchar("invite_code", { length: 8 }).unique(),
  mode: varchar("mode", { length: 16 }).notNull().default("house"), // "house" | "pvp"
  status: varchar("status", { length: 16 }).notNull().default("waiting"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

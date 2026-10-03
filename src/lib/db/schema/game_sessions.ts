import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

export const gameSessions = pgTable("game_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // Anonymous sessions supported
  score: integer("score").default(0).notNull(),
  questionsAnswered: integer("questions_answered").default(0).notNull(),
  correctAnswers: integer("correct_answers").default(0).notNull(),
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id), // Null if cross-category
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

import { pgTable, timestamp, varchar, integer, boolean, index } from "drizzle-orm/pg-core";
import { gameSessions } from "./game_sessions";
import { entities } from "./entities";
import { stats } from "./stats";

export const gameQuestions = pgTable("game_questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
  entityAId: varchar("entity_a_id", { length: 36 }).notNull().references(() => entities.id),
  entityBId: varchar("entity_b_id", { length: 36 }).notNull().references(() => entities.id),
  statId: varchar("stat_id", { length: 36 }).notNull().references(() => stats.id),
  correctEntityId: varchar("correct_entity_id", { length: 36 }).notNull().references(() => entities.id),
  userAnswerEntityId: varchar("user_answer_entity_id", { length: 36 }).references(() => entities.id), // Null if unanswered or skipped
  isCorrect: boolean("is_correct"), // Null until answered
  pointsAwarded: integer("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("game_questions_session_id_idx").on(table.sessionId),
}));

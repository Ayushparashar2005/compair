import { pgTable, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userStats = pgTable("user_stats", {
  userId: varchar("user_id", { length: 36 }).primaryKey().references(() => users.id, { onDelete: "cascade" }),
  gamesPlayed: integer("games_played").default(0).notNull(),
  questionsAnswered: integer("questions_answered").default(0).notNull(),
  correctAnswers: integer("correct_answers").default(0).notNull(),
  bestScore: integer("best_score").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

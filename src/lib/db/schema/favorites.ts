import { pgTable, timestamp, varchar, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { entities } from "./entities";

export const favorites = pgTable("favorites", {
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  entityId: varchar("entity_id", { length: 36 }).notNull().references(() => entities.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.entityId] }),
}));

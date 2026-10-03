import { pgTable, text, varchar } from "drizzle-orm/pg-core";

export const stats = pgTable("stats", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  unit: varchar("unit", { length: 20 }),
  description: text("description"),
  formatType: varchar("format_type", { length: 20 }).notNull().default("number"), // 'number' | 'range' | 'currency'
});

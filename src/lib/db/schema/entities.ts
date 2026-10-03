import { pgTable, text, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const entities = pgTable("entities", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: varchar("category_id", { length: 36 }).notNull().references(() => categories.id, { onDelete: "cascade" }),
  subType: varchar("sub_type", { length: 50 }),
  description: text("description"),
  imageUrl: text("image_url"),
  localImagePath: text("local_image_path"),
  emoji: varchar("emoji", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdIdx: index("entities_category_id_idx").on(table.categoryId),
  slugIdx: index("entities_slug_idx").on(table.slug),
  nameIdx: index("entities_name_idx").on(table.name),
}));

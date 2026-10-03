import { pgTable, text, varchar, real, index } from "drizzle-orm/pg-core";
import { entities } from "./entities";
import { stats } from "./stats";

export const entityStats = pgTable("entity_stats", {
  id: varchar("id", { length: 36 }).primaryKey(),
  entityId: varchar("entity_id", { length: 36 }).notNull().references(() => entities.id, { onDelete: "cascade" }),
  statId: varchar("stat_id", { length: 36 }).notNull().references(() => stats.id, { onDelete: "cascade" }),
  value: real("value").notNull(),
  minValue: real("min_value"),
  maxValue: real("max_value"),
  source: text("source"),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
}, (table) => ({
  entityIdIdx: index("entity_id_idx").on(table.entityId),
  statIdIdx: index("stat_id_idx").on(table.statId),
  entityStatComposite: index("entity_stat_composite_idx").on(table.entityId, table.statId),
  statEntityComposite: index("stat_entity_composite_idx").on(table.statId, table.entityId),
}));

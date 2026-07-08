import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { schemas } from './schemas';

export const schemaFieldAnnotations = pgTable('schema_field_annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaId: uuid('schema_id')
    .notNull()
    .references(() => schemas.id, { onDelete: 'cascade' }),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  columnName: varchar('column_name', { length: 255 }).notNull(),
  jsonStructure: text('json_structure').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SchemaFieldAnnotation = typeof schemaFieldAnnotations.$inferSelect;
export type NewSchemaFieldAnnotation = typeof schemaFieldAnnotations.$inferInsert;

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { schemas } from './schemas';
import { users } from './users';

export const generations = pgTable('generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  schemaId: uuid('schema_id')
    .references(() => schemas.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

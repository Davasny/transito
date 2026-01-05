import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  state: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),

  stripeCustomerId: text(),
});

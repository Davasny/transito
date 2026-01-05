import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
  connection: "postgresql://transito:transito_password@localhost:5432/transito",
});

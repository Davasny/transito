import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./schema.ts",
  dbCredentials: {
    url: "postgresql://transito:transito_password@localhost:5432/transito",
  },
});

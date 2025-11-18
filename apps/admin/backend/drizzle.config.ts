import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../../packages/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_SQL_URL!,
  },
});

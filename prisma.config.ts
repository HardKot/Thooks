import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "node:path";

const defaultSqliteUrl = `file:${path.join(__dirname, "./datasource.sqlite")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || defaultSqliteUrl,
  },
});

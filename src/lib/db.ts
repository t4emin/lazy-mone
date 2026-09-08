import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function getDb() {
  if (!globalDb.prisma) {
    globalDb.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: getEnv().DATABASE_URL,
        max: 5,
      }),
    });
  }
  return globalDb.prisma;
}

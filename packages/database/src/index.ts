import { PrismaClient } from '@prisma/client';
import {
  CommodityType,
  CommodityGrade,
  MeasurementUnit,
  CollectionStatus,
  CreditStatus,
  WalletType,
  TransactionType,
  ReferenceType,
  EntryDirection,
  UserRole
} from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';

// Explicitly re-export enums for Prisma 6 compatibility
export {
  CommodityType,
  CommodityGrade,
  MeasurementUnit,
  CollectionStatus,
  CreditStatus,
  WalletType,
  TransactionType,
  ReferenceType,
  EntryDirection,
  UserRole
};

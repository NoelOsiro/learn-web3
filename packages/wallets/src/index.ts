import { EntryDirection, Prisma, prisma, ReferenceType, TransactionType, WalletType } from '@cashflow/database';
import { decimalSchema, paginationSchema, uuidSchema } from '@cashflow/shared';
import { z } from 'zod';

export const transferFundsSchema = z.object({
  tenantId: uuidSchema, debitWalletId: uuidSchema, creditWalletId: uuidSchema, amount: decimalSchema.refine((amount) => new Prisma.Decimal(amount).greaterThan(0), 'Amount must be greater than zero'),
  type: z.nativeEnum(TransactionType), referenceType: z.nativeEnum(ReferenceType).optional(), referenceId: uuidSchema.optional(), description: z.string().trim().max(500).optional(),
});
export type TransferFundsInput = z.input<typeof transferFundsSchema>;

export async function getOrCreateFarmerWallet(tenantId: string, farmerId: string) {
  const farmer = await prisma.farmer.findFirst({ where: { id: farmerId, tenantId, deletedAt: null } });
  if (!farmer) throw new Error('Farmer not found');
  return prisma.wallet.upsert({ where: { farmerId }, create: { tenantId, farmerId, type: WalletType.FARMER }, update: {} });
}

export async function transferFunds(input: TransferFundsInput) {
  const data = transferFundsSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const wallets = await tx.wallet.findMany({ where: { id: { in: [data.debitWalletId, data.creditWalletId] }, tenantId: data.tenantId, deletedAt: null } });
    const debitWallet = wallets.find((wallet) => wallet.id === data.debitWalletId);
    const creditWallet = wallets.find((wallet) => wallet.id === data.creditWalletId);
    if (!debitWallet || !creditWallet) throw new Error('Both wallets must belong to this tenant');
    if (debitWallet.id === creditWallet.id) throw new Error('Debit and credit wallets must differ');
    if (debitWallet.currency !== creditWallet.currency) throw new Error('Cross-currency transfers are not supported');
    const amount = new Prisma.Decimal(data.amount);
    if (debitWallet.cachedBalance.lessThan(amount)) throw new Error('Insufficient wallet balance');
    const transaction = await tx.transaction.create({ data: { tenantId: data.tenantId, type: data.type, amount: data.amount, currency: debitWallet.currency, referenceType: data.referenceType, referenceId: data.referenceId, description: data.description } });
    await tx.ledgerEntry.createMany({ data: [
      { transactionId: transaction.id, walletId: debitWallet.id, direction: EntryDirection.DEBIT, amount: data.amount, currency: debitWallet.currency },
      { transactionId: transaction.id, walletId: creditWallet.id, direction: EntryDirection.CREDIT, amount: data.amount, currency: creditWallet.currency },
    ] });
    await tx.wallet.update({ where: { id: debitWallet.id }, data: { cachedBalance: { decrement: data.amount }, version: { increment: 1 } } });
    await tx.wallet.update({ where: { id: creditWallet.id }, data: { cachedBalance: { increment: data.amount }, version: { increment: 1 } } });
    return transaction;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listWalletTransactions(tenantId: string, walletId: string) {
  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, tenantId, deletedAt: null } });
  if (!wallet) throw new Error('Wallet not found');
  return prisma.ledgerEntry.findMany({ where: { walletId }, include: { transaction: true }, orderBy: { createdAt: 'desc' } });
}

export async function listWallets(
  tenantId: string,
  input: {
    search?: string;
    channel?: string;
    status?: string;
  } = {}
) {
  const { page, limit } = paginationSchema.parse(input);
  
  const search = input.search?.trim();

   // Handle derived status mapping

  const where: Prisma.WalletWhereInput = {
    tenantId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { farmer: { name: { contains: search, mode: 'insensitive' } } },
            { farmer: { code: { contains: search, mode: 'insensitive' } } },
            { farmer: { phoneE164: { contains: search } } },
          ],
        }
      : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.wallet.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        farmer: true,
        entries: {
          include: { transaction: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.wallet.count({ where }),
  ]);
  return {  data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


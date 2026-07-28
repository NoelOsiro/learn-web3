import { CreditStatus, Prisma, prisma, CommodityType } from '@cashflow/database';
import { decimalSchema, paginationSchema, uuidSchema } from '@cashflow/shared';
import { transferFunds } from '@cashflow/wallets';
import { z } from 'zod';

export const createCreditSchema = z.object({
  tenantId: uuidSchema, farmerId: uuidSchema, providerId: uuidSchema.optional(), collectionId: uuidSchema.optional(), valuationId: uuidSchema.optional(),
  amount: decimalSchema.refine((amount) => new Prisma.Decimal(amount).greaterThan(0)), interestRate: decimalSchema, termMonths: z.coerce.number().int().positive().max(120), startDate: z.coerce.date(), endDate: z.coerce.date(), purpose: z.string().trim().max(500).optional(), notes: z.string().trim().max(1000).optional(),
});
export type CreateCreditInput = z.input<typeof createCreditSchema>;

export async function createCreditApplication(input: CreateCreditInput) {
  const data = createCreditSchema.parse(input);
  if (data.endDate <= data.startDate) throw new Error('Credit end date must be after start date');
  const farmer = await prisma.farmer.findFirst({ where: { id: data.farmerId, tenantId: data.tenantId, deletedAt: null, isActive: true } });
  if (!farmer) throw new Error('Active farmer not found');
  return prisma.credit.create({ data });
}

export async function listCreditFacilities(
  tenantId: string,
  input: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    centerId?: string;
    userId?: string;
  } = {}
) {
  const { page, limit } = paginationSchema.parse(input);
  const search = input.search?.trim();
  const status = input.status?.toUpperCase();

  // Handle derived status mapping
  let statusWhere: Prisma.CreditWhereInput = {};
  if (status === 'ACTIVE') {
    statusWhere = { status: CreditStatus.ACTIVE };
  } else if (status === 'PENDING') {
    statusWhere = { status: CreditStatus.PENDING };
  } else if (status === 'APPROVED') {
    statusWhere = { status: CreditStatus.APPROVED };
  } else if (status === 'DEFAULTED') {
    statusWhere = { status: CreditStatus.DEFAULTED };
  } else if (status === 'PAID') {
    statusWhere = { status: CreditStatus.PAID };
  }

  const where: Prisma.CreditWhereInput = {
    tenantId,
    deletedAt: null,
    ...statusWhere,
    ...(search ? {
      OR: [
        { farmer: { name: { contains: search, mode: 'insensitive' } } },
        { farmer: { code: { contains: search, mode: 'insensitive' } } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(input?.centerId ? { collection: { centerId: input.centerId } } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.credit.findMany({
      where,
      include: { farmer: true, collection: true, valuation: true, repayments: { where: { deletedAt: null } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.credit.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}


export async function approveCredit(tenantId: string, creditId: string) {
  const credit = await prisma.credit.findFirst({ where: { id: creditId, tenantId, deletedAt: null } });
  if (!credit) throw new Error('Credit not found');
  if (credit.status !== CreditStatus.PENDING) throw new Error('Only pending credit can be approved');
  return prisma.credit.update({ where: { id: credit.id }, data: { status: CreditStatus.APPROVED, version: { increment: 1 } } });
}

export async function disburseCredit(tenantId: string, creditId: string, sourceWalletId: string) {
  const credit = await prisma.credit.findFirst({ where: { id: creditId, tenantId, deletedAt: null }, include: { farmer: { include: { wallets: { where: { deletedAt: null } } } } } });
  if (!credit) throw new Error('Credit not found');
  if (credit.status !== CreditStatus.APPROVED) throw new Error('Only approved credit can be disbursed');
  const farmerWallet = await prisma.wallet.findFirst({ where: { farmerId: credit.farmer.id, deletedAt: null } });
  if (!farmerWallet) throw new Error('Farmer wallet not found');
  const transaction = await transferFunds({ tenantId, debitWalletId: sourceWalletId, creditWalletId: farmerWallet.id, amount: credit.amount.toString(), type: 'LOAN_DISBURSEMENT', referenceType: 'CREDIT', referenceId: credit.id, description: `Credit disbursement for ${credit.farmer.name}` });
  await prisma.credit.update({ where: { id: credit.id }, data: { status: CreditStatus.ACTIVE, version: { increment: 1 } } });
  return transaction;
}

export async function recordRepayment(tenantId: string, creditId: string, input: { amount: string; method: string; reference?: string; notes?: string }) {
  const amount = decimalSchema.refine((value) => new Prisma.Decimal(value).greaterThan(0)).parse(input.amount);
  const credit = await prisma.credit.findFirst({ where: { id: creditId, tenantId, deletedAt: null } });
  if (!credit || credit.status !== CreditStatus.ACTIVE) throw new Error('Active credit not found');
  return prisma.repayment.create({ data: { creditId, amount, method: input.method.trim(), reference: input.reference?.trim(), notes: input.notes?.trim() } });
}

// ── Price Book Functions ─────────────────────────────────────────────────────

export const createPriceBookSchema = z.object({
  tenantId: uuidSchema,
  name: z.string().trim().min(1).max(200),
  commodity: z.nativeEnum(CommodityType),
  isDefault: z.boolean().optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().optional(),
  lines: z.array(
    z.object({
      grade: z.string(),
      unit: z.string(),
      pricePerUnit: z.string().refine((val) => parseFloat(val) > 0),
      currency: z.string().default('KES'),
    })
  ).min(1),
});
export type CreatePriceBookInput = z.input<typeof createPriceBookSchema>;

export async function listPriceBooks(
  tenantId: string,
  input: {
    page?: number;
    limit?: number;
    search?: string;
    commodity?: CommodityType;
    active?: boolean;
  } = {}
) {
  const { page, limit } = paginationSchema.parse(input);
  const search = input.search?.trim();

  const where: Prisma.PriceBookWhereInput = {
    tenantId,
    deletedAt: null,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(input.commodity ? { commodity: input.commodity } : {}),
    ...(input.active !== undefined ? { isDefault: input.active } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.priceBook.findMany({
      where,
      include: {
        lines: {
          orderBy: { grade: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.priceBook.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getActivePriceBooks(tenantId: string) {
  return prisma.priceBook.findMany({
    where: {
      tenantId,
      deletedAt: null,
      isDefault: true,
    },
    include: {
      lines: true,
    },
  });
}

export async function getPriceBookById(tenantId: string, id: string) {
  return prisma.priceBook.findFirst({
    where: {
      id,
      tenantId,
      deletedAt: null
    },
    include: {
      lines: true,
    },
  });
}

export async function createPriceBook(input: CreatePriceBookInput) {
  const data = createPriceBookSchema.parse(input);
  if (data.validTo && data.validTo <= data.validFrom) throw new Error('Valid to date must be after valid from date');

  // If setting as default, unset other defaults for this commodity
  if (data.isDefault) {
    await prisma.priceBook.updateMany({
      where: {
        tenantId: data.tenantId,
        commodity: data.commodity,
        isDefault: true,
        deletedAt: null,
      },
      data: { isDefault: false },
    });
  }

  return prisma.priceBook.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      commodity: data.commodity,
      isDefault: data.isDefault || false,
      validFrom: data.validFrom,
      validTo: data.validTo,
      lines: {
        create: data.lines.map((line) => ({
          grade: line.grade as any,
          unit: line.unit as any,
          pricePerUnit: new Prisma.Decimal(line.pricePerUnit),
          currency: line.currency,
        })),
      },
    },
    include: {
      lines: true,
    },
  });
}

export async function updatePriceBook(
  tenantId: string,
  id: string,
  input: {
    name?: string;
    commodity?: CommodityType;
    isDefault?: boolean;
    validFrom?: Date;
    validTo?: Date;
    lines?: Array<{
      id?: string;
      grade: string;
      unit: string;
      pricePerUnit: string;
      currency: string;
    }>;
  }
) {
  const existing = await prisma.priceBook.findFirst({
    where: { id, tenantId, deletedAt: null },
  });

  if (!existing) throw new Error('Price book not found');

  if (input.validTo && input.validFrom && input.validTo <= input.validFrom) {
    throw new Error('Valid to date must be after valid from date');
  }

  // If setting as default, unset other defaults for this commodity
  if (input.isDefault === true) {
    await prisma.priceBook.updateMany({
      where: {
        tenantId,
        commodity: input.commodity || existing.commodity,
        isDefault: true,
        deletedAt: null,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  return prisma.$transaction(async (tx) => {
    // Delete existing lines if provided
    if (input.lines) {
      await tx.priceBookLine.deleteMany({
        where: { priceBookId: id },
      });
    }

    const { lines, ...updateData } = input;

    return tx.priceBook.update({
      where: { id },
      data: {
        ...updateData,
        ...(input.validFrom && { validFrom: input.validFrom }),
        ...(input.validTo !== undefined && { validTo: input.validTo }),
        ...(input.lines && {
          lines: {
            create: input.lines.map((line) => ({
              grade: line.grade as any,
              unit: line.unit as any,
              pricePerUnit: new Prisma.Decimal(line.pricePerUnit),
              currency: line.currency,
            })),
          },
        }),
      },
      include: {
        lines: true,
      },
    });
  });
}

export async function setDefaultPriceBook(tenantId: string, id: string) {
  const priceBook = await prisma.priceBook.findFirst({
    where: { id, tenantId, deletedAt: null },
  });

  if (!priceBook) throw new Error('Price book not found');

  await prisma.$transaction([
    // Unset other defaults for this commodity
    prisma.priceBook.updateMany({
      where: {
        tenantId,
        commodity: priceBook.commodity,
        isDefault: true,
        deletedAt: null,
        id: { not: id },
      },
      data: { isDefault: false },
    }),
    // Set this one as default
    prisma.priceBook.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  return priceBook;
}

export async function deletePriceBook(tenantId: string, id: string) {
  const priceBook = await prisma.priceBook.findFirst({
    where: { id, tenantId, deletedAt: null },
  });

  if (!priceBook) throw new Error('Price book not found');

  return prisma.priceBook.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

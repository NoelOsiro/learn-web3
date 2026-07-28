import { prisma, type Prisma } from '@cashflow/database';
import { emailSchema, paginationSchema, phoneSchema, uuidSchema } from '@cashflow/shared';
import { z } from 'zod';

export const createFarmerSchema = z.object({
  tenantId: uuidSchema,
  code: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(160),
  phoneE164: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().trim().max(500).optional(),
  location: z.string().trim().max(160).optional(),
  gpsCoordinates: z.string().trim().max(120).optional(),
  idNumber: z.string().trim().max(64).optional(),
});

export const updateFarmerSchema = createFarmerSchema.omit({ tenantId: true, code: true }).partial();

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;

export async function createFarmer(input: CreateFarmerInput) {
  const data = createFarmerSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.farmer.findFirst({ where: { tenantId: data.tenantId, deletedAt: null, OR: [{ phoneE164: data.phoneE164 }, ...(data.idNumber ? [{ idNumber: data.idNumber }] : [])] } });
    if (existing) throw new Error('A farmer with this phone or identity number already exists');
    const farmer = await tx.farmer.create({ data });
    return farmer;
  });
}

export async function getFarmer(tenantId: string, farmerId: string) {
  return prisma.farmer.findFirst({ where: { id: farmerId, tenantId, deletedAt: null }, include: { wallets: true } });
}

export async function listFarmers(
  tenantId: string, 
  input: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string; // Add status parameter
  } = {}
) {
  const { page, limit } = paginationSchema.parse(input);
  const search = input.search?.trim();
  const status = input.status?.toUpperCase();

  // Handle derived status mapping
  let statusWhere: Prisma.FarmerWhereInput = {};
  if (status === 'SUSPENDED') {
    statusWhere = { isActive: false };
  } else if (status === 'PENDING') {
    statusWhere = { isActive: true, idNumber: null };
  } else if (status === 'VERIFIED') {
    statusWhere = { isActive: true, idNumber: { not: null } };
  }

  const where: Prisma.FarmerWhereInput = {
    tenantId,
    deletedAt: null,
    ...statusWhere,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { phoneE164: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.farmer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        wallets: true,
        credits: {
          where: { deletedAt: null, status: { in: ['APPROVED', 'ACTIVE'] } },
          select: { amount: true },
        },
      },
    }),
    prisma.farmer.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
export async function updateFarmer(tenantId: string, farmerId: string, input: UpdateFarmerInput) {
  const data = updateFarmerSchema.parse(input);
  const farmer = await getFarmer(tenantId, farmerId);
  if (!farmer) throw new Error('Farmer not found');
  return prisma.farmer.update({ where: { id: farmer.id }, data });
}

export async function archiveFarmer(tenantId: string, farmerId: string) {
  const farmer = await getFarmer(tenantId, farmerId);
  if (!farmer) throw new Error('Farmer not found');
  return prisma.farmer.update({ where: { id: farmer.id }, data: { isActive: false, deletedAt: new Date() } });
}

export async function restoreFarmer(tenantId: string, farmerId: string) {
  const farmer = await prisma.farmer.findFirst({ where: { id: farmerId, tenantId, deletedAt: { not: null } } });
  if (!farmer) throw new Error('Farmer not found or not archived');
  return prisma.farmer.update({ where: { id: farmer.id }, data: { isActive: true, deletedAt: null } });
}

export async function getDashboardStats(tenantId: string) {
  const [farmerCount, collectionCount, activeCreditCount, totalWalletBalance] = await Promise.all([
    prisma.farmer.count({ where: { tenantId, deletedAt: null } }),
    prisma.collection.count({ where: { tenantId, deletedAt: null } }),
    prisma.credit.count({ where: { tenantId, status: 'ACTIVE', deletedAt: null } }),
    prisma.wallet.aggregate({ where: { tenantId, deletedAt: null }, _sum: { cachedBalance: true } }),
  ]);
  return { farmerCount, collectionCount, activeCreditCount, totalWalletBalance };
}

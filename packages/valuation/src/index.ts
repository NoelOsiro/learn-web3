import { CollectionStatus, Prisma, prisma } from '@cashflow/database';
import { decimalSchema, uuidSchema } from '@cashflow/shared';
import { z } from 'zod';

export const deductionSchema = z.object({ label: z.string().trim().min(1).max(100), amount: decimalSchema });
export const createValuationSchema = z.object({ tenantId: uuidSchema, collectionId: uuidSchema, deductions: z.array(deductionSchema).default([]), notes: z.string().trim().max(1000).optional() });
export type CreateValuationInput = z.input<typeof createValuationSchema>;

export async function valueCollection(input: CreateValuationInput) {
  const data = createValuationSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const collection = await tx.collection.findFirst({ where: { id: data.collectionId, tenantId: data.tenantId, deletedAt: null } });
    if (!collection) throw new Error('Collection not found');
    if (collection.status === CollectionStatus.CANCELLED || collection.status === CollectionStatus.PAID) throw new Error('Collection cannot be valuated in its current state');
    const grossAmount = collection.grossAmount;
    const deductionTotal = data.deductions.reduce((total, deduction) => total.plus(deduction.amount), new Prisma.Decimal(0));
    const netAmount = grossAmount.minus(deductionTotal);
    if (netAmount.isNegative()) throw new Error('Deductions cannot exceed the collection value');
    const valuation = await tx.valuation.create({ data: { tenantId: data.tenantId, collectionId: collection.id, grossAmount: grossAmount.toFixed(4), currency: collection.currency, deductions: data.deductions, netAmount: netAmount.toFixed(4), notes: data.notes } });
    await tx.collection.update({ where: { id: collection.id }, data: { deductions: deductionTotal.toFixed(4), netAmount: netAmount.toFixed(4), status: CollectionStatus.VALUATED } });
    return valuation;
  });
}

export async function listValuations(tenantId: string, collectionId?: string) {
  return prisma.valuation.findMany({ where: { tenantId, deletedAt: null, ...(collectionId ? { collectionId } : {}) }, include: { collection: { include: { farmer: true, center: true } } }, orderBy: { calculatedAt: 'desc' } });
}

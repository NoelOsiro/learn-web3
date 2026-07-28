import { NotificationType, prisma, type Prisma } from '@cashflow/database';
import { uuidSchema } from '@cashflow/shared';
import { z } from 'zod';

export const createNotificationSchema = z.object({ tenantId: uuidSchema, userId: uuidSchema.optional(), type: z.nativeEnum(NotificationType), title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(2000), metadata: z.record(z.unknown()).optional() });
export type CreateNotificationInput = z.input<typeof createNotificationSchema>;

export async function createNotification(input: CreateNotificationInput) {
  const data = createNotificationSchema.parse(input);
  return prisma.notification.create({ data: { ...data, metadata: data.metadata as Prisma.InputJsonValue | undefined } });
}
export async function listNotifications(tenantId: string, userId?: string) { return prisma.notification.findMany({ where: { tenantId, deletedAt: null, ...(userId ? { userId } : {}) }, orderBy: { createdAt: 'desc' }, take: 50 }); }
export async function markNotificationRead(tenantId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, tenantId, deletedAt: null } });
  if (!notification) throw new Error('Notification not found');
  return prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
}

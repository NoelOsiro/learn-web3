import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/lib/trpc/routers';

// Annotate trpc explicitly:
export const trpc: CreateTRPCReact<typeof AppRouter, any> = createTRPCReact<typeof AppRouter>();
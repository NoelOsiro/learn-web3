import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { AppRouter } from '@/lib/trpc/routers/index';
import { createContext } from '@/lib/trpc/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: AppRouter,
    createContext,
  });

export { handler as GET, handler as POST };

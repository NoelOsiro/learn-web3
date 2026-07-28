import { router } from '../server';
import { collectionsRouter } from './collections';
import { devicesRouter } from './devices';
import { tenantsRouter } from './tenants';
import { usersRouter } from './users';
import { farmersRouter } from './farmers';
import { priceBooksRouter } from './price-books';
import { loanRouter } from './loan';
import { valuationsRouter } from './valuations';



export const AppRouter = router({
  tenantOps: tenantsRouter,
  userOps: usersRouter,
  farmerOps: farmersRouter,
  collections: collectionsRouter,
  devices: devicesRouter,
  priceBooks: priceBooksRouter,
  loans: loanRouter,
  valuations: valuationsRouter,
});

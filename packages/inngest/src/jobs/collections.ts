import { inngest } from '../client';

// Collection-related jobs will be defined here
// Examples: collectionCreated, collectionValuated, collectionPaid

export const collectionCreated = inngest.createFunction(
  { id: 'collection-created' },
  { event: 'collection.created' },
  async ({ event }) => {
    console.log('Collection created:', event.data);
    // Add collection processing logic here
  }
);

export const collectionValuated = inngest.createFunction(
  { id: 'collection-validated' },
  { event: 'collection.valuated' },
  async ({ event }) => {
    console.log('Collection valuated:', event.data);
    // Add valuation processing logic here
  }
);

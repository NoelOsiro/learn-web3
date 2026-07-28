import { serve } from 'inngest/next';
import { inngest } from './client';
import { collectionCreated, collectionValuated } from './jobs/collections';
import { surveyCreated, surveyReminder } from './jobs/surveys';
import { sendEmail, sendSMS } from './jobs/notifications';

export { inngest } from './client';

// Export individual jobs
export { collectionCreated, collectionValuated } from './jobs/collections';
export { surveyCreated, surveyReminder } from './jobs/surveys';
export { sendEmail, sendSMS } from './jobs/notifications';

// Serve function for Next.js API routes with all registered functions
export const serveInngest = serve({
  client: inngest,
  functions: [
    collectionCreated,
    collectionValuated,
    surveyCreated,
    surveyReminder,
    sendEmail,
    sendSMS,
  ],
});

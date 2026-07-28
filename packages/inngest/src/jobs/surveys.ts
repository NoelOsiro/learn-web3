import { inngest } from '../client';

// Survey-related jobs will be defined here
// Examples: surveyCreated, surveyCompleted, surveyReminder

export const surveyCreated = inngest.createFunction(
  { id: 'survey-created' },
  { event: 'survey.created' },
  async ({ event }) => {
    console.log('Survey created:', event.data);
    // Add survey processing logic here
  }
);

export const surveyReminder = inngest.createFunction(
  { id: 'survey-reminder' },
  { event: 'survey.reminder' },
  async ({ event }) => {
    console.log('Survey reminder sent:', event.data);
    // Add reminder logic here
  }
);

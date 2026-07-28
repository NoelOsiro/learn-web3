import { inngest } from '../client';

// Notification-related jobs will be defined here
// Examples: sendEmail, sendSMS, sendPushNotification

export const sendEmail = inngest.createFunction(
  { id: 'send-email' },
  { event: 'notification.email' },
  async ({ event }) => {
    console.log('Sending email:', event.data);
    // Add email sending logic here
  }
);

export const sendSMS = inngest.createFunction(
  { id: 'send-sms' },
  { event: 'notification.sms' },
  async ({ event }) => {
    console.log('Sending SMS:', event.data);
    // Add SMS sending logic here
  }
);

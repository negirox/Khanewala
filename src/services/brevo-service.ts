
/**
 * @fileoverview
 * This file contains the BrevoService, which is responsible for
 * sending emails using the Brevo (formerly Sendinblue) API.
 */
import * as SibApiV3Sdk from '@sendinblue/client';
import { appConfig } from '@/lib/config';
import { renderWelcomeEmail } from '@/emails/welcome-template';
import type { Customer } from '@/lib/types';

// This is a server-side only module.
// Ensure you have BREVO_API_KEY in your .env file.
if (typeof window !== 'undefined') {
  throw new Error('Brevo service should not be used on the client-side.');
}

const API_KEY = process.env.BREVO_API_KEY;

if (!API_KEY) {
  console.warn("BREVO_API_KEY is not set. Email functionality will be disabled.");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, API_KEY!);

class BrevoService {
  /**
   * Sends a welcome email to a newly registered customer.
   * @param customer The new customer.
   */
  async sendWelcomeEmail(customer: Customer): Promise<void> {
    if (!API_KEY) {
      console.log('--- SIMULATING WELCOME EMAIL ---');
      console.log(`To: ${customer.email}`);
      console.log(`Subject: Welcome to ${appConfig.title}!`);
      console.log('Body would be a fancy HTML email.');
      console.log('--------------------------------');
      return;
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = `Welcome to ${appConfig.title}!`;
    sendSmtpEmail.htmlContent = renderWelcomeEmail(customer.name);
    sendSmtpEmail.sender = { name: appConfig.title, email: `no-reply@${appConfig.title.toLowerCase().replace(/\s/g, '')}.com` };
    sendSmtpEmail.to = [{ email: customer.email, name: customer.name }];
    // bcc, attachments etc. can be added here

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Welcome email sent successfully to ${customer.email}`);
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      // Decide if you want to throw the error or handle it gracefully
    }
  }
}

export const brevoService = new BrevoService();


/**
 * @fileoverview
 * This file contains the BrevoService for sending transactional emails.
 *
 * NOTE: This implementation is designed to be robust. If the API key
 * is not provided in the environment variables, it will log a simulation
 * to the console instead of throwing an error, ensuring that features
 * like user registration do not break.
 */

import type { Customer } from '@/lib/types';
import { getAppConfig } from './config-service';

// In a real app, you would install the Brevo SDK:
// npm install @getbrevo/brevo
// For this demo, we will simulate the SDK's behavior.
const brevoApiKey = process.env.BREVO_API_KEY;

// A simple mock of the Brevo API client
const mockBrevoClient = {
  sendTransacEmail: async (email: any) => {
    if (!brevoApiKey) {
      console.log('--- SIMULATING WELCOME EMAIL (Brevo API Key not configured) ---');
      console.log('To:', email.to[0].email);
      console.log('Subject:', email.subject);
      console.log('---------------------------------------------------------------');
      return { messageId: 'simulated_message_id' };
    }
    
    // This is where the actual API call would go
    // For now, we'll just log that it would be sent for real.
    console.log(`--- SENDING REAL EMAIL VIA BREVO ---`);
    console.log('To:', email.to[0].email);
    console.log('Subject:', email.subject);
    console.log('------------------------------------');
    
    // In a real implementation, you would handle the response from Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKey,
        },
        body: JSON.stringify(email)
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to send email via Brevo:", errorBody);
        throw new Error('Failed to send email.');
    }

    return response.json();
  },
};

class BrevoService {
  async sendWelcomeEmail(customer: Customer): Promise<void> {
    const appConfig = await getAppConfig();

    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .header { background-color: #007bff; color: #ffffff; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; line-height: 1.6; color: #333333; }
            .content h2 { color: #007bff; }
            .footer { background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #6c757d; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ${appConfig.title}!</h1>
            </div>
            <div class="content">
                <h2>Hi ${customer.name},</h2>
                <p>We are thrilled to welcome you to the ${appConfig.title} family. Get ready to explore a world of delicious flavors and exceptional service.</p>
                <p>As a valued member, you've been automatically enrolled in our loyalty program. You'll earn points on every order that you can redeem for exciting discounts!</p>
                <p>We look forward to serving you soon!</p>
                <p><strong>The ${appConfig.title} Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${appConfig.title}. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>`;

    try {
      await mockBrevoClient.sendTransacEmail({
        subject: `Welcome to ${appConfig.title}!`,
        htmlContent: emailContent,
        sender: { name: appConfig.title, email: 'noreply@yourdomain.com' },
        to: [{ email: customer.email, name: customer.name }],
      });
    } catch (error) {
      console.error("Brevo Service Error: Failed to send welcome email.", error);
      // We don't re-throw the error to prevent the user registration process from failing.
    }
  }
}

export const brevoService = new BrevoService();

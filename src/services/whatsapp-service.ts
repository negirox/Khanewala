
/**
 * @fileoverview
 * This file contains the WhatsappService, which is a placeholder for sending
 * WhatsApp messages to customers.
 *
 * NOTE: This is a placeholder implementation. It does not send actual
 * WhatsApp messages. It logs the message content to the console.
 * You would replace this with a real WhatsApp API provider like Twilio.
 */

import { appConfig } from '@/lib/config';
import type { Customer, Order } from '@/lib/types';

class WhatsappService {
  /**
   * Sends an order confirmation message to the customer via WhatsApp.
   *
   * @param customer The customer who placed the order.
   * @param order The order details.
   */
  sendOrderConfirmation(customer: Customer, order: Order): void {
    if (!customer.phone) {
      console.log(`Cannot send WhatsApp message: Customer ${customer.name} has no phone number.`);
      return;
    }

    const message = `
=================================================
-- SIMULATING WHATSAPP MESSAGE --
To: ${customer.phone}
From: ${appConfig.title} Restaurant

Hello ${customer.name},

Thank you for your order! This is a digital confirmation to help save paper.

Order ID: ${order.id}
Total: ${appConfig.currency}${order.total.toFixed(2)}
Points Earned: ${order.pointsEarned || 0}

We've received your order and will have it ready for you shortly.

Thank you for going green!
=================================================
    `;

    // In a real application, you would make an API call to your WhatsApp provider here.
    // Example: await twilio.messages.create({ from: 'whatsapp:+1...', body: message, to: `whatsapp:${customer.phone}` });
    console.log(message);
  }
}

export const whatsappService = new WhatsappService();

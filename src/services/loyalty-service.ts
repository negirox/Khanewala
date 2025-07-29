/**
 * @fileoverview
 * This file contains the LoyaltyService, which is responsible for
 * managing customer loyalty points.
 */

import type { Customer } from '@/lib/types';

const POINTS_PER_DOLLAR = 0.1; // 1 point for every $10 spent

class LoyaltyService {
  /**
   * Calculates the loyalty points earned for a given order amount
   * and adds them to the customer's total.
   *
   * @param customer The customer object.
   * @param orderTotal The total amount of the order.
   * @returns An object containing the updated customer and the points earned.
   */
  addPointsForOrder(customer: Customer, orderTotal: number): { updatedCustomer: Customer; pointsEarned: number } {
    const pointsEarned = Math.floor(orderTotal * POINTS_PER_DOLLAR);
    
    if (pointsEarned <= 0) {
      return { updatedCustomer: customer, pointsEarned: 0 };
    }

    const updatedCustomer: Customer = {
      ...customer,
      loyaltyPoints: customer.loyaltyPoints + pointsEarned,
    };

    console.log(`Awarded ${pointsEarned} points to ${customer.name}. New total: ${updatedCustomer.loyaltyPoints}`);

    return { updatedCustomer, pointsEarned };
  }
}

export const loyaltyService = new LoyaltyService();

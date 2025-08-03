
/**
 * @fileoverview
 * This file contains the LoyaltyService, which is responsible for
 * managing customer loyalty points.
 */

import type { Customer, Order } from '@/lib/types';

class LoyaltyService {
  /**
   * Calculates the loyalty points earned for a given order amount
   * and adds them to the customer's total.
   *
   * @param customer The customer object.
   * @param orderTotal The total amount of the order (after discounts).
   * @param loyaltyConfig The loyalty-specific configuration.
   * @returns An object containing the updated customer and the points earned.
   */
  addPointsForOrder(customer: Customer, orderTotal: number, loyaltyConfig: { pointsPerCurrencyUnit: number, currencyUnitPerPoint: number }): { updatedCustomer: Customer; pointsEarned: number } {
    const pointsEarned = Math.floor(orderTotal * loyaltyConfig.pointsPerCurrencyUnit);
    
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

  /**
   * Redeems loyalty points for a customer and calculates the discount value.
   *
   * @param customer The customer redeeming points.
   * @param pointsToRedeem The number of points to redeem.
   * @param loyaltyConfig The loyalty-specific configuration.
   * @returns An object with the updated customer, the value of the redeemed points, and the points redeemed.
   */
  redeemPoints(customer: Customer, pointsToRedeem: number, loyaltyConfig: { pointsPerCurrencyUnit: number, currencyUnitPerPoint: number }): { updatedCustomer: Customer; redeemedValue: number; pointsRedeemed: number } {
    const availablePoints = customer.loyaltyPoints;
    const redeemablePoints = Math.min(pointsToRedeem, availablePoints);
    
    if (redeemablePoints <= 0) {
      return { updatedCustomer: customer, redeemedValue: 0, pointsRedeemed: 0 };
    }

    const redeemedValue = redeemablePoints * loyaltyConfig.currencyUnitPerPoint;

    const updatedCustomer: Customer = {
      ...customer,
      loyaltyPoints: availablePoints - redeemablePoints,
    };

    console.log(`Redeemed ${redeemablePoints} points for ${customer.name} for a value of ${redeemedValue}. New total: ${updatedCustomer.loyaltyPoints}`);

    return { updatedCustomer, redeemedValue, pointsRedeemed: redeemablePoints };
  }
  
  /**
   * Reverts a redemption of loyalty points, adding them back to the customer's balance.
   *
   * @param customer The customer whose redemption is being reverted.
   * @param pointsToReturn The number of points to return to the customer.
   * @returns An object with the updated customer.
   */
  revertRedemption(customer: Customer, pointsToReturn: number): { updatedCustomer: Customer } {
    if (pointsToReturn <= 0) {
      return { updatedCustomer: customer };
    }

    const updatedCustomer: Customer = {
      ...customer,
      loyaltyPoints: customer.loyaltyPoints + pointsToReturn,
    };
    
    console.log(`Reverted redemption of ${pointsToReturn} points for ${customer.name}. New total: ${updatedCustomer.loyaltyPoints}`);
    
    return { updatedCustomer };
  }
}

export const loyaltyService = new LoyaltyService();

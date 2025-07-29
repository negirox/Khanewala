'use server';

/**
 * @fileOverview Provides AI-powered menu recommendations based on the current order.
 *
 * - getMenuRecommendations - A function to get menu recommendations.
 * - MenuRecommendationInput - The input type for the getMenuRecommendations function.
 * - MenuRecommendationOutput - The return type for the getMenuRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MenuRecommendationInputSchema = z.object({
  orderSummary: z
    .string()
    .describe('A summary of the current order including items and quantities.'),
  dietaryRestrictions: z
    .string()
    .optional()
    .describe('Any dietary restrictions the customer has (e.g., vegetarian, allergies).'),
});
export type MenuRecommendationInput = z.infer<typeof MenuRecommendationInputSchema>;

const MenuRecommendationOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended menu items or modifications.'),
  reasoning: z.string().describe('The AI reasoning behind the recommendations.'),
});
export type MenuRecommendationOutput = z.infer<typeof MenuRecommendationOutputSchema>;

export async function getMenuRecommendations(input: MenuRecommendationInput): Promise<MenuRecommendationOutput> {
  return menuRecommendationFlow(input);
}

const menuRecommendationPrompt = ai.definePrompt({
  name: 'menuRecommendationPrompt',
  input: {schema: MenuRecommendationInputSchema},
  output: {schema: MenuRecommendationOutputSchema},
  prompt: `You are a helpful restaurant menu recommendation system. A customer has ordered the following items:

Order Summary: {{{orderSummary}}}

Dietary Restrictions: {{#if dietaryRestrictions}}{{{dietaryRestrictions}}}{{else}}None{{/if}}

Based on this order and any dietary restrictions, recommend some additional menu items or modifications to the current order. Explain your reasoning for each recommendation.

Format your output as a JSON object with "recommendations" (an array of strings) and "reasoning" (a string).
`, // Modified prompt to use Handlebars syntax correctly
});

const menuRecommendationFlow = ai.defineFlow(
  {
    name: 'menuRecommendationFlow',
    inputSchema: MenuRecommendationInputSchema,
    outputSchema: MenuRecommendationOutputSchema,
  },
  async input => {
    const {output} = await menuRecommendationPrompt(input);
    return output!;
  }
);

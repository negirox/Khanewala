
'use server';

import { getMenuRecommendations as getMenuRecommendationsAI, type MenuRecommendationInput } from '@/ai/flows/menu-recommendation';

export async function getMenuRecommendations(input: MenuRecommendationInput) {
  try {
    const result = await getMenuRecommendationsAI(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get AI recommendations. Please try again later.' };
  }
}

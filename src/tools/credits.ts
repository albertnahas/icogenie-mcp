/**
 * check_credits tool - Check credit balance
 */

import { z } from 'zod';
import { getCredits } from '../api/client.js';

export const checkCreditsSchema = {};

export async function checkCredits() {
  const result = await getCredits();

  return {
    credits: result.credits,
    team: result.team,
    user: result.user,
  };
}

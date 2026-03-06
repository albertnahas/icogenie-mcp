/**
 * claim_daily_credits tool - Claim free daily credits
 */

import { z } from 'zod';
import { claimDailyCredits } from '../api/client.js';

export const dailyClaimSchema = {};

export async function dailyClaimTool() {
  const result = await claimDailyCredits();

  return {
    claimed: result.claimed,
    creditsAdded: result.amount,
    balance: result.balance,
    ...(result.error && { error: result.error }),
  };
}

/**
 * Authentication flow for IcoGenie MCP Server
 * Triggers browser-based OAuth when no credentials exist
 */

import {
  startAuth,
  pollAuth,
  type Credentials,
} from '@icogenie/shared';
import { getApiUrl, setCredentials } from './config.js';

/**
 * Run the full authentication flow
 * Opens browser for login and polls until approved
 */
export async function authenticate(): Promise<Credentials> {
  const apiUrl = getApiUrl();
  const { pollToken, loginUrl, expiresInSeconds } = await startAuth(apiUrl);

  // Open browser for authentication (dynamic import for CJS bundler compatibility)
  const { default: open } = await import('open');
  await open(loginUrl);

  // Poll for approval
  const pollInterval = 2000; // 2 seconds
  const maxAttempts = Math.floor((expiresInSeconds * 1000) / pollInterval);
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;

    const result = await pollAuth(apiUrl, pollToken);

    if (result.status === 'approved' && result.sessionToken && result.user && result.team) {
      const credentials: Credentials = {
        sessionToken: result.sessionToken,
        userId: result.user.id,
        userEmail: result.user.email,
        userName: result.user.name,
        teamId: result.team.id,
        teamName: result.team.name,
        createdAt: new Date().toISOString(),
      };
      setCredentials(credentials);
      return credentials;
    }

    if (result.status === 'expired') {
      throw new Error('Authentication request expired. Please try again.');
    }
  }

  throw new Error('Authentication timed out. Please try again.');
}

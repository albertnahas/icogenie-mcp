/**
 * Authentication middleware for MCP tools
 */

import { getCredentials, clearCredentials, type Credentials } from './config.js';
import { authenticate } from './flow.js';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_AUTHENTICATED' | 'SESSION_EXPIRED' | 'AUTH_FAILED'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Ensure we have valid credentials, triggering auth flow if needed
 */
export async function ensureAuth(): Promise<Credentials> {
  let credentials = getCredentials();

  if (!credentials) {
    // No credentials - trigger auth flow
    try {
      credentials = await authenticate();
    } catch (error) {
      throw new AuthError(
        `Authentication required. Please approve access in your browser. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUTH_FAILED'
      );
    }
  }

  return credentials;
}

/**
 * Handle 401 responses by clearing credentials and re-authenticating
 */
export async function handleAuthError(): Promise<Credentials> {
  clearCredentials();
  try {
    return await authenticate();
  } catch (error) {
    throw new AuthError(
      'Session expired. Please approve access in your browser.',
      'SESSION_EXPIRED'
    );
  }
}

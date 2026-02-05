/**
 * Authentication flow for IcoGenie MCP Server
 * Triggers browser-based OAuth when no credentials exist
 */

import open from 'open';
import { getApiUrl, setCredentials, type Credentials } from './config.js';

interface StartAuthResponse {
  success: boolean;
  pollToken: string;
  loginUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
}

interface PollAuthResponse {
  status: 'pending' | 'approved' | 'expired';
  sessionToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

async function request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const url = `${getApiUrl()}/api/cli${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { error?: string; message?: string } & T;
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data as T;
}

export async function startAuth(): Promise<StartAuthResponse> {
  return request<StartAuthResponse>('/auth/start', {});
}

export async function pollAuth(pollToken: string): Promise<PollAuthResponse> {
  return request<PollAuthResponse>('/auth/poll', { pollToken });
}

/**
 * Run the full authentication flow
 * Opens browser for login and polls until approved
 */
export async function authenticate(): Promise<Credentials> {
  const { pollToken, loginUrl, expiresInSeconds } = await startAuth();

  // Open browser for authentication
  await open(loginUrl);

  // Poll for approval
  const pollInterval = 2000; // 2 seconds
  const maxAttempts = Math.floor((expiresInSeconds * 1000) / pollInterval);
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;

    const result = await pollAuth(pollToken);

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

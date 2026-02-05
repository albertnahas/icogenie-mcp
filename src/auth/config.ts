/**
 * Configuration management for IcoGenie MCP Server
 * Shares config with CLI at ~/.icogenie/
 */

import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const configDir = process.env.ICOGENIE_CONFIG_DIR || join(homedir(), '.icogenie');
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
}

export interface Credentials {
  sessionToken: string;
  userId: string;
  userEmail: string;
  userName?: string;
  teamId: string;
  teamName: string;
  createdAt: string;
}

interface Config {
  apiUrl: string;
  credentials?: Credentials;
}

const config = new Conf<Config>({
  projectName: 'icogenie',
  cwd: configDir,
  defaults: {
    apiUrl: 'https://www.icogenie.xyz',
  },
});

export function getApiUrl(): string {
  return process.env.ICOGENIE_API_URL || config.get('apiUrl');
}

export function getCredentials(): Credentials | undefined {
  // Allow environment variable override for CI/CD
  const envToken = process.env.ICOGENIE_SESSION_TOKEN;
  if (envToken) {
    return {
      sessionToken: envToken,
      userId: 'env-user',
      userEmail: 'env@icogenie.com',
      teamId: 'env-team',
      teamName: 'Environment',
      createdAt: new Date().toISOString(),
    };
  }
  return config.get('credentials');
}

export function setCredentials(credentials: Credentials): void {
  config.set('credentials', credentials);
}

export function clearCredentials(): void {
  config.delete('credentials');
}

export function isLoggedIn(): boolean {
  return !!getCredentials();
}

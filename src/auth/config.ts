/**
 * Configuration management for IcoGenie MCP Server
 * Shares config with CLI at ~/.icogenie/
 * Uses plain fs instead of 'conf' package for CJS bundler compatibility (Smithery).
 */

import type { Credentials } from '@icogenie/shared';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

const configDir = process.env.ICOGENIE_CONFIG_DIR || join(homedir(), '.icogenie');
const configPath = join(configDir, 'config.json');

export type { Credentials } from '@icogenie/shared';

interface Config {
  apiUrl: string;
  credentials?: Credentials;
}

const defaults: Config = {
  apiUrl: 'https://www.icogenie.xyz',
};

function readConfig(): Config {
  try {
    if (existsSync(configPath)) {
      return { ...defaults, ...JSON.parse(readFileSync(configPath, 'utf-8')) };
    }
  } catch {
    // Corrupted file, return defaults
  }
  return { ...defaults };
}

function writeConfig(config: Config): void {
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getApiUrl(): string {
  return process.env.ICOGENIE_API_URL || readConfig().apiUrl;
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
  return readConfig().credentials;
}

export function setCredentials(credentials: Credentials): void {
  const config = readConfig();
  config.credentials = credentials;
  writeConfig(config);
}

export function clearCredentials(): void {
  const config = readConfig();
  delete config.credentials;
  writeConfig(config);
}

export function isLoggedIn(): boolean {
  return !!getCredentials();
}

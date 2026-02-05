/**
 * HTTP client for IcoGenie API
 */

import { readFileSync, statSync } from 'fs';
import { extname } from 'path';
import { getApiUrl } from '../auth/config.js';
import { ensureAuth, handleAuthError } from '../auth/middleware.js';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Reference image types
export interface ReferenceImage {
  data: string; // base64
  mimeType: string;
}

const SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function readReferenceImage(filePath: string): ReferenceImage {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Supported: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
  }

  const stats = statSync(filePath);
  if (stats.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`);
  }

  const buffer = readFileSync(filePath);
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  return { data: buffer.toString('base64'), mimeType };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

/**
 * Make authenticated API request with Bearer token
 */
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  requireAuth = true
): Promise<T> {
  const { method = 'POST', body, params } = options;
  let url = `${getApiUrl()}/api${endpoint}`;

  // Add query params for GET requests
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const makeRequest = async (sessionToken?: string) => {
    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    });

    // Handle ZIP responses (for download)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/zip')) {
      if (!response.ok) {
        throw new ApiError('Download failed', response.status);
      }
      return response as unknown as T;
    }

    const data = await response.json() as Record<string, unknown>;

    if (response.status === 401 && requireAuth) {
      // Session expired - re-authenticate
      const newCreds = await handleAuthError();
      return makeRequest(newCreds.sessionToken);
    }

    if (!response.ok) {
      throw new ApiError(
        (data.error || data.message || 'Request failed') as string,
        response.status,
        data
      );
    }

    return data as T;
  };

  if (requireAuth) {
    const credentials = await ensureAuth();
    return makeRequest(credentials.sessionToken);
  }

  return makeRequest();
}

// API Response types (aligned with unified web API)
export interface GenerateResponse {
  success: boolean;
  sessionId: string;
  credits: number;
  preview: string; // Public URL to watermarked preview
  previews: string[]; // Public URLs to watermarked previews
  mimeType: string;
  description: string;
  normalizedPrompt: string;
  suggestions: string[];
  sessionData: {
    prompt: string;
    normalizedPrompt: string;
    description: string;
    imagePrompt: string;
    variations: number;
    style: string;
  };
}

export interface RegenerateResponse {
  success: boolean;
  index: number;
  preview: string;
  credits: number | null;
}

export interface CreditsResponse {
  authenticated: boolean;
  credits: number;
  team: { id: string; name: string };
  user: { id: string; email: string; name?: string };
  source: 'cookie' | 'bearer';
}

// Download returns Response object with ZIP
export interface DownloadResult {
  response: Response;
  filename: string;
}

export interface NormalizeResponse {
  success: boolean;
  bundleType: string;
  suggestedCount: number;
  icons: Array<{ name: string; description: string; category?: string }>;
  styleRecommendation: 'solid' | 'outline';
  reasoning: string;
}

export interface BundleResponse {
  bundleId: string;
  previews: Array<{ name: string; description: string; preview: string /* Public URL to watermarked preview */ }>;
  extractedStyle?: string;
  pricing: {
    totalIcons: number;
    previewCredits: number;
    downloadCredits: number;
    totalCredits: number;
  };
  batchCount: number;
  creditsUsed: number;
  credits: number;
}

// API functions
export async function generate(options: {
  prompt: string;
  variations?: 1 | 2 | 4;
  style?: 'solid' | 'outline' | 'illustration';
  referenceImage?: ReferenceImage;
}): Promise<GenerateResponse> {
  return request<GenerateResponse>('/generate-preview', {
    body: {
      prompt: options.prompt,
      variations: options.variations || 1,
      style: options.style || 'solid',
      ...(options.referenceImage && { referenceImage: options.referenceImage }),
    },
  });
}

export async function regenerate(options: {
  sessionId?: string;
  bundleId?: string;
  index: number;
  prompt?: string;
}): Promise<RegenerateResponse> {
  return request<RegenerateResponse>('/regenerate-icon', {
    body: {
      sessionId: options.sessionId,
      bundleId: options.bundleId,
      index: options.index,
      prompt: options.prompt,
    },
  });
}

export async function getCredits(): Promise<CreditsResponse> {
  return request<CreditsResponse>('/auth/session', { method: 'GET' });
}

export async function download(options: {
  generationId?: string;
  bundleId?: string;
}): Promise<DownloadResult> {
  const params: Record<string, string> = {};
  if (options.generationId) params.generation_id = options.generationId;
  if (options.bundleId) params.bundle_id = options.bundleId;

  const response = await request<Response>('/download', {
    method: 'GET',
    params,
  });

  const contentDisposition = response.headers.get('content-disposition');
  const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
  const filename = filenameMatch?.[1] || `icogenie-${(options.generationId || options.bundleId || 'export').slice(0, 8)}.zip`;

  return { response, filename };
}

export async function normalizeBundle(options: {
  description: string;
  targetCount?: number;
  style?: 'solid' | 'outline' | 'illustration';
}): Promise<NormalizeResponse> {
  return request<NormalizeResponse>('/normalize-bundle', {
    body: {
      description: options.description,
      targetCount: options.targetCount,
      style: options.style,
    },
  });
}

export async function generateBundle(options: {
  bundleId?: string;
  icons: Array<{ name: string; description: string }>;
  style?: 'solid' | 'outline' | 'illustration';
  referenceImage?: ReferenceImage;
}): Promise<BundleResponse> {
  const bundleId = options.bundleId || crypto.randomUUID();
  return request<BundleResponse>('/generate-bundle-preview', {
    body: {
      bundleId,
      icons: options.icons,
      style: options.style || 'solid',
      ...(options.referenceImage && { referenceImage: options.referenceImage }),
    },
  });
}

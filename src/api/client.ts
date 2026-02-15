/**
 * HTTP client for IcoGenie API
 */

import { ApiError, type ReferenceImage } from '@icogenie/shared';
export { readReferenceImage, type ReferenceImage, ApiError } from '@icogenie/shared';
export type {
  GenerateResponse,
  RegenerateResponse,
  CreditsResponse,
  DownloadResult,
  NormalizeResponse,
  BundleResponse,
} from '@icogenie/shared/api-types';
import type {
  GenerateResponse,
  RegenerateResponse,
  CreditsResponse,
  DownloadResult,
  NormalizeResponse,
  BundleResponse,
} from '@icogenie/shared/api-types';
import { getApiUrl } from '../auth/config.js';
import { ensureAuth, handleAuthError } from '../auth/middleware.js';

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
  removeBg?: boolean;
}): Promise<DownloadResult> {
  const params: Record<string, string> = {};
  if (options.generationId) params.generation_id = options.generationId;
  if (options.bundleId) params.bundle_id = options.bundleId;
  if (options.removeBg) params.remove_bg = 'true';

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

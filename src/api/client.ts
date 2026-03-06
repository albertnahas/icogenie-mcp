/**
 * HTTP client for IcoGenie API
 */

import { ApiError, type ReferenceImage } from '@icogenie/shared';
export { readReferenceImage, type ReferenceImage, ApiError } from '@icogenie/shared';
export type {
  GenerateResponse,
  RegenerateResponse,
  RegenerateGenerateResponse,
  RegenerateConfirmResponse,
  CreditsResponse,
  DownloadResult,
  NormalizeResponse,
  BundleResponse,
  LibraryItem,
  LibraryListResponse,
  LibrarySaveResponse,
  DailyClaimResponse,
} from '@icogenie/shared/api-types';
import type {
  GenerateResponse,
  RegenerateResponse,
  RegenerateGenerateResponse,
  RegenerateConfirmResponse,
  CreditsResponse,
  DownloadResult,
  NormalizeResponse,
  BundleResponse,
  LibraryListResponse,
  LibrarySaveResponse,
  DailyClaimResponse,
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
export interface StyleLibraryItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  baseStyle: 'solid' | 'outline' | 'illustration';
  promptHint: string | null;
}

export interface StyleLibraryResponse {
  items: StyleLibraryItem[];
  total: number;
}

export async function listStyles(options?: {
  baseStyle?: 'solid' | 'outline' | 'illustration';
}): Promise<StyleLibraryResponse> {
  const params: Record<string, string> = { limit: '60' };
  if (options?.baseStyle) params.baseStyle = options.baseStyle;

  return request<StyleLibraryResponse>('/style-library', {
    method: 'GET',
    params,
  });
}

export async function generate(options: {
  prompt: string;
  variations?: 1 | 2 | 4;
  style?: 'solid' | 'outline' | 'illustration';
  model?: 'fast' | 'precise';
  referenceImage?: ReferenceImage;
  styleReferenceItemId?: string;
  force?: boolean;
}): Promise<GenerateResponse> {
  return request<GenerateResponse>('/generate-preview', {
    body: {
      prompt: options.prompt,
      variations: options.variations || 1,
      style: options.style || 'solid',
      model: options.model || 'fast',
      ...(options.referenceImage && { referenceImage: options.referenceImage }),
      ...(options.styleReferenceItemId && { styleReferenceItemId: options.styleReferenceItemId }),
      ...(options.force && { proceedWithClarifications: true }),
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

export async function regenerateGenerate(options: {
  sessionId?: string;
  bundleId?: string;
  index: number;
  prompt?: string;
}): Promise<RegenerateGenerateResponse> {
  return request<RegenerateGenerateResponse>('/regenerate-icon', {
    body: {
      sessionId: options.sessionId,
      bundleId: options.bundleId,
      index: options.index,
      prompt: options.prompt,
      phase: 'generate',
    },
  });
}

export async function regenerateConfirm(options: {
  regenToken: string;
  selectedIndex: number;
}): Promise<RegenerateConfirmResponse> {
  return request<RegenerateConfirmResponse>('/regenerate-icon', {
    body: {
      regenToken: options.regenToken,
      selectedIndex: options.selectedIndex,
      phase: 'confirm',
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

export async function saveToLibrary(options: {
  generationId: string;
  prompt: string;
  type?: 'single' | 'bundle';
  variations?: number;
  style?: 'solid' | 'outline' | 'illustration';
  name?: string;
}): Promise<LibrarySaveResponse> {
  return request<LibrarySaveResponse>('/library/save', {
    body: {
      generationId: options.generationId,
      prompt: options.prompt,
      type: options.type || 'single',
      variations: options.variations || 1,
      style: options.style || 'solid',
      source: 'mcp',
      name: options.name,
    },
  });
}

export async function listLibrary(options?: {
  status?: 'all' | 'saved' | 'exported';
  type?: 'all' | 'single' | 'bundle';
  limit?: number;
  offset?: number;
}): Promise<LibraryListResponse> {
  const params: Record<string, string> = {};
  if (options?.status && options.status !== 'all') params.status = options.status;
  if (options?.type && options.type !== 'all') params.type = options.type;
  if (options?.limit) params.limit = String(options.limit);
  if (options?.offset) params.offset = String(options.offset);

  return request<LibraryListResponse>('/library', {
    method: 'GET',
    params,
  });
}

export async function downloadFromLibrary(libraryId: string): Promise<DownloadResult> {
  const response = await request<Response>(`/library/${libraryId}/download`, {
    method: 'GET',
  });

  const contentDisposition = response.headers.get('content-disposition');
  const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
  const filename = filenameMatch?.[1] || `icogenie-${libraryId.slice(0, 8)}.zip`;

  return { response, filename };
}

export async function claimDailyCredits(): Promise<DailyClaimResponse> {
  return request<DailyClaimResponse>('/credits/daily-claim', {});
}

export async function generateBundle(options: {
  bundleId?: string;
  icons: Array<{ name: string; description: string }>;
  style?: 'solid' | 'outline' | 'illustration';
  model?: 'fast' | 'precise';
  referenceImage?: ReferenceImage;
  styleReferenceItemId?: string;
  force?: boolean;
}): Promise<BundleResponse> {
  const bundleId = options.bundleId || crypto.randomUUID();
  return request<BundleResponse>('/generate-bundle-preview', {
    body: {
      bundleId,
      icons: options.icons,
      style: options.style || 'solid',
      model: options.model || 'fast',
      ...(options.referenceImage && { referenceImage: options.referenceImage }),
      ...(options.styleReferenceItemId && { styleReferenceItemId: options.styleReferenceItemId }),
      ...(options.force && { proceedWithClarifications: true }),
    },
  });
}

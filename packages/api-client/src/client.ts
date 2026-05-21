import type { ApiError } from '@dishday/types';

export interface ClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  fetch?: typeof fetch;
}

export class ApiClientError extends Error {
  status: number;
  body: ApiError | null;
  constructor(status: number, message: string, body: ApiError | null = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null | Promise<string | null>;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.getToken = opts.getAccessToken ?? (() => null);
    this.fetchImpl = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.headers as Record<string, string>),
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed: ApiError | null = null;
      try {
        parsed = text ? (JSON.parse(text) as ApiError) : null;
      } catch {
        // ignore
      }
      throw new ApiClientError(res.status, parsed?.message ?? res.statusText, parsed);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>('GET', path, undefined, init);
  }
  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>('POST', path, body, init);
  }
  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>('PUT', path, body, init);
  }
  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>('PATCH', path, body, init);
  }
  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>('DELETE', path, undefined, init);
  }
}

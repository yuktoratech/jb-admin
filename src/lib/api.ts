import { clearAccessToken, getAccessToken } from "@/lib/auth";

export const AUTH_UNAUTHORIZED_EVENT = "jb-admin:unauthorized";

export type ApiErrorCode =
  | "API_CONFIGURATION_ERROR"
  | "INVALID_API_PATH"
  | "NETWORK_ERROR"
  | "REQUEST_ABORTED"
  | "INVALID_RESPONSE"
  | "HTTP_ERROR";

interface ApiErrorOptions {
  status?: number;
  code?: ApiErrorCode;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.code = options.code ?? "HTTP_ERROR";
    this.details = options.details;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  body?: unknown;
  auth?: boolean;
}

type ApiCallOptions = Omit<ApiRequestOptions, "body">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function getApiBaseUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredUrl) {
    throw new ApiError("The API URL is not configured.", {
      code: "API_CONFIGURATION_ERROR",
    });
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new ApiError("The configured API URL is invalid.", {
      code: "API_CONFIGURATION_ERROR",
    });
  }

  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new ApiError("The configured API URL is invalid.", {
      code: "API_CONFIGURATION_ERROR",
    });
  }

  return baseUrl;
}

function buildApiUrl(path: string): URL {
  const requestedPath = path.trim();

  if (
    !requestedPath ||
    requestedPath.startsWith("//") ||
    /^[a-z][a-z\d+.-]*:/i.test(requestedPath) ||
    requestedPath.includes("#")
  ) {
    throw new ApiError("The requested API path is invalid.", {
      code: "INVALID_API_PATH",
    });
  }

  const baseUrl = getApiBaseUrl();
  const basePath = baseUrl.pathname.replace(/\/+$/, "");
  const relativePath = requestedPath.replace(/^\/+/, "");
  const targetUrl = new URL(`${basePath}/${relativePath}`, baseUrl.origin);
  const allowedPathPrefix = `${basePath || ""}/`;

  if (
    targetUrl.origin !== baseUrl.origin ||
    (targetUrl.pathname !== basePath &&
      !targetUrl.pathname.startsWith(allowedPathPrefix))
  ) {
    throw new ApiError("The requested API path is invalid.", {
      code: "INVALID_API_PATH",
    });
  }

  return targetUrl;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const responseText = (await response.text()).replace(/^\uFEFF/, "").trim();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    if (!response.ok) {
      return null;
    }

    throw new ApiError("The server returned an invalid response.", {
      status: response.status,
      code: "INVALID_RESPONSE",
    });
  }
}

function getResponseMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (Array.isArray(payload.errors)) {
    for (const error of payload.errors) {
      if (typeof error === "string" && error.trim()) {
        return error.trim();
      }

      if (
        isRecord(error) &&
        typeof error.message === "string" &&
        error.message.trim()
      ) {
        return error.message.trim();
      }
    }
  }

  return null;
}

function getDefaultErrorMessage(status: number): string {
  if (status === 401) {
    return "Your session is invalid or has expired.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status === 429) {
    return "Too many requests. Please try again shortly.";
  }

  if (status >= 500) {
    return "The server is currently unavailable. Please try again.";
  }

  return "The request could not be completed.";
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = buildApiUrl(path);
  const {
    auth = true,
    body,
    headers: initialHeaders,
    cache = "no-store",
    ...requestInit
  } = options;
  const headers = new Headers(initialHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let serializedBody: BodyInit | undefined;

  if (body !== undefined) {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    if (isFormData) {
      headers.delete("Content-Type");
      serializedBody = body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      try {
        serializedBody = JSON.stringify(body);
      } catch {
        throw new ApiError("The request could not be prepared.", {
          code: "INVALID_RESPONSE",
        });
      }
    }
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } else {
    headers.delete("Authorization");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...requestInit,
      method,
      headers,
      body: serializedBody,
      cache,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("The request was cancelled.", {
        code: "REQUEST_ABORTED",
      });
    }

    throw new ApiError("Unable to connect to the server. Please try again.", {
      code: "NETWORK_ERROR",
    });
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAccessToken();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    }

    const safeResponseMessage =
      response.status < 500 ? getResponseMessage(payload) : null;

    throw new ApiError(
      safeResponseMessage ?? getDefaultErrorMessage(response.status),
      {
        status: response.status,
        code: "HTTP_ERROR",
        details: response.status < 500 ? payload : undefined,
      },
    );
  }

  return payload as T;
}

export const api = {
  get<T>(path: string, options: ApiCallOptions = {}): Promise<T> {
    return request<T>("GET", path, options);
  },

  post<T>(
    path: string,
    body?: unknown,
    options: ApiCallOptions = {},
  ): Promise<T> {
    return request<T>("POST", path, { ...options, body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options: ApiCallOptions = {},
  ): Promise<T> {
    return request<T>("PATCH", path, { ...options, body });
  },

  delete<T>(path: string, options: ApiCallOptions = {}): Promise<T> {
    return request<T>("DELETE", path, options);
  },
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return error instanceof ApiError && error.message.trim()
    ? error.message
    : fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !isRecord(error.details)) return {};

  const errors = error.details.errors;
  if (!Array.isArray(errors)) return {};

  const fieldErrors: Record<string, string> = {};

  for (const item of errors) {
    if (!isRecord(item) || typeof item.field !== "string" || typeof item.message !== "string") continue;
    const field = item.field.replace(/^(body|query|params)\./, "");
    fieldErrors[field] ??= item.message;
  }

  return fieldErrors;
}

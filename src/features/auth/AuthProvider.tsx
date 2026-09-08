"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthContextValue,
  User,
  UserRole,
  UserStatus,
} from "@/features/auth/auth.types";
import {
  AUTH_UNAUTHORIZED_EVENT,
  ApiError,
  api,
  getApiErrorMessage,
} from "@/lib/api";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type UnknownRecord = Record<string, unknown>;

const USER_ROLES: readonly UserRole[] = [
  "admin",
  "wholesaler",
  "retailer",
];

const USER_STATUSES: readonly UserStatus[] = [
  "active",
  "inactive",
  "pending",
  "rejected",
];

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function collectEnvelopeRecords(payload: unknown): UnknownRecord[] {
  const records: UnknownRecord[] = [];
  const queue: unknown[] = [payload];
  const wrapperKeys = ["data", "result", "payload", "response"] as const;

  while (queue.length && records.length < 12) {
    const candidate = queue.shift();

    if (!isRecord(candidate) || records.includes(candidate)) {
      continue;
    }

    records.push(candidate);

    for (const key of wrapperKeys) {
      if (isRecord(candidate[key])) {
        queue.push(candidate[key]);
      }
    }
  }

  return records;
}

function parseUserRecord(record: UnknownRecord): User | null {
  const id = readString(record._id) ?? readString(record.id);
  const name = readString(record.name) ?? readString(record.fullName);
  const email = readString(record.email);
  const rawRole = readString(record.role)?.toLowerCase();
  const rawStatus = readString(record.status)?.toLowerCase();

  if (
    !id ||
    !name ||
    !email ||
    !rawRole ||
    !USER_ROLES.includes(rawRole as UserRole) ||
    !rawStatus ||
    !USER_STATUSES.includes(rawStatus as UserStatus)
  ) {
    return null;
  }

  const user: User = {
    _id: id,
    name,
    email,
    role: rawRole as UserRole,
    status: rawStatus as UserStatus,
    discountPercent:
      typeof record.discountPercent === "number" ? record.discountPercent : 0,
    parentWholesaler:
      typeof record.parentWholesaler === "string"
        ? record.parentWholesaler
        : null,
  };

  if (typeof record.phone === "string") {
    user.phone = record.phone;
  }

  if (typeof record.isEmailVerified === "boolean") {
    user.isEmailVerified = record.isEmailVerified;
  }

  if (record.lastLoginAt === null || typeof record.lastLoginAt === "string") {
    user.lastLoginAt = record.lastLoginAt;
  }

  if (typeof record.createdAt === "string") {
    user.createdAt = record.createdAt;
  }

  if (typeof record.updatedAt === "string") {
    user.updatedAt = record.updatedAt;
  }

  return user;
}

function normalizeUserResponse(payload: unknown): User {
  const records = collectEnvelopeRecords(payload);
  const explicitUserCandidates: unknown[] = [];

  for (const record of records) {
    explicitUserCandidates.push(record.user, record.admin, record.account);
  }

  for (const candidate of [...explicitUserCandidates, ...records]) {
    if (!isRecord(candidate)) {
      continue;
    }

    const user = parseUserRecord(candidate);

    if (user) {
      return user;
    }
  }

  throw new ApiError("The server returned an invalid authentication response.", {
    code: "INVALID_RESPONSE",
  });
}

function normalizeLoginResponse(payload: unknown): {
  accessToken: string;
  user: User;
} {
  const records = collectEnvelopeRecords(payload);
  let accessToken: string | null = null;

  for (const record of records) {
    if (record.success === false) {
      throw new ApiError(
        readString(record.message) ?? "Authentication failed.",
        {
          status:
            typeof record.statusCode === "number" ? record.statusCode : 0,
          code: "HTTP_ERROR",
        },
      );
    }

    accessToken ??=
      readString(record.accessToken) ??
      readString(record.token) ??
      readString(record.jwt);
  }

  if (!accessToken) {
    throw new ApiError("The server returned an invalid authentication response.", {
      code: "INVALID_RESPONSE",
    });
  }

  return {
    accessToken,
    user: normalizeUserResponse(payload),
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const operationIdRef = useRef(0);
  const hasRestoredSessionRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshCurrentUser = useCallback(async (): Promise<User | null> => {
    const operationId = ++operationIdRef.current;
    const token = getAccessToken();

    if (!token) {
      if (isMountedRef.current && operationId === operationIdRef.current) {
        setUser(null);
        setError(null);
        setIsLoading(false);
      }

      return null;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await api.get<unknown>("/auth/me");
      const currentUser = normalizeUserResponse(response);

      if (isMountedRef.current && operationId === operationIdRef.current) {
        setUser(currentUser);
      }

      return currentUser;
    } catch (requestError) {
      const isInvalidSession =
        requestError instanceof ApiError &&
        (requestError.status === 401 ||
          requestError.code === "INVALID_RESPONSE");

      if (isInvalidSession && operationId === operationIdRef.current) {
        clearAccessToken();
      }

      if (isMountedRef.current && operationId === operationIdRef.current) {
        if (isInvalidSession) {
          setUser(null);
        }

        setError(
          getApiErrorMessage(
            requestError,
            "Unable to verify your session. Please try again.",
          ),
        );
      }

      return null;
    } finally {
      if (isMountedRef.current && operationId === operationIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const operationId = ++operationIdRef.current;

      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await api.post<unknown>(
          "/auth/login",
          { email: email.trim(), password },
          { auth: false },
        );
        const authenticatedSession = normalizeLoginResponse(response);

        if (operationId !== operationIdRef.current) {
          throw new ApiError("The sign-in request was superseded.", {
            code: "REQUEST_ABORTED",
          });
        }

        if (!setAccessToken(authenticatedSession.accessToken)) {
          throw new ApiError(
            "Your browser could not save the session. Please enable local storage and try again.",
            { code: "INVALID_RESPONSE" },
          );
        }

        if (isMountedRef.current && operationId === operationIdRef.current) {
          setUser(authenticatedSession.user);
        }

        return authenticatedSession.user;
      } catch (requestError) {
        const message = getApiErrorMessage(
          requestError,
          "Unable to sign in. Please try again.",
        );

        if (isMountedRef.current && operationId === operationIdRef.current) {
          setUser(null);
          setError(message);
        }

        throw requestError;
      } finally {
        if (isMountedRef.current && operationId === operationIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const logout = useCallback(() => {
    operationIdRef.current += 1;
    clearAccessToken();
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [logout]);

  useEffect(() => {
    if (hasRestoredSessionRef.current) {
      return;
    }

    hasRestoredSessionRef.current = true;
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      error,
      login,
      logout,
      refreshCurrentUser,
      clearError,
    }),
    [user, isLoading, error, login, logout, refreshCurrentUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

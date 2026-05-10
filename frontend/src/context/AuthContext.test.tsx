import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { TOKEN_STORAGE_KEY } from "@/lib/auth";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

// Mock the API
vi.mock("@/lib/api", () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

import { api } from "@/lib/api";

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("has isAuthenticated false by default", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login with valid credentials sets isAuthenticated to true", async () => {
    (api.login as ReturnType<typeof vi.fn>).mockResolvedValue({ token: "test-token" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("user", "password");
    });

    expect(loginResult!).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("test-token");
  });

  it("login with invalid credentials returns false", async () => {
    (api.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Invalid credentials"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login("wrong", "wrong");
    });

    expect(loginResult!).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("register with valid data sets isAuthenticated to true", async () => {
    (api.register as ReturnType<typeof vi.fn>).mockResolvedValue({ token: "new-token" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let registerResult: { success: boolean; error?: string };
    await act(async () => {
      registerResult = await result.current.register("newuser", "newpass123");
    });

    expect(registerResult!.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("new-token");
  });

  it("register with duplicate username returns error", async () => {
    (api.register as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Username already taken"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let registerResult: { success: boolean; error?: string };
    await act(async () => {
      registerResult = await result.current.register("existing", "password123");
    });

    expect(registerResult!.success).toBe(false);
    expect(registerResult!.error).toBe("Username already taken");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("logout sets isAuthenticated to false and clears session", async () => {
    // Pre-seed the session
    localStorage.setItem(TOKEN_STORAGE_KEY, "existing-token");
    (api.logout as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for useEffect to read localStorage
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("initializes isAuthenticated to true if token exists in localStorage", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "stored-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});

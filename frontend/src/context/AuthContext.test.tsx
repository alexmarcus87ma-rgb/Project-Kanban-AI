import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { VALID_USERNAME, VALID_PASSWORD, AUTH_STORAGE_KEY } from "@/lib/auth";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("has isAuthenticated false by default", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login with valid credentials sets isAuthenticated to true and returns true", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      const ok = result.current.login(VALID_USERNAME, VALID_PASSWORD);
      expect(ok).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe("true");
  });

  it("login with invalid credentials returns false and keeps isAuthenticated false", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      const ok = result.current.login("wrong", "wrong");
      expect(ok).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("logout sets isAuthenticated to false and clears session", () => {
    // Pre-seed the session
    localStorage.setItem(AUTH_STORAGE_KEY, "true");

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for useEffect to read localStorage
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("initializes isAuthenticated to true if session exists in localStorage", () => {
    // Pre-seed the session before rendering
    localStorage.setItem(AUTH_STORAGE_KEY, "true");

    const { result } = renderHook(() => useAuth(), { wrapper });

    // useEffect runs after render, so isAuthenticated should now be true
    expect(result.current.isAuthenticated).toBe(true);
  });
});

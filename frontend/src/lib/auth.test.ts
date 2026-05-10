import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession,
  clearSession,
  getSession,
  TOKEN_STORAGE_KEY,
} from "./auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveSession and getSession", () => {
    it("getSession returns null when nothing stored", () => {
      expect(getSession()).toBe(null);
    });

    it("saveSession stores token and getSession retrieves it", () => {
      saveSession("test-token-123");
      expect(getSession()).toBe("test-token-123");
    });

    it("stores token under the correct key", () => {
      saveSession("my-token");
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("my-token");
    });
  });

  describe("clearSession", () => {
    it("clearSession removes stored token", () => {
      saveSession("token-to-clear");
      expect(getSession()).toBe("token-to-clear");
      clearSession();
      expect(getSession()).toBe(null);
    });

    it("clearSession is safe to call when no session exists", () => {
      expect(() => clearSession()).not.toThrow();
      expect(getSession()).toBe(null);
    });
  });
});

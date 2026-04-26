import { describe, it, expect, beforeEach } from "vitest";
import {
  validateCredentials,
  saveSession,
  clearSession,
  getSession,
  VALID_USERNAME,
  VALID_PASSWORD,
  AUTH_STORAGE_KEY,
} from "./auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("validateCredentials", () => {
    it("returns true for correct username and password", () => {
      expect(validateCredentials(VALID_USERNAME, VALID_PASSWORD)).toBe(true);
    });

    it("returns false for wrong username", () => {
      expect(validateCredentials("wrong", VALID_PASSWORD)).toBe(false);
    });

    it("returns false for wrong password", () => {
      expect(validateCredentials(VALID_USERNAME, "wrong")).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(validateCredentials("", "")).toBe(false);
    });
  });

  describe("saveSession and getSession", () => {
    it("getSession returns false when nothing stored", () => {
      expect(getSession()).toBe(false);
    });

    it("saveSession then getSession returns true", () => {
      saveSession();
      expect(getSession()).toBe(true);
    });
  });

  describe("clearSession", () => {
    it("clearSession after saveSession makes getSession return false", () => {
      saveSession();
      expect(getSession()).toBe(true);
      clearSession();
      expect(getSession()).toBe(false);
    });
  });
});

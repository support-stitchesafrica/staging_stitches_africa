import { describe, it, expect, vi, beforeEach } from "vitest";
import { AtlasAuthService } from "./auth-service";

// Mock Firebase modules
vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

describe("AtlasAuthService", () => {
  describe("validateEmailDomain", () => {
    it("should return true for valid @stitchesafrica.com email", () => {
      expect(AtlasAuthService.validateEmailDomain("user@stitchesafrica.com")).toBe(true);
    });

    it("should return true for valid @stitchesafrica.pro email", () => {
      expect(AtlasAuthService.validateEmailDomain("user@stitchesafrica.pro")).toBe(true);
    });

    it("should return true for uppercase email with valid domain", () => {
      expect(AtlasAuthService.validateEmailDomain("USER@STITCHESAFRICA.COM")).toBe(true);
    });

    it("should return true for email with spaces (trimmed)", () => {
      expect(AtlasAuthService.validateEmailDomain("  user@stitchesafrica.com  ")).toBe(true);
    });

    it("should return false for invalid domain", () => {
      expect(AtlasAuthService.validateEmailDomain("user@gmail.com")).toBe(false);
    });

    it("should return false for yahoo.com domain", () => {
      expect(AtlasAuthService.validateEmailDomain("user@yahoo.com")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(AtlasAuthService.validateEmailDomain("")).toBe(false);
    });

    it("should return false for null input", () => {
      expect(AtlasAuthService.validateEmailDomain(null as any)).toBe(false);
    });

    it("should return false for undefined input", () => {
      expect(AtlasAuthService.validateEmailDomain(undefined as any)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(AtlasAuthService.validateEmailDomain(123 as any)).toBe(false);
    });

    it("should return false for email without @ symbol", () => {
      expect(AtlasAuthService.validateEmailDomain("userstitchesafrica.com")).toBe(false);
    });

    it("should return false for similar but incorrect domain", () => {
      expect(AtlasAuthService.validateEmailDomain("user@stitchesafrica.org")).toBe(false);
    });
  });

  describe("registerAtlasUser", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return error for invalid email domain", async () => {
      const result = await AtlasAuthService.registerAtlasUser(
        "user@gmail.com",
        "password123",
        "John Doe"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed"
      );
    });

    it("should return error for empty full name", async () => {
      const result = await AtlasAuthService.registerAtlasUser(
        "user@stitchesafrica.com",
        "password123",
        ""
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Full name is required");
    });

    it("should return error for whitespace-only full name", async () => {
      const result = await AtlasAuthService.registerAtlasUser(
        "user@stitchesafrica.com",
        "password123",
        "   "
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Full name is required");
    });

    it("should return error for password less than 6 characters", async () => {
      const result = await AtlasAuthService.registerAtlasUser(
        "user@stitchesafrica.com",
        "12345",
        "John Doe"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password should be at least 6 characters");
    });

    it("should return error for empty password", async () => {
      const result = await AtlasAuthService.registerAtlasUser(
        "user@stitchesafrica.com",
        "",
        "John Doe"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password should be at least 6 characters");
    });
  });

  describe("loginAtlasUser", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return error for empty email", async () => {
      const result = await AtlasAuthService.loginAtlasUser("", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should return error for empty password", async () => {
      const result = await AtlasAuthService.loginAtlasUser(
        "user@stitchesafrica.com",
        ""
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should return error for both empty email and password", async () => {
      const result = await AtlasAuthService.loginAtlasUser("", "");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });
  });

  describe("getAtlasUser", () => {
    it("should return null for empty uid", async () => {
      const result = await AtlasAuthService.getAtlasUser("");

      expect(result).toBeNull();
    });

    it("should return null for null uid", async () => {
      const result = await AtlasAuthService.getAtlasUser(null as any);

      expect(result).toBeNull();
    });

    it("should return null for undefined uid", async () => {
      const result = await AtlasAuthService.getAtlasUser(undefined as any);

      expect(result).toBeNull();
    });
  });

  describe("validateAtlasAccess", () => {
    it("should return false for empty uid", async () => {
      const result = await AtlasAuthService.validateAtlasAccess("");

      expect(result).toBe(false);
    });
  });
});

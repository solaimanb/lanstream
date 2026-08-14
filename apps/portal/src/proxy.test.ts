/**
 * Unit tests — proxy security headers and redirect logic.
 */
import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

// Mock NextRequest/NextResponse
function createMockRequest(
  pathname: string,
  sessionCookie: "none" | "standard" | "secure" = "none",
) {
  const url = new URL(`http://localhost:3000${pathname}`);
  const cookies: Record<string, string> =
    sessionCookie === "standard"
      ? { "better-auth.session_token": "abc123" }
      : sessionCookie === "secure"
        ? { "__Secure-better-auth.session_token": "abc123" }
        : {};

  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) =>
        cookies[name] ? { value: cookies[name] } : undefined,
    },
  } as unknown as NextRequest;
}

describe("Proxy", () => {
  describe("security headers", () => {
    it("adds security headers to responses", () => {
      const req = createMockRequest("/");
      const response = proxy(req);

      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("0");
      expect(response.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(response.headers.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=()",
      );
    });
  });

  describe("auth redirects", () => {
    it("redirects authenticated users from sign-in to dashboard", () => {
      const req = createMockRequest("/sign-in", "standard");
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("redirects authenticated users from sign-up to dashboard", () => {
      const req = createMockRequest("/sign-up", "standard");
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("redirects unauthenticated users from dashboard to sign-in", () => {
      const req = createMockRequest("/dashboard");
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/sign-in");
    });

    it("redirects unauthenticated users from servers to sign-in", () => {
      const req = createMockRequest("/servers/abc123");
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/sign-in");
    });

    it("redirects unauthenticated users from hosts to sign-in", () => {
      const req = createMockRequest("/hosts");
      const response = proxy(req);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/sign-in");
    });

    it("allows authenticated users to access portal pages", () => {
      const req = createMockRequest("/dashboard", "standard");
      const response = proxy(req);

      expect(response.status).toBe(200);
    });

    it("allows unauthenticated users to access public pages", () => {
      const req = createMockRequest("/");
      const response = proxy(req);

      expect(response.status).toBe(200);
    });

    it("recognizes secure production session cookies", () => {
      const req = createMockRequest("/dashboard", "secure");
      expect(proxy(req).status).toBe(200);
    });
  });
});

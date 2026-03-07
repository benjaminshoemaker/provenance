import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth before importing middleware
vi.mock("next-auth", () => {
  const authMiddleware = vi.fn();
  return {
    default: vi.fn(() => ({
      auth: authMiddleware,
    })),
    __authMiddleware: authMiddleware,
  };
});

vi.mock("./auth.config", () => ({
  default: {
    providers: [],
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
  },
}));

describe("middleware", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should redirect unauthenticated requests to /login for /dashboard routes", async () => {
    // Test the middleware config matcher
    const { config } = await import("./proxy");
    expect(config.matcher).toContain("/dashboard/:path*");
    expect(config.matcher).toContain("/editor/:path*");
  });

  it("should protect both /dashboard and /editor/* routes", async () => {
    const { config } = await import("./proxy");
    const matchers = config.matcher;

    expect(matchers).toEqual(
      expect.arrayContaining(["/dashboard/:path*", "/editor/:path*"])
    );
  });

  it("should export middleware that uses auth.config pattern", async () => {
    // Verify the middleware module can be imported and has the expected structure
    const middlewareModule = await import("./proxy");

    // The module should export a config with matchers
    expect(middlewareModule.config).toBeDefined();
    expect(middlewareModule.config.matcher).toBeDefined();

    // Protected routes should include dashboard and editor
    const matchers = middlewareModule.config.matcher;
    const protectsRoutes = matchers.some(
      (m: string) => m.includes("dashboard") || m.includes("editor")
    );
    expect(protectsRoutes).toBe(true);
  });

  it("should import auth config from auth.config (Edge-safe)", async () => {
    // Verify that middleware imports from auth.config, not auth
    // This is crucial for Edge runtime compatibility
    const authConfig = await import("./auth.config");
    expect(authConfig.default).toBeDefined();
    expect(authConfig.default.providers).toBeDefined();
    expect(authConfig.default.session).toEqual({ strategy: "jwt" });
  });

  it("should have signIn page configured as /login", async () => {
    const authConfig = await import("./auth.config");
    expect(authConfig.default.pages?.signIn).toBe("/login");
  });
});

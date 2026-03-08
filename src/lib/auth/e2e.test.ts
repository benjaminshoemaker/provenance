import { describe, expect, it } from "vitest";
import {
  DEFAULT_E2E_CALLBACK_URL,
  getAllowedE2EUsers,
  isE2EAuthEnabled,
  parseE2ELoginSearchParams,
  resolveE2EUserProfile,
  sanitizeE2ECallbackUrl,
} from "./e2e";

describe("e2e auth helpers", () => {
  it("should detect when e2e auth is enabled", () => {
    expect(
      isE2EAuthEnabled({
        E2E_AUTH_ENABLED: "true",
        E2E_AUTH_SECRET: "test-secret",
      })
    ).toBe(true);
  });

  it("should reject absolute callback urls", () => {
    expect(sanitizeE2ECallbackUrl("https://example.com/dashboard")).toBeNull();
    expect(sanitizeE2ECallbackUrl("javascript:alert(1)")).toBeNull();
  });

  it("should normalize valid callback urls", () => {
    expect(sanitizeE2ECallbackUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeE2ECallbackUrl("/editor/123")).toBe("/editor/123");
    expect(sanitizeE2ECallbackUrl(undefined)).toBe(DEFAULT_E2E_CALLBACK_URL);
  });

  it("should parse an allowed login request when the token matches", () => {
    const parsed = parseE2ELoginSearchParams(
      {
        token: "test-secret",
        user: "author-a",
        callbackUrl: "/dashboard",
      },
      {
        E2E_AUTH_ENABLED: "true",
        E2E_AUTH_SECRET: "test-secret",
      }
    );

    expect(parsed).toEqual({
      token: "test-secret",
      userKey: "author-a",
      callbackUrl: "/dashboard",
    });
  });

  it("should reject login requests for unknown users", () => {
    const parsed = parseE2ELoginSearchParams(
      {
        token: "test-secret",
        user: "unknown-user",
      },
      {
        E2E_AUTH_ENABLED: "true",
        E2E_AUTH_SECRET: "test-secret",
      }
    );

    expect(parsed).toBeNull();
  });

  it("should resolve deterministic user profiles", () => {
    expect(resolveE2EUserProfile("author-a")).toEqual({
      userKey: "author-a",
      email: "e2e+author-a@provenance.local",
      name: "E2E Author A",
    });
  });

  it("should allow overriding the default user list", () => {
    expect(
      getAllowedE2EUsers({
        E2E_AUTH_USERS: "writer-one, writer-two ,writer-three",
      })
    ).toEqual(["writer-one", "writer-two", "writer-three"]);
  });
});

import path from "node:path";

const verificationDir = path.join(process.cwd(), ".claude", "verification");

export const AUTH_STATE_AUTHOR_A_PATH = path.join(
  verificationDir,
  "auth-state-author-a.json"
);
export const AUTH_STATE_AUTHOR_B_PATH = path.join(
  verificationDir,
  "auth-state-author-b.json"
);

export function buildE2ELoginPath(
  userKey: string,
  callbackUrl = "/dashboard"
): string {
  const params = new URLSearchParams({
    token: process.env.E2E_AUTH_SECRET ?? "local-e2e-secret",
    user: userKey,
    callbackUrl,
  });

  return `/login/e2e?${params.toString()}`;
}

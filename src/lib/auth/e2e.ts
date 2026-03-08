export const DEFAULT_E2E_CALLBACK_URL = "/dashboard";
const DEFAULT_E2E_USERS = ["author-a", "author-b"];
const E2E_EMAIL_DOMAIN = "provenance.local";

type EnvSource = Record<string, string | undefined>;

export interface E2ELoginRequest {
  token: string;
  userKey: string;
  callbackUrl: string;
}

export interface E2EUserProfile {
  userKey: string;
  email: string;
  name: string;
}

function readEnv(env?: EnvSource): EnvSource {
  return env ?? (process.env as EnvSource);
}

function toSingleValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function titleCaseUserKey(userKey: string): string {
  return userKey
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isE2EAuthEnabled(env?: EnvSource): boolean {
  const source = readEnv(env);
  return (
    source.E2E_AUTH_ENABLED === "true" &&
    typeof source.E2E_AUTH_SECRET === "string" &&
    source.E2E_AUTH_SECRET.length > 0
  );
}

export function getAllowedE2EUsers(env?: EnvSource): string[] {
  const source = readEnv(env);
  const configuredUsers = source.E2E_AUTH_USERS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configuredUsers && configuredUsers.length > 0
    ? configuredUsers
    : DEFAULT_E2E_USERS;
}

export function sanitizeE2ECallbackUrl(callbackUrl?: string): string | null {
  if (!callbackUrl) return DEFAULT_E2E_CALLBACK_URL;
  if (!callbackUrl.startsWith("/")) return null;
  if (callbackUrl.startsWith("//")) return null;
  if (callbackUrl.includes("://")) return null;
  return callbackUrl;
}

export function resolveE2EUserProfile(
  userKey: string,
  env?: EnvSource
): E2EUserProfile | null {
  if (!getAllowedE2EUsers(env).includes(userKey)) {
    return null;
  }

  return {
    userKey,
    email: `e2e+${userKey}@${E2E_EMAIL_DOMAIN}`,
    name: `E2E ${titleCaseUserKey(userKey)}`,
  };
}

export function parseE2ELoginSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  env?: EnvSource
): E2ELoginRequest | null {
  const source = readEnv(env);
  if (!isE2EAuthEnabled(source)) return null;

  const token = toSingleValue(searchParams.token);
  const userKey = toSingleValue(searchParams.user);
  const callbackUrl = sanitizeE2ECallbackUrl(
    toSingleValue(searchParams.callbackUrl)
  );

  if (!token || token !== source.E2E_AUTH_SECRET) return null;
  if (!userKey || !resolveE2EUserProfile(userKey, source)) return null;
  if (!callbackUrl) return null;

  return {
    token,
    userKey,
    callbackUrl,
  };
}

export async function upsertE2EUser(
  userKey: string,
  env?: EnvSource
): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const [{ db }, { users }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
  ]);
  const profile = resolveE2EUserProfile(userKey, env);
  if (!profile) return null;

  const [user] = await db
    .insert(users)
    .values({
      email: profile.email,
      name: profile.name,
      emailVerified: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: profile.name,
        emailVerified: new Date(),
      },
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  return user ?? null;
}

export async function authorizeE2ECredentials(
  credentials: Partial<Record<string, unknown>> | undefined,
  env?: EnvSource
): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const source = readEnv(env);
  if (!isE2EAuthEnabled(source)) return null;

  const token =
    typeof credentials?.token === "string" ? credentials.token : undefined;
  const userKey =
    typeof credentials?.userKey === "string" ? credentials.userKey : undefined;

  if (!token || token !== source.E2E_AUTH_SECRET) return null;
  if (!userKey || !resolveE2EUserProfile(userKey, source)) return null;

  return upsertE2EUser(userKey, source);
}

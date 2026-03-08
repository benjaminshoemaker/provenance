import NextAuth, { type NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { authorizeE2ECredentials, isE2EAuthEnabled } from "@/lib/auth/e2e";
import authConfig from "./auth.config";

const providers: NonNullable<NextAuthConfig["providers"]> = [
  ...authConfig.providers,
];

if (isE2EAuthEnabled()) {
  providers.push(
    Credentials({
      id: "e2e",
      name: "E2E",
      credentials: {
        userKey: { label: "User Key", type: "text" },
        token: { label: "Token", type: "password" },
      },
      authorize: (credentials) => authorizeE2ECredentials(credentials),
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  ...authConfig,
  providers,
});

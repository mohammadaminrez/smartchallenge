import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChallenges = nextUrl.pathname.startsWith("/challenges");
      if (isOnChallenges) {
        return isLoggedIn;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/challenges", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider basePath="/rfp/api/auth">
      {children}
    </NextAuthSessionProvider>
  );
}

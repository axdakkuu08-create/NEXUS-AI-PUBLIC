"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk, ConvexReactClient } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ConfigurationRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050807] px-6 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-emerald-900/60 bg-[#0b1410] p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">NEXUS-AI setup required</p>
        <h1 className="mt-3 text-2xl font-semibold">Authentication and data services are not configured</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and NEXT_PUBLIC_CONVEX_URL for the same
          non-production Clerk application and Convex deployment before using the workspace.
          No messages are stored locally as a substitute for the backend.
        </p>
      </section>
    </main>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!convexUrl || !clerkPublishableKey) return <ConfigurationRequired />;
  const client = new ConvexReactClient(convexUrl);
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

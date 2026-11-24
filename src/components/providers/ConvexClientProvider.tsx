"use client";

import { useMemo, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

function ConfiguredConvexProvider({ children, url }: { children: ReactNode; url: string }) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return <ConvexProviderWithClerk client={client} useAuth={useAuth}>{children}</ConvexProviderWithClerk>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return <>{children}</>;
  return <ConfiguredConvexProvider url={url}>{children}</ConfiguredConvexProvider>;
}

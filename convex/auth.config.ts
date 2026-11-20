import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://charmed-goshawk-6691.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

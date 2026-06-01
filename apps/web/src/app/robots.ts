import type { MetadataRoute } from "next";

// Allow indexing in the MVP soft-launch. Tighten per-environment later.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}

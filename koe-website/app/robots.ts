import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://koe.jstarstudios.com/sitemap.xml",
    host: "https://koe.jstarstudios.com",
  };
}

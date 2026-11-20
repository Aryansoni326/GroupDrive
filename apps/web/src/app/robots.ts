import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groupdrive.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/login",
          "/register",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


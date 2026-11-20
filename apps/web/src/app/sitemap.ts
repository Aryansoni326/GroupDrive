import { MetadataRoute } from "next";
import {
  MOCK_CATALOGUE_MODELS,
  MOCK_AUTHORIZED_DEALERS,
  MOCK_PUBLIC_BUYER_GROUPS,
} from "@groupdrive/api-client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groupdrive.in";
  const currentDate = new Date();

  // Primary static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dealers`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/groups`,
      lastModified: currentDate,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/campaigns`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic vehicle pages
  const vehicleRoutes: MetadataRoute.Sitemap = MOCK_CATALOGUE_MODELS.map((model) => ({
    url: `${baseUrl}/cars/${model.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // Dynamic authorized dealer pages
  const dealerRoutes: MetadataRoute.Sitemap = MOCK_AUTHORIZED_DEALERS.map((dealer) => ({
    url: `${baseUrl}/dealers/${dealer.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic active collective buyer group pages
  const groupRoutes: MetadataRoute.Sitemap = MOCK_PUBLIC_BUYER_GROUPS.map((group) => ({
    url: `${baseUrl}/groups/${group.id}`,
    lastModified: currentDate,
    changeFrequency: "hourly",
    priority: 0.85,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...dealerRoutes, ...groupRoutes];
}


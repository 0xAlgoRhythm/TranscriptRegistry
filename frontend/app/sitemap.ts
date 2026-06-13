import { MetadataRoute } from "next";

const baseUrl = "https://credaxis.app";

const locales = ["en", "es"];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/dashboard",
    "/verify-onchain",
    "/issued",
    "/activity",
    "/dashboard/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route === "" ? "" : route}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [
          locale,
          `${baseUrl}/${locale}${route === "" ? "" : route}`,
        ])
      ),
    },
  }));
}

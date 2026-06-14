import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "*",
        disallow: ["/dashboard", "/admin"],
      },
    ],
    sitemap: "https://smssar.ma/sitemap.xml",
  };
}

import type { MetadataRoute } from "next";
import { metiers } from "@/lib/metiers";
import { absoluteUrl } from "@/lib/seo";
import { templates } from "@/lib/templates";

/** Pages publiques de la plateforme. Les sites des clients ont leur propre domaine et n'y figurent pas. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/creation-site-internet", 0.9),
    ...metiers.map((m) => page(`/creation-site-internet/${m.slug}`, 0.8)),
    page("/exemples", 0.8),
    ...templates.map((t) => page(`/exemples/${t.id}`, 0.6)),
    ...["/mentions-legales", "/confidentialite", "/cgv", "/accessibilite"].map((p) => page(p, 0.2, "yearly")),
  ];
}

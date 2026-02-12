import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "profile" | "video" | "article";
}

const DEFAULT_TITLE = "Red Akasha";
const DEFAULT_DESCRIPTION = "Plataforma de streaming, música y arte independiente de Latinoamérica y el mundo.";
const DEFAULT_IMAGE = "https://red-akasha-stream.lovable.app/favicon.png";

function setMetaTag(attr: "property" | "name", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMetaTag(attr: "property" | "name", key: string) {
  const el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) el.remove();
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const pageUrl = url || window.location.href;

    // Document title
    const prevTitle = document.title;
    document.title = fullTitle;

    // Standard meta
    setMetaTag("name", "description", desc);

    // Open Graph
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:image", img);
    setMetaTag("property", "og:url", pageUrl);
    setMetaTag("property", "og:type", type === "video" ? "video.other" : type);
    setMetaTag("property", "og:site_name", DEFAULT_TITLE);

    // Twitter Card
    setMetaTag("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", desc);
    setMetaTag("name", "twitter:image", img);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", pageUrl);

    return () => {
      document.title = prevTitle;
      removeMetaTag("name", "description");
      removeMetaTag("property", "og:title");
      removeMetaTag("property", "og:description");
      removeMetaTag("property", "og:image");
      removeMetaTag("property", "og:url");
      removeMetaTag("property", "og:type");
      removeMetaTag("property", "og:site_name");
      removeMetaTag("name", "twitter:card");
      removeMetaTag("name", "twitter:title");
      removeMetaTag("name", "twitter:description");
      removeMetaTag("name", "twitter:image");
      const c = document.querySelector('link[rel="canonical"]');
      if (c) c.remove();
    };
  }, [title, description, image, url, type]);
}

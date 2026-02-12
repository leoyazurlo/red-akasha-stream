const BASE_URL = "https://red-akasha-stream.lovable.app";
const DEFAULT_IMAGE = `${BASE_URL}/favicon.png`;

export const platformSEO = {
  title: undefined as string | undefined, // uses default "Red Akasha"
  description:
    "Plataforma de streaming, música y arte independiente de Latinoamérica y el mundo. Descubre artistas, streams en vivo y contenido on demand.",
  image: DEFAULT_IMAGE,
  url: BASE_URL,
  type: "website" as const,
};

export function generateArtistSEO(artist: {
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  country?: string | null;
  id: string;
}) {
  const location = [artist.city, artist.country].filter(Boolean).join(", ");
  return {
    title: artist.name,
    description: artist.bio
      ? artist.bio.slice(0, 155)
      : `Descubre a ${artist.name}${location ? ` de ${location}` : ""} en Red Akasha.`,
    image: artist.avatar_url || DEFAULT_IMAGE,
    url: `${BASE_URL}/artista/${artist.id}`,
    type: "profile" as const,
  };
}

export function generateStreamSEO(
  stream: {
    title: string;
    description?: string | null;
    thumbnail_url?: string | null;
    id: string;
  },
  artistName?: string
) {
  return {
    title: artistName ? `${stream.title} — ${artistName}` : stream.title,
    description:
      stream.description?.slice(0, 155) ||
      `Mira ${stream.title}${artistName ? ` de ${artistName}` : ""} en Red Akasha.`,
    image: stream.thumbnail_url || DEFAULT_IMAGE,
    url: `${BASE_URL}/video/${stream.id}`,
    type: "video" as const,
  };
}

export function generateEventSEO(
  event: { title: string; description?: string | null; id: string },
  location?: string
) {
  return {
    title: event.title,
    description:
      event.description?.slice(0, 155) ||
      `${event.title}${location ? ` en ${location}` : ""} — Red Akasha.`,
    image: DEFAULT_IMAGE,
    url: `${BASE_URL}/evento/${event.id}`,
    type: "article" as const,
  };
}

export function generateMapSEO() {
  return {
    title: "Mapa de Artistas en Vivo",
    description:
      "Explora artistas streameando en vivo alrededor del mundo en el mapa interactivo de Red Akasha.",
    image: DEFAULT_IMAGE,
    url: `${BASE_URL}/live`,
    type: "website" as const,
  };
}

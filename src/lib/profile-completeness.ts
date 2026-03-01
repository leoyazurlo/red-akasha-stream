/**
 * @fileoverview Sistema de puntos ponderados para evaluar completitud de perfil.
 * Adapta los criterios según el tipo de perfil del usuario.
 */

export interface CompletenessItem {
  label: string;
  points: number;
  completed: boolean;
  hint: string;
}

export interface CompletenessResult {
  percentage: number;
  earnedPoints: number;
  totalPoints: number;
  items: CompletenessItem[];
  meetsMinimum: boolean;
  missingItems: CompletenessItem[];
}

/** Perfiles que NO requieren galería ni videos */
const FAN_PROFILES = ["amante_de_la_musica"];

/** Perfiles que tienen campos específicos (instrumento, género, specs, etc.) */
const PROFILES_WITH_SPECIFIC_FIELDS: Record<string, string[]> = {
  musico: ["instrument", "genre", "experience_level"],
  dj: ["genre"],
  agrupacion_musical: ["genre"],
  sala_concierto: ["venue_type", "capacity"],
  estudio_grabacion: ["technical_specs"],
  sello_discografico: ["display_name", "label_genres"],
  marketing_digital: ["marketing_services"],
  percusion: ["instrument", "genre"],
  productor_artistico: [],
  productor_audiovisual: [],
  promotor_artistico: [],
  arte_digital: [],
  management: [],
  representante: [],
  vj: [],
  danza: [],
  tecnico_sonido: [],
};

interface ProfileData {
  profile_type?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  pais?: string;
  ciudad?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  whatsapp?: string;
  website?: string;
  video_links?: string[];
  gallery_images?: (string | File)[];
  // Campos específicos
  instrument?: string;
  genre?: string;
  experience_level?: string;
  technical_specs?: string;
  venue_type?: string;
  capacity?: string | number;
  display_name?: string;
  label_genres?: string[];
  marketing_services?: string[];
  [key: string]: unknown;
}

function isYouTubeUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    return (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be") ||
      u.hostname.includes("vimeo.com") ||
      u.hostname.includes("dailymotion.com")
    );
  } catch {
    return false;
  }
}

export function calculateProfileCompleteness(
  profileType: string,
  data: ProfileData
): CompletenessResult {
  const isFan = FAN_PROFILES.includes(profileType);
  const specificFields = PROFILES_WITH_SPECIFIC_FIELDS[profileType] || [];
  const hasSpecificFields = specificFields.length > 0;

  const items: CompletenessItem[] = [];

  // 1. Perfil principal elegido (10 pts) — Todos
  items.push({
    label: "Perfil principal",
    points: 10,
    completed: !!profileType,
    hint: "Elegí tu tipo de perfil principal",
  });

  // 2. Foto de perfil (10 pts) — Todos
  items.push({
    label: "Foto de perfil",
    points: 10,
    completed: !!data.avatar_url,
    hint: "Subí una foto de perfil",
  });

  // 3. Nombre + Apellido (5 pts) — Todos
  items.push({
    label: "Nombre y apellido",
    points: 5,
    completed: !!data.first_name?.trim() && !!data.last_name?.trim(),
    hint: "Completá tu nombre y apellido",
  });

  // 4. País + Ciudad (5 pts) — Todos
  items.push({
    label: "País y ciudad",
    points: 5,
    completed: !!data.pais?.trim() && !!data.ciudad?.trim(),
    hint: "Seleccioná tu país y ciudad",
  });

  // 5. Bio ≥200 caracteres (20 pts) — Todos
  const bioLength = data.bio?.trim().length || 0;
  items.push({
    label: "Biografía (mín. 200 caracteres)",
    points: 20,
    completed: bioLength >= 200,
    hint: `Escribí al menos 200 caracteres en tu biografía (tenés ${bioLength})`,
  });

  // 6. Al menos 1 red social (10 pts) — Todos
  const hasSocial =
    !!data.instagram?.trim() ||
    !!data.facebook?.trim() ||
    !!data.linkedin?.trim() ||
    !!data.whatsapp?.trim() ||
    !!data.website?.trim();
  items.push({
    label: "Red social de contacto",
    points: 10,
    completed: hasSocial,
    hint: "Agregá al menos una red social o contacto",
  });

  // 7. Al menos 4 fotos galería (15 pts) — Todos excepto fan
  if (!isFan) {
    const galleryCount = data.gallery_images?.filter(Boolean).length || 0;
    items.push({
      label: "Galería de fotos (mín. 4)",
      points: 15,
      completed: galleryCount >= 4,
      hint: `Subí al menos 4 fotos a tu galería (tenés ${galleryCount})`,
    });
  }

  // 8. Al menos 2 links de video (15 pts) — Todos excepto fan
  if (!isFan) {
    const validLinks =
      data.video_links?.filter((l) => isYouTubeUrl(l)).length || 0;
    items.push({
      label: "Links de video (mín. 2)",
      points: 15,
      completed: validLinks >= 2,
      hint: `Agregá al menos 2 links de YouTube/Vimeo (tenés ${validLinks})`,
    });
  }

  // 9. Campos específicos del perfil (10 pts)
  if (hasSpecificFields) {
    const filledSpecific = specificFields.filter((field) => {
      const val = data[field];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "number") return val > 0;
      return !!val && String(val).trim().length > 0;
    }).length;

    items.push({
      label: "Datos específicos del perfil",
      points: 10,
      completed: filledSpecific >= Math.ceil(specificFields.length / 2),
      hint: "Completá los campos específicos de tu tipo de perfil",
    });
  }

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const earnedPoints = items
    .filter((i) => i.completed)
    .reduce((sum, i) => sum + i.points, 0);
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const missingItems = items.filter((i) => !i.completed);

  return {
    percentage,
    earnedPoints,
    totalPoints,
    items,
    meetsMinimum: percentage >= 60,
    missingItems,
  };
}

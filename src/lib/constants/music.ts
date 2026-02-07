/**
 * @fileoverview Constantes relacionadas con música utilizadas en toda la plataforma Red Akasha.
 * Incluye instrumentos, géneros musicales y niveles de experiencia.
 */

/** Opciones de instrumentos musicales disponibles */
export const INSTRUMENTS = [
  { value: "voz_canto", label: "Voz/Canto" },
  { value: "guitarra", label: "Guitarra" },
  { value: "bajo", label: "Bajo" },
  { value: "bateria", label: "Batería" },
  { value: "piano", label: "Piano" },
  { value: "teclado", label: "Teclado" },
  { value: "violin", label: "Violín" },
  { value: "saxofon", label: "Saxofón" },
  { value: "trompeta", label: "Trompeta" },
  { value: "flauta", label: "Flauta" },
  { value: "clarinete", label: "Clarinete" },
  { value: "percusion", label: "Percusión" },
  { value: "dj_productor", label: "DJ/Productor" },
  { value: "sintetizador", label: "Sintetizador" },
  { value: "acordeon", label: "Acordeón" },
  { value: "armonica", label: "Armónica" },
  { value: "violonchelo", label: "Violonchelo" },
  { value: "contrabajo", label: "Contrabajo" },
  { value: "trombon", label: "Trombón" },
  { value: "charango", label: "Charango" },
  { value: "bombo", label: "Bombo" },
  { value: "bandoneon", label: "Bandoneón" },
  { value: "ukulele", label: "Ukelele" },
  { value: "mandolina", label: "Mandolina" },
  { value: "arpa", label: "Arpa" },
  { value: "otros", label: "Otros" },
] as const;

/** Géneros musicales disponibles */
export const MUSIC_GENRES = [
  { value: "rock", label: "Rock" },
  { value: "pop", label: "Pop" },
  { value: "jazz", label: "Jazz" },
  { value: "blues", label: "Blues" },
  { value: "reggae", label: "Reggae" },
  { value: "hip_hop", label: "Hip Hop" },
  { value: "rap", label: "Rap" },
  { value: "electronica", label: "Electrónica" },
  { value: "house", label: "House" },
  { value: "techno", label: "Techno" },
  { value: "trance", label: "Trance" },
  { value: "country", label: "Country" },
  { value: "folk", label: "Folk" },
  { value: "soul", label: "Soul" },
  { value: "funk", label: "Funk" },
  { value: "rnb", label: "R&B" },
  { value: "metal", label: "Metal" },
  { value: "punk", label: "Punk" },
  { value: "ska", label: "Ska" },
  { value: "clasica", label: "Clásica" },
  { value: "opera", label: "Ópera" },
  { value: "flamenco", label: "Flamenco" },
  { value: "tango", label: "Tango" },
  { value: "salsa", label: "Salsa" },
  { value: "merengue", label: "Merengue" },
  { value: "cumbia", label: "Cumbia" },
  { value: "bachata", label: "Bachata" },
  { value: "reggaeton", label: "Reggaeton" },
  { value: "kpop", label: "K-Pop" },
  { value: "jpop", label: "J-Pop" },
  { value: "andina", label: "Andina" },
  { value: "celta", label: "Celta" },
  { value: "gospel", label: "Gospel" },
  { value: "arabe", label: "Árabe" },
  { value: "africana", label: "Africana" },
  { value: "india", label: "India" },
] as const;

/** Niveles de experiencia musical */
export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Principiante (0-2 años)" },
  { value: "intermediate", label: "Intermedio (3-5 años)" },
  { value: "advanced", label: "Avanzado (6-10 años)" },
  { value: "professional", label: "Profesional (10+ años)" },
] as const;

/** Tipos derivados de las constantes */
export type InstrumentValue = typeof INSTRUMENTS[number]["value"];
export type MusicGenreValue = typeof MUSIC_GENRES[number]["value"];
export type ExperienceLevelValue = typeof EXPERIENCE_LEVELS[number]["value"];

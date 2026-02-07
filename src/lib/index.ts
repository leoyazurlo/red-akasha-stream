/**
 * @fileoverview Punto de entrada principal para la librería compartida.
 * Centraliza todas las exportaciones de utilidades, tipos y constantes.
 * 
 * @example
 * ```tsx
 * import { cn, formatDate, MUSIC_GENRES } from "@/lib";
 * import type { GeneratedCode, ProfileFormProps } from "@/lib";
 * ```
 */

// Utilidades
export * from "./utils";
export * from "./storage-keys";
export * from "./storage-validation";
export * from "./exportUtils";

// API
export * from "./api";

// Constantes
export * from "./constants";

// Tipos
export * from "./types";

// Validaciones
export * from "./validations/forum";
export * from "./validations/mentions";
export * from "./validations/password";

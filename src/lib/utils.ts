/**
 * @fileoverview Funciones de utilidad generales para Red Akasha.
 * Incluye helpers para clases CSS, formateo y validación.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases CSS de manera inteligente.
 * Usa clsx para condicionales y tailwind-merge para resolver conflictos.
 * 
 * @param inputs - Clases CSS a combinar
 * @returns String con las clases combinadas
 * 
 * @example
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda
 * @param amount - Monto a formatear
 * @param currency - Código de moneda (default: USD)
 * @returns String formateado
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formatea una fecha de manera legible (corta)
 * @param date - Fecha a formatear
 * @returns String formateado
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formatea una fecha con hora (largo)
 * @param date - Fecha a formatear
 * @returns String formateado
 */
export function formatFullDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
}).format(d);
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con "..." si excede
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Genera un ID único simple
 * @returns String con ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Espera un tiempo determinado
 * @param ms - Milisegundos a esperar
 * @returns Promise que se resuelve después del tiempo
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica si un valor es un objeto plano
 * @param value - Valor a verificar
 * @returns true si es un objeto plano
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

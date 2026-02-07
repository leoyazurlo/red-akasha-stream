/**
 * @fileoverview Constantes del ciclo de vida del App Builder de Akasha IA.
 * Define las etapas del proceso de desarrollo y sus metadatos.
 */

import {
  FileCode,
  Code,
  Shield,
  Users,
  CheckCircle,
  GitBranch,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/** Etapa del ciclo de vida de desarrollo */
export interface LifecycleStage {
  /** Identificador único de la etapa */
  key: string;
  /** Etiqueta visible al usuario */
  label: string;
  /** Icono de Lucide para la etapa */
  icon: LucideIcon;
  /** Descripción de la etapa */
  description?: string;
}

/** Etapas del ciclo de vida del desarrollo en Akasha IA */
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { 
    key: "draft", 
    label: "Borrador", 
    icon: FileCode,
    description: "Propuesta inicial sin código generado"
  },
  { 
    key: "generating", 
    label: "Generando", 
    icon: Code,
    description: "IA generando código"
  },
  { 
    key: "validating", 
    label: "Validando", 
    icon: Shield,
    description: "Validación automática de seguridad y calidad"
  },
  { 
    key: "pending_approval", 
    label: "Aprobación", 
    icon: Users,
    description: "Esperando aprobación de administradores"
  },
  { 
    key: "approved", 
    label: "Aprobado", 
    icon: CheckCircle,
    description: "Código aprobado y listo para integrar"
  },
  { 
    key: "merged", 
    label: "Integrado", 
    icon: GitBranch,
    description: "Código integrado al repositorio"
  },
  { 
    key: "deployed", 
    label: "Producción", 
    icon: Rocket,
    description: "Desplegado en producción"
  },
] as const;

/** Tipos de etapas válidas */
export type LifecycleStageKey = typeof LIFECYCLE_STAGES[number]["key"];

/**
 * Obtiene el índice de una etapa en el ciclo de vida
 * @param stage - Clave de la etapa a buscar
 * @returns Índice de la etapa o -1 si no existe
 */
export function getStageIndex(stage: string): number {
  return LIFECYCLE_STAGES.findIndex((s) => s.key === stage);
}

/**
 * Verifica si una etapa está completa respecto a otra
 * @param currentStage - Etapa actual
 * @param targetStage - Etapa a comparar
 * @returns true si la etapa objetivo está completa
 */
export function isStageComplete(currentStage: string, targetStage: string): boolean {
  return getStageIndex(currentStage) > getStageIndex(targetStage);
}

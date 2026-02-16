/**
 * @fileoverview Constantes del ciclo de vida simplificado del App Builder.
 */

import {
  FileCode,
  Code,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

/** Etapa del ciclo de vida de desarrollo */
export interface LifecycleStage {
  key: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

/** Etapas simplificadas: Borrador → Generando → Listo */
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  { 
    key: "draft", 
    label: "Borrador", 
    icon: FileCode,
    description: "Esperando instrucciones"
  },
  { 
    key: "generating", 
    label: "Generando", 
    icon: Code,
    description: "IA generando código"
  },
  { 
    key: "ready", 
    label: "Listo", 
    icon: CheckCircle,
    description: "Código generado y listo"
  },
] as const;

export type LifecycleStageKey = typeof LIFECYCLE_STAGES[number]["key"];

export function getStageIndex(stage: string): number {
  return LIFECYCLE_STAGES.findIndex((s) => s.key === stage);
}

export function isStageComplete(currentStage: string, targetStage: string): boolean {
  return getStageIndex(currentStage) > getStageIndex(targetStage);
}

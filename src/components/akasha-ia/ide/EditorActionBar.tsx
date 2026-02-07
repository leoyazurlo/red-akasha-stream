/**
 * @fileoverview Barra de acciones del editor de código.
 * Contiene botones de validación y creación de PR.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, GitBranch, Zap } from "lucide-react";

interface EditorActionBarProps {
  /** Score de validación actual (0-100) */
  validationScore: number | null;
  /** Si está validando */
  isValidating: boolean;
  /** Si está creando PR */
  isCreatingPR: boolean;
  /** Etapa actual del ciclo de vida */
  lifecycleStage: string;
  /** Callback para validar */
  onValidate: () => void;
  /** Callback para crear PR */
  onCreatePR: () => void;
}

/**
 * Barra de acciones inferior del editor
 */
export function EditorActionBar({
  validationScore,
  isValidating,
  isCreatingPR,
  lifecycleStage,
  onValidate,
  onCreatePR,
}: EditorActionBarProps) {
  const canValidate = !isValidating && lifecycleStage !== "generating";
  const canCreatePR =
    !isCreatingPR &&
    lifecycleStage !== "generating" &&
    lifecycleStage !== "draft" &&
    lifecycleStage !== "validating";

  return (
    <div className="flex items-center justify-between p-2 border-t border-cyan-500/10 bg-muted/30">
      <div className="flex items-center gap-2">
        {validationScore !== null && (
          <Badge
            variant={validationScore >= 70 ? "default" : "destructive"}
            className={validationScore >= 70 ? "bg-accent/20 text-accent" : ""}
          >
            Score: {validationScore}/100
          </Badge>
        )}
        <Badge variant="outline" className="text-xs gap-1">
          <Zap className="h-3 w-3" />
          Akasha IA
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onValidate}
          disabled={!canValidate}
          className="h-7 text-xs"
        >
          {isValidating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Shield className="h-3 w-3 mr-1" />
          )}
          Validar
        </Button>
        <Button
          size="sm"
          onClick={onCreatePR}
          disabled={!canCreatePR}
          className="h-7 text-xs"
        >
          {isCreatingPR ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <GitBranch className="h-3 w-3 mr-1" />
          )}
          Crear PR
        </Button>
      </div>
    </div>
  );
}

/**
 * @fileoverview Barra de acciones simplificada del editor.
 */

import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

/**
 * Barra de estado inferior del editor (simplificada, sin validación ni PR)
 */
export function EditorActionBar() {
  return (
    <div className="flex items-center justify-between p-2 border-t border-cyan-500/10 bg-muted/30">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs gap-1">
          <Zap className="h-3 w-3" />
          Akasha IA
        </Badge>
      </div>
    </div>
  );
}

/**
 * @fileoverview Barra de progreso simplificada del ciclo de vida (3 etapas).
 */

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { LIFECYCLE_STAGES, getStageIndex } from "@/lib/constants";

interface LifecycleProgressBarProps {
  currentStage: string;
}

export function LifecycleProgressBar({ currentStage }: LifecycleProgressBarProps) {
  const currentIdx = getStageIndex(currentStage);

  return (
    <Card className="mb-4 bg-card/50 border-cyan-500/20">
      <CardContent className="py-3">
        <div className="flex items-center justify-center gap-4">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === currentIdx;
            const isComplete = idx < currentIdx;

            return (
              <div key={stage.key} className="flex items-center">
                <div
                  className={`flex flex-col items-center min-w-[70px] ${
                    isActive
                      ? "text-cyan-400"
                      : isComplete
                      ? "text-green-400"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? "border-cyan-400 bg-cyan-400/20 ring-2 ring-cyan-400/30"
                        : isComplete
                        ? "border-green-500 bg-green-500/20"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{stage.label}</span>
                </div>
                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight
                    className={`h-4 w-4 mx-2 ${
                      isComplete ? "text-green-500" : "text-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

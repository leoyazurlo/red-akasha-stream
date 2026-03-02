import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertTriangle, Trophy } from "lucide-react";
import { calculateProfileCompleteness, type CompletenessResult } from "@/lib/profile-completeness";

interface RegistrationCompletionBarProps {
  profileType: string;
  formData: Record<string, unknown>;
}

export const RegistrationCompletionBar = ({ profileType, formData }: RegistrationCompletionBarProps) => {
  const result: CompletenessResult = useMemo(
    () => calculateProfileCompleteness(profileType, formData),
    [profileType, formData]
  );

  const progressColor = result.percentage >= 70
    ? "bg-emerald-500"
    : result.percentage >= 40
    ? "bg-amber-500"
    : "bg-destructive";

  return (
    <div className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.meetsMinimum ? (
            <Trophy className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <h3 className="font-semibold text-sm">
            Completitud del perfil — {result.percentage}%
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {result.earnedPoints}/{result.totalPoints} pts
        </span>
      </div>

      <div className="relative">
        <Progress value={result.percentage} className="h-3" />
        {/* Threshold marker at 60% */}
        <div
          className="absolute top-0 h-3 w-0.5 bg-foreground/60"
          style={{ left: "70%" }}
          title="Mínimo requerido: 70%"
        />
        <div
          className="absolute -top-5 text-[10px] text-muted-foreground font-medium"
          style={{ left: "70%", transform: "translateX(-50%)" }}
        >
          70% mín.
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {result.meetsMinimum
          ? "✅ Tu perfil cumple con el mínimo requerido para enviar la solicitud."
          : "Para enviar tu solicitud necesitás alcanzar al menos el 70% de completitud."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {result.items.map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
              item.completed
                ? "text-muted-foreground"
                : "text-foreground bg-amber-500/5 border border-amber-500/20"
            }`}
          >
            {item.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            )}
            <div>
              <span className="font-medium">
                {item.label}
                <span className="text-muted-foreground font-normal ml-1">({item.points} pts)</span>
              </span>
              {!item.completed && (
                <p className="text-muted-foreground mt-0.5">{item.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";

interface ProfileCompletionBarProps {
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    profile_type?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };
  contentCount: number;
}

interface CompletionStep {
  label: string;
  completed: boolean;
  hint: string;
}

export const ProfileCompletionBar = ({ profile, contentCount }: ProfileCompletionBarProps) => {
  const steps: CompletionStep[] = useMemo(() => [
    {
      label: "Nombre",
      completed: !!profile.first_name?.trim(),
      hint: "Agregá tu nombre en Editar Perfil",
    },
    {
      label: "Apellido",
      completed: !!profile.last_name?.trim(),
      hint: "Agregá tu apellido en Editar Perfil",
    },
    {
      label: "Foto de perfil",
      completed: !!profile.avatar_url,
      hint: "Subí una foto de perfil",
    },
    {
      label: "Biografía",
      completed: !!profile.bio?.trim(),
      hint: "Escribí una breve biografía",
    },
    {
      label: "Perfil principal",
      completed: !!profile.profile_type,
      hint: "Seleccioná tu tipo de perfil",
    },
    {
      label: "Contenido subido",
      completed: contentCount > 0,
      hint: "Subí al menos un contenido (video, audio, foto) para que la comunidad te conozca",
    },
  ], [profile, contentCount]);

  const completedCount = steps.filter(s => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  if (percentage === 100) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-sm">Completá tu perfil — {percentage}%</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{steps.length} pasos
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <p className="text-xs text-muted-foreground">
        Completar tu perfil mejora tu visibilidad en las búsquedas y le da más confianza a la comunidad.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
              step.completed
                ? "text-muted-foreground"
                : "text-foreground bg-amber-500/5 border border-amber-500/20"
            }`}
          >
            {step.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            )}
            <div>
              <span className="font-medium">{step.label}</span>
              {!step.completed && (
                <p className="text-muted-foreground mt-0.5">{step.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Users, Shield, Save, Loader2 } from "lucide-react";

export function GovernanceSettings() {
  const [requiredApprovals, setRequiredApprovals] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from("platform_payment_settings")
        .select("setting_value")
        .eq("setting_key", "ia_required_approvals")
        .single();
      
      if (data) {
        setRequiredApprovals(Number(data.setting_value) || 1);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_payment_settings")
        .upsert({
          setting_key: "ia_required_approvals",
          setting_value: String(requiredApprovals),
          description: "Número mínimo de aprobaciones requeridas para integrar código",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "setting_key"
        });

      if (error) throw error;

      // Update all pending proposals with the new default
      await supabase
        .from("ia_feature_proposals")
        .update({ required_approvals: requiredApprovals })
        .in("lifecycle_stage", ["generating", "validating", "pending_approval"]);

      toast.success("Configuración guardada");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-400" />
          Configuración de Gobernanza
        </CardTitle>
        <CardDescription>
          Configura los parámetros del ciclo de aprobación de código
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aprobaciones Mínimas Requeridas
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="approvals"
                type="number"
                min={1}
                max={10}
                value={requiredApprovals}
                onChange={(e) => setRequiredApprovals(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                administrador{requiredApprovals > 1 ? "es" : ""} debe{requiredApprovals > 1 ? "n" : ""} aprobar cada propuesta
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              El código solo se puede integrar después de recibir este número de aprobaciones de administradores.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Resumen del Flujo de Gobernanza
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>La IA genera código basado en la propuesta</li>
              <li>El código se valida automáticamente (sintaxis, seguridad, lógica)</li>
              <li>Si pasa la validación, entra en fase de aprobación</li>
              <li><span className="text-cyan-400">{requiredApprovals} admin{requiredApprovals > 1 ? "s" : ""}</span> debe{requiredApprovals > 1 ? "n" : ""} aprobar el cambio</li>
              <li>Una vez aprobado, se crea un Pull Request en GitHub</li>
              <li>Después del merge, se marca como desplegado en producción</li>
            </ol>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

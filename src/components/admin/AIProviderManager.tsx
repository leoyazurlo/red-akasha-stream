import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifySuccess, notifyError, notifyLoading, dismissNotification } from "@/lib/notifications";
import {
  Plus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Sparkles,
  Zap,
  Brain,
  Bot,
  Cloud
} from "lucide-react";

interface APIConfig {
  id: string;
  provider: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
  api_key_encrypted?: string | null;
}

interface AIProviderManagerProps {
  configs: APIConfig[];
  userId: string | undefined;
  onConfigsChange: () => void;
}

const AI_PROVIDERS = [
  {
    id: "lovable",
    name: "Lovable AI",
    description: "Integrado - No requiere API key (Gemini, GPT-5)",
    icon: Sparkles,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    models: ["google/gemini-3-flash-preview", "google/gemini-2.5-pro", "openai/gpt-5", "openai/gpt-5-mini"],
    requiresKey: false,
    supportsStreaming: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, o1-preview",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"],
    requiresKey: true,
    keyPlaceholder: "sk-...",
    supportsStreaming: true,
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Claude 3.5 Sonnet, Claude 3 Opus",
    icon: Brain,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
    requiresKey: true,
    keyPlaceholder: "sk-ant-...",
    supportsStreaming: true,
  },
  {
    id: "google",
    name: "Google AI (Gemini)",
    description: "Gemini 1.5 Pro, Gemini 1.5 Flash",
    icon: Cloud,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
    requiresKey: true,
    keyPlaceholder: "AIza...",
    supportsStreaming: false,
  },
  {
    id: "groq",
    name: "Groq",
    description: "LLaMA 3.3, Mixtral - Ultra rápido",
    icon: Zap,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    requiresKey: true,
    keyPlaceholder: "gsk_...",
    supportsStreaming: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Mistral Medium",
    icon: Bot,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
    requiresKey: true,
    keyPlaceholder: "...",
    supportsStreaming: true,
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Modelos locales: Llama, CodeLlama, Mistral",
    icon: Bot,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    models: ["llama3.2", "codellama", "mistral", "deepseek-coder", "phi3"],
    requiresKey: false,
    requiresUrl: true,
    urlPlaceholder: "http://localhost:11434",
    supportsStreaming: false,
  },
];

export function AIProviderManager({ configs, userId, onConfigsChange }: AIProviderManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);
  const [newApiKey, setNewApiKey] = useState("");

  const getProviderInfo = (providerId: string) => {
    return AI_PROVIDERS.find(p => p.id === providerId);
  };

  const addProvider = async () => {
    if (!selectedProvider) {
      toast.error("Selecciona un proveedor");
      return;
    }

    const providerInfo = getProviderInfo(selectedProvider);
    if (providerInfo?.requiresKey && !apiKey.trim()) {
      toast.error("Ingresa la API key");
      return;
    }

    // Check if provider already exists
    if (configs.some(c => c.provider === selectedProvider)) {
      toast.error("Este proveedor ya está configurado");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("ia_api_configs").insert({
        provider: selectedProvider,
        display_name: providerInfo?.name || selectedProvider,
        api_key_encrypted: providerInfo?.requiresKey ? apiKey : null,
        is_active: true,
        is_default: configs.length === 0,
        config: { models: providerInfo?.models || [] },
        created_by: userId,
      });

      if (error) throw error;

      toast.success(`${providerInfo?.name} agregado correctamente`);
      setAddDialogOpen(false);
      setSelectedProvider("");
      setApiKey("");
      onConfigsChange();
    } catch (error) {
      console.error("Error adding provider:", error);
      toast.error("Error al agregar proveedor");
    } finally {
      setSaving(false);
    }
  };

  const updateApiKey = async () => {
    if (!editingConfig || !newApiKey.trim()) {
      toast.error("Ingresa la nueva API key");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ia_api_configs")
        .update({ api_key_encrypted: newApiKey })
        .eq("id", editingConfig.id);

      if (error) throw error;

      toast.success("API key actualizada");
      setEditingConfig(null);
      setNewApiKey("");
      onConfigsChange();
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("Error al actualizar API key");
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from("ia_api_configs")
        .update({ is_active: !isActive })
        .eq("id", id);

      toast.success(isActive ? "Proveedor desactivado" : "Proveedor activado");
      onConfigsChange();
    } catch (error) {
      toast.error("Error al actualizar proveedor");
    }
  };

  const setDefaultProvider = async (id: string) => {
    try {
      // Unset all defaults
      await supabase.from("ia_api_configs").update({ is_default: false }).neq("id", "");
      // Set new default
      await supabase.from("ia_api_configs").update({ is_default: true }).eq("id", id);
      
      toast.success("Proveedor predeterminado actualizado");
      onConfigsChange();
    } catch (error) {
      toast.error("Error al actualizar proveedor predeterminado");
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await supabase.from("ia_api_configs").delete().eq("id", id);
      toast.success("Proveedor eliminado");
      onConfigsChange();
    } catch (error) {
      toast.error("Error al eliminar proveedor");
    }
  };

  const availableProviders = AI_PROVIDERS.filter(
    p => !configs.some(c => c.provider === p.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Proveedores de IA
            </CardTitle>
            <CardDescription>
              Configura los proveedores de IA disponibles para Akasha IA
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar Proveedor de IA</DialogTitle>
                <DialogDescription>
                  Selecciona un proveedor y configura su API key
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            <provider.icon className={`h-4 w-4 ${provider.color}`} />
                            <span>{provider.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProvider && (
                  <div className="p-3 rounded-md bg-muted/50 border border-border/50">
                    {(() => {
                      const provider = getProviderInfo(selectedProvider);
                      if (!provider) return null;
                      const Icon = provider.icon;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${provider.bgColor} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${provider.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{provider.name}</p>
                              <p className="text-xs text-muted-foreground">{provider.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Modelos:</strong> {provider.models.join(", ")}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedProvider && getProviderInfo(selectedProvider)?.requiresKey && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={getProviderInfo(selectedProvider)?.keyPlaceholder}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      La API key se almacena de forma segura y encriptada
                    </p>
                  </div>
                )}

                {selectedProvider === "lovable" && (
                  <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Lovable AI está preconfigurado. No requiere API key.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addProvider} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {configs.map((config) => {
            const providerInfo = getProviderInfo(config.provider);
            const Icon = providerInfo?.icon || Settings;
            
            return (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${providerInfo?.bgColor || "bg-muted"} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${providerInfo?.color || "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{config.display_name}</p>
                      {config.is_default && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          Predeterminado
                        </Badge>
                      )}
                      {!config.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {providerInfo?.description || config.provider}
                    </p>
                    {config.api_key_encrypted && (
                      <p className="text-xs text-muted-foreground mt-1">
                        API Key: ••••••••{config.api_key_encrypted.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${config.id}`} className="text-sm text-muted-foreground">
                      Activo
                    </Label>
                    <Switch
                      id={`active-${config.id}`}
                      checked={config.is_active}
                      onCheckedChange={() => toggleProvider(config.id, config.is_active)}
                    />
                  </div>
                  
                  {!config.is_default && config.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultProvider(config.id)}
                    >
                      Usar como predeterminado
                    </Button>
                  )}

                  {providerInfo?.requiresKey && (
                    <Dialog open={editingConfig?.id === config.id} onOpenChange={(open) => !open && setEditingConfig(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingConfig(config);
                            setNewApiKey("");
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Actualizar API Key</DialogTitle>
                          <DialogDescription>
                            Ingresa la nueva API key para {config.display_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nueva API Key</Label>
                            <div className="relative">
                              <Input
                                type={showApiKey ? "text" : "password"}
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder={providerInfo?.keyPlaceholder}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingConfig(null)}>
                            Cancelar
                          </Button>
                          <Button onClick={updateApiKey} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Actualizar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {config.provider !== "lovable" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará la configuración de {config.display_name}.
                            Tendrás que volver a configurar la API key si deseas usarlo de nuevo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProvider(config.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}

          {configs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay proveedores configurados</p>
              <p className="text-sm">Agrega un proveedor para empezar a usar Akasha IA</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Acerca de los Proveedores
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Lovable AI:</strong> Integrado sin costo adicional. Ideal para empezar.</li>
            <li>• <strong>OpenAI:</strong> GPT-4o para tareas complejas y razonamiento avanzado.</li>
            <li>• <strong>Anthropic:</strong> Claude para análisis detallado y textos largos.</li>
            <li>• <strong>Google:</strong> Gemini Pro para multimodal y contextos extensos.</li>
            <li>• <strong>Groq:</strong> Velocidad extrema con modelos open source.</li>
            <li>• <strong>Mistral:</strong> Modelos europeos con buen rendimiento/costo.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

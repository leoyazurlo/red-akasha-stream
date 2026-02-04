import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GitHubConfig {
  github_enabled: boolean;
  github_repo: string;
  github_token: string;
  github_branch: string;
  auto_create_pr: boolean;
  last_sync: string | null;
}

const defaultConfig: GitHubConfig = {
  github_enabled: false,
  github_repo: '',
  github_token: '',
  github_branch: 'main',
  auto_create_pr: true,
  last_sync: null,
};

export function GitHubSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GitHubConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_payment_settings')
        .select('*')
        .eq('setting_key', 'github_config')
        .single();

      if (data && !error) {
        setConfig({ ...defaultConfig, ...(data.setting_value as object) });
        if ((data.setting_value as any)?.github_token) {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.log('No existing GitHub config found');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('platform_payment_settings')
        .select('id')
        .eq('setting_key', 'github_config')
        .single();

      const configJson = JSON.parse(JSON.stringify(config));

      let error;
      if (existing) {
        const result = await supabase
          .from('platform_payment_settings')
          .update({
            setting_value: configJson,
            description: 'Configuración de integración GitHub',
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'github_config');
        error = result.error;
      } else {
        const result = await supabase
          .from('platform_payment_settings')
          .insert([{
            setting_key: 'github_config',
            setting_value: configJson,
            description: 'Configuración de integración GitHub'
          }]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "La configuración de GitHub se guardó correctamente",
      });
    } catch (error) {
      console.error('Error saving GitHub config:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.github_token || !config.github_repo) {
      toast({
        title: "Configuración incompleta",
        description: "Ingresa el token y repositorio antes de probar",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const [owner, repo] = config.github_repo.split('/');
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${config.github_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repoData = await response.json();
        setConnectionStatus('connected');
        setConfig(prev => ({ ...prev, last_sync: new Date().toISOString() }));
        toast({
          title: "Conexión exitosa",
          description: `Conectado a ${repoData.full_name}`,
        });
      } else {
        setConnectionStatus('error');
        const errorData = await response.json();
        toast({
          title: "Error de conexión",
          description: errorData.message || "No se pudo conectar al repositorio",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar a GitHub",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (key: keyof GitHubConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    if (key === 'github_token' || key === 'github_repo') {
      setConnectionStatus('unknown');
    }
  };

  const maskToken = (token: string) => {
    if (!token) return '';
    if (token.length <= 8) return '••••••••';
    return token.slice(0, 4) + '••••••••' + token.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Integración GitHub
          </CardTitle>
          <CardDescription>
            Conecta con GitHub para crear PRs automáticos desde propuestas de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Habilitar integración</Label>
            <Switch
              checked={config.github_enabled}
              onCheckedChange={(checked) => updateConfig('github_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Repositorio (owner/repo)</Label>
            <Input
              value={config.github_repo}
              onChange={(e) => updateConfig('github_repo', e.target.value)}
              placeholder="miusuario/mi-proyecto"
              disabled={!config.github_enabled}
            />
            <p className="text-xs text-muted-foreground">
              Formato: usuario/repositorio o organización/repositorio
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Personal Access Token
            </Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={config.github_token}
                onChange={(e) => updateConfig('github_token', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                disabled={!config.github_enabled}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Branch base</Label>
            <Input
              value={config.github_branch}
              onChange={(e) => updateConfig('github_branch', e.target.value)}
              placeholder="main"
              disabled={!config.github_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-crear PRs</Label>
              <p className="text-xs text-muted-foreground">
                Crear PR automáticamente al aprobar propuestas
              </p>
            </div>
            <Switch
              checked={config.auto_create_pr}
              onCheckedChange={(checked) => updateConfig('auto_create_pr', checked)}
              disabled={!config.github_enabled}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={testConnection}
              disabled={testing || !config.github_enabled}
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Probar Conexión
            </Button>
            <Button 
              onClick={saveConfig} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Cómo obtener el token
          </CardTitle>
          <CardDescription>
            Sigue estos pasos para crear un Personal Access Token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {connectionStatus === 'connected' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : connectionStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                '?'
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {connectionStatus === 'connected' ? 'Conectado' : 
                 connectionStatus === 'error' ? 'Error de conexión' : 
                 'No verificado'}
              </p>
              {config.last_sync && connectionStatus === 'connected' && (
                <p className="text-xs text-muted-foreground">
                  Última verificación: {new Date(config.last_sync).toLocaleString()}
                </p>
              )}
            </div>
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
              className={connectionStatus === 'connected' ? 'bg-green-500' : ''}
            >
              {connectionStatus === 'connected' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm">Ir a GitHub Settings → Developer settings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm">Personal access tokens → Tokens (classic)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm">Generate new token (classic)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                4
              </div>
              <div>
                <p className="text-sm">Selecciona el scope: <code className="px-1 py-0.5 bg-muted rounded text-xs">repo</code></p>
              </div>
            </div>
          </div>

          <a 
            href="https://github.com/settings/tokens/new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Crear token en GitHub
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Seguridad</p>
                <p className="text-muted-foreground">
                  El token se almacena de forma segura en la base de datos. 
                  Nunca lo compartas públicamente.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

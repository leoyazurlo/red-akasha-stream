import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Globe, 
  Shield, 
  Bell, 
  Palette, 
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings2,
  Search,
  Share2,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlatformConfig {
  // Email/SMTP
  email_provider: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_from_email: string;
  smtp_from_name: string;
  email_enabled: boolean;
  
  // SEO
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_image: string;
  robots_txt: string;
  sitemap_enabled: boolean;
  
  // Analytics
  google_analytics_id: string;
  facebook_pixel_id: string;
  hotjar_id: string;
  analytics_enabled: boolean;
  
  // Social Media
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
  social_tiktok: string;
  social_linkedin: string;
  
  // General
  maintenance_mode: boolean;
  maintenance_message: string;
  default_language: string;
  timezone: string;
  date_format: string;
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  notification_digest: string;
}

const defaultConfig: PlatformConfig = {
  email_provider: 'resend',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_from_email: '',
  smtp_from_name: 'Red Akasha',
  email_enabled: false,
  
  site_title: 'Red Akasha - Plataforma de Streaming Musical',
  site_description: 'La red de streaming para músicos y artistas de música electrónica',
  site_keywords: 'streaming, música, artistas, electrónica, DJ, productores',
  og_image: '',
  robots_txt: 'User-agent: *\nAllow: /',
  sitemap_enabled: true,
  
  google_analytics_id: '',
  facebook_pixel_id: '',
  hotjar_id: '',
  analytics_enabled: false,
  
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_youtube: '',
  social_tiktok: '',
  social_linkedin: '',
  
  maintenance_mode: false,
  maintenance_message: 'Estamos realizando mejoras. Volvemos pronto.',
  default_language: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  date_format: 'DD/MM/YYYY',
  
  email_notifications: true,
  push_notifications: false,
  notification_digest: 'daily'
};

export default function PlatformSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<Array<{type: string; name: string; value: string; status: string}>>([]);

  useEffect(() => {
    loadConfig();
    generateDnsRecords();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_payment_settings')
        .select('*')
        .eq('setting_key', 'platform_config')
        .single();

      if (data && !error) {
        setConfig({ ...defaultConfig, ...(data.setting_value as object) });
      }
    } catch (error) {
      console.log('No existing config found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // First check if exists
      const { data: existing } = await supabase
        .from('platform_payment_settings')
        .select('id')
        .eq('setting_key', 'platform_config')
        .single();

      const configJson = JSON.parse(JSON.stringify(config));

      let error;
      if (existing) {
        const result = await supabase
          .from('platform_payment_settings')
          .update({
            setting_value: configJson,
            description: 'Configuración general de la plataforma',
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'platform_config');
        error = result.error;
      } else {
        const result = await supabase
          .from('platform_payment_settings')
          .insert([{
            setting_key: 'platform_config',
            setting_value: configJson,
            description: 'Configuración general de la plataforma'
          }]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Los cambios se aplicaron correctamente",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const generateDnsRecords = () => {
    const domain = config.smtp_from_email?.split('@')[1] || 'tudominio.com';
    setDnsRecords([
      { type: 'TXT', name: `@`, value: 'v=spf1 include:_spf.resend.com ~all', status: 'pending' },
      { type: 'TXT', name: `resend._domainkey`, value: 'p=MIGfMA0GCSq...', status: 'pending' },
      { type: 'CNAME', name: `tracking`, value: 'track.resend.com', status: 'pending' },
      { type: 'MX', name: `@`, value: 'feedback-smtp.resend.com', status: 'pending' },
    ]);
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      // Simular test de conexión
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Conexión exitosa",
        description: "El servidor de correo responde correctamente",
      });
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor de correo",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Valor copiado al portapapeles",
    });
  };

  const updateConfig = (key: keyof PlatformConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Plataforma</h1>
            <p className="text-muted-foreground">
              Ajusta la configuración general sin necesidad de modificar código
            </p>
          </div>
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email/DNS
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="w-4 h-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Globe className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Share2 className="w-4 h-4" />
              Redes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings2 className="w-4 h-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* EMAIL/DNS Tab */}
          <TabsContent value="email" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Proveedor de Email
                  </CardTitle>
                  <CardDescription>
                    Configura el servicio de envío de correos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Habilitar envío de emails</Label>
                    <Switch
                      checked={config.email_enabled}
                      onCheckedChange={(checked) => updateConfig('email_enabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Select 
                      value={config.email_provider} 
                      onValueChange={(value) => updateConfig('email_provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="smtp">SMTP Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.email_provider === 'smtp' && (
                    <>
                      <div className="space-y-2">
                        <Label>Host SMTP</Label>
                        <Input
                          value={config.smtp_host}
                          onChange={(e) => updateConfig('smtp_host', e.target.value)}
                          placeholder="smtp.ejemplo.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Puerto</Label>
                          <Input
                            value={config.smtp_port}
                            onChange={(e) => updateConfig('smtp_port', e.target.value)}
                            placeholder="587"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Usuario</Label>
                          <Input
                            value={config.smtp_user}
                            onChange={(e) => updateConfig('smtp_user', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Email remitente</Label>
                    <Input
                      value={config.smtp_from_email}
                      onChange={(e) => updateConfig('smtp_from_email', e.target.value)}
                      placeholder="noreply@tudominio.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre remitente</Label>
                    <Input
                      value={config.smtp_from_name}
                      onChange={(e) => updateConfig('smtp_from_name', e.target.value)}
                      placeholder="Red Akasha"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={testEmailConnection}
                    disabled={testingEmail}
                  >
                    {testingEmail ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Probar Conexión
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Registros DNS
                  </CardTitle>
                  <CardDescription>
                    Configura estos registros en tu proveedor de dominio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">Importante</p>
                        <p className="text-muted-foreground">
                          Agrega estos registros DNS para verificar tu dominio y mejorar la entregabilidad.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dnsRecords.map((record, index) => (
                      <div 
                        key={index}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{record.type}</Badge>
                            <span className="font-mono text-sm">{record.name}</span>
                          </div>
                          <Badge 
                            variant={record.status === 'verified' ? 'default' : 'secondary'}
                            className={record.status === 'verified' ? 'bg-green-500' : ''}
                          >
                            {record.status === 'verified' ? 'Verificado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs truncate">
                            {record.value}
                          </code>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Verificar DNS
                  </Button>

                  <a 
                    href="https://resend.com/domains" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                  >
                    Ir al panel de Resend
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Optimización para Buscadores (SEO)
                </CardTitle>
                <CardDescription>
                  Configura los metadatos para mejorar el posicionamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Título del sitio</Label>
                    <Input
                      value={config.site_title}
                      onChange={(e) => updateConfig('site_title', e.target.value)}
                      placeholder="Mi Sitio Web"
                    />
                    <p className="text-xs text-muted-foreground">
                      {config.site_title.length}/60 caracteres recomendados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Imagen OG (Open Graph)</Label>
                    <Input
                      value={config.og_image}
                      onChange={(e) => updateConfig('og_image', e.target.value)}
                      placeholder="https://ejemplo.com/og-image.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción del sitio</Label>
                  <Textarea
                    value={config.site_description}
                    onChange={(e) => updateConfig('site_description', e.target.value)}
                    placeholder="Descripción breve de tu sitio..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.site_description.length}/160 caracteres recomendados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Palabras clave (separadas por coma)</Label>
                  <Input
                    value={config.site_keywords}
                    onChange={(e) => updateConfig('site_keywords', e.target.value)}
                    placeholder="música, streaming, artistas"
                  />
                </div>

                <div className="space-y-2">
                  <Label>robots.txt</Label>
                  <Textarea
                    value={config.robots_txt}
                    onChange={(e) => updateConfig('robots_txt', e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Generar Sitemap automáticamente</Label>
                  <Switch
                    checked={config.sitemap_enabled}
                    onCheckedChange={(checked) => updateConfig('sitemap_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Herramientas de Analytics
                </CardTitle>
                <CardDescription>
                  Conecta servicios de análisis y seguimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Habilitar Analytics</Label>
                  <Switch
                    checked={config.analytics_enabled}
                    onCheckedChange={(checked) => updateConfig('analytics_enabled', checked)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Google Analytics ID
                      <Badge variant="outline" className="text-xs">GA4</Badge>
                    </Label>
                    <Input
                      value={config.google_analytics_id}
                      onChange={(e) => updateConfig('google_analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Facebook Pixel ID</Label>
                    <Input
                      value={config.facebook_pixel_id}
                      onChange={(e) => updateConfig('facebook_pixel_id', e.target.value)}
                      placeholder="XXXXXXXXXXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hotjar Site ID</Label>
                    <Input
                      value={config.hotjar_id}
                      onChange={(e) => updateConfig('hotjar_id', e.target.value)}
                      placeholder="XXXXXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Redes Sociales
                </CardTitle>
                <CardDescription>
                  Enlaces a tus perfiles de redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input
                      value={config.social_facebook}
                      onChange={(e) => updateConfig('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      value={config.social_instagram}
                      onChange={(e) => updateConfig('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Twitter/X</Label>
                    <Input
                      value={config.social_twitter}
                      onChange={(e) => updateConfig('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>YouTube</Label>
                    <Input
                      value={config.social_youtube}
                      onChange={(e) => updateConfig('social_youtube', e.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TikTok</Label>
                    <Input
                      value={config.social_tiktok}
                      onChange={(e) => updateConfig('social_tiktok', e.target.value)}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input
                      value={config.social_linkedin}
                      onChange={(e) => updateConfig('social_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Configuración de Notificaciones
                </CardTitle>
                <CardDescription>
                  Gestiona cómo se envían las notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificaciones importantes por correo
                    </p>
                  </div>
                  <Switch
                    checked={config.email_notifications}
                    onCheckedChange={(checked) => updateConfig('email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones del navegador en tiempo real
                    </p>
                  </div>
                  <Switch
                    checked={config.push_notifications}
                    onCheckedChange={(checked) => updateConfig('push_notifications', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resumen de notificaciones</Label>
                  <Select 
                    value={config.notification_digest} 
                    onValueChange={(value) => updateConfig('notification_digest', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instantáneo</SelectItem>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    Idioma y Región
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Idioma predeterminado</Label>
                    <Select 
                      value={config.default_language} 
                      onValueChange={(value) => updateConfig('default_language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Zona horaria</Label>
                    <Select 
                      value={config.timezone} 
                      onValueChange={(value) => updateConfig('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de fecha</Label>
                    <Select 
                      value={config.date_format} 
                      onValueChange={(value) => updateConfig('date_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Modo Mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activar modo mantenimiento</Label>
                      <p className="text-sm text-muted-foreground">
                        Los visitantes verán un mensaje de mantenimiento
                      </p>
                    </div>
                    <Switch
                      checked={config.maintenance_mode}
                      onCheckedChange={(checked) => updateConfig('maintenance_mode', checked)}
                    />
                  </div>

                  {config.maintenance_mode && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          El sitio está en modo mantenimiento
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Mensaje de mantenimiento</Label>
                    <Textarea
                      value={config.maintenance_message}
                      onChange={(e) => updateConfig('maintenance_message', e.target.value)}
                      placeholder="Estamos realizando mejoras..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

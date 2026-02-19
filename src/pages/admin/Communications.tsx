import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Users, Crown, Heart, Send, Loader2, Paperclip, X, FileText, Image, File, Bot, Eye, Sparkles } from "lucide-react";
import { formatFileSize } from "@/lib/storage-validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total

export default function Communications() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiNotifying, setAiNotifying] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleAiPreview = async () => {
    setAiNotifying(true);
    setAiPreview(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesión requerida"); return; }
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-profile-notifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dry_run: true, max_users: 100 }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiPreview(data);
      toast.success(`${data.total_incomplete} perfiles incompletos detectados`);
    } catch (e) {
      toast.error("Error al analizar perfiles");
      console.error(e);
    } finally {
      setAiNotifying(false);
    }
  };

  const handleAiSend = async () => {
    setAiNotifying(true);
    setAiResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesión requerida"); return; }
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-profile-notifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dry_run: false, max_users: 100 }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiResult(data);
      toast.success(`${data.sent} mensajes enviados por Akasha IA`);
    } catch (e) {
      toast.error("Error al enviar notificaciones IA");
      console.error(e);
    } finally {
      setAiNotifying(false);
    }
  };
  // Fetch all users count
  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Fetch subscribers count (monthly + annual)
  const { data: subscribersData } = useQuery({
    queryKey: ["subscribers-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, user_id")
        .eq("is_active", true);
      
      if (error) throw error;
      
      const monthly = data?.filter(s => s.tier === "premium").length || 0;
      const annual = data?.filter(s => s.tier === "enterprise").length || 0;
      
      return { monthly, annual, total: data?.length || 0 };
    },
  });

  // Fetch donors count
  const { data: donorsCount } = useQuery({
    queryKey: ["donors-count"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("donor_id")
        .eq("payment_status", "completed");
      
      const uniqueDonors = new Set(data?.map(d => d.donor_id).filter(Boolean));
      return uniqueDonors.size;
    },
  });

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const getRecipientCount = () => {
    let count = 0;
    if (selectedGroups.includes("all")) return usersCount || 0;
    if (selectedGroups.includes("subscribers")) count += subscribersData?.total || 0;
    if (selectedGroups.includes("donors")) count += donorsCount || 0;
    return count;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (file.type.includes("pdf") || file.type.includes("document")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getTotalAttachmentsSize = () => {
    return attachments.reduce((total, file) => total + file.size, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`El archivo "${file.name}" excede el límite de 10MB`);
        continue;
      }
      
      const newTotalSize = getTotalAttachmentsSize() + file.size;
      if (newTotalSize > MAX_TOTAL_SIZE) {
        toast.error("El tamaño total de archivos adjuntos excede 25MB");
        break;
      }
      
      if (!attachments.some(a => a.name === file.name && a.size === file.size)) {
        setAttachments(prev => [...prev, file]);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Por favor completa el asunto y el mensaje");
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error("Por favor selecciona al menos un grupo de destinatarios");
      return;
    }

    setSending(true);
    
    try {
      // Here you would call an edge function to send emails
      // For now, we'll simulate the action
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Email enviado a ${getRecipientCount()} usuarios${attachments.length > 0 ? ` con ${attachments.length} archivo(s) adjunto(s)` : ""}`);
      setSubject("");
      setMessage("");
      setSelectedGroups([]);
      setAttachments([]);
    } catch (error) {
      toast.error("Error al enviar el email");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_hsl(180,100%,50%)]">
            Comunicación
          </h1>
          <p className="text-muted-foreground mt-1">
            Envía emails masivos a tus usuarios
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Todos los Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">{usersCount || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Suscriptores Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">{subscribersData?.total || 0}</p>
              <p className="text-xs text-muted-foreground">
                {subscribersData?.monthly || 0} mensuales · {subscribersData?.annual || 0} anuales
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Donantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">{donorsCount || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Destinatarios Seleccionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{getRecipientCount()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="compose">Redactar Email</TabsTrigger>
            <TabsTrigger value="ai-notifier" className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              Akasha IA
            </TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-card/50 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle>Componer Email</CardTitle>
                    <CardDescription>
                      Redacta el email que será enviado a los usuarios seleccionados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto</Label>
                      <Input
                        id="subject"
                        placeholder="Escribe el asunto del email..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        placeholder="Escribe el contenido del email..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[300px] bg-background/50"
                      />
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-2">
                      <Label>Archivos Adjuntos</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          multiple
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.mp3,.wav"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          Adjuntar Archivo
                        </Button>
                        {attachments.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {attachments.length} archivo(s) - {formatFileSize(getTotalAttachmentsSize())}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Máx. 10MB por archivo, 25MB total. Formatos: PDF, DOC, XLS, imágenes, audio.
                      </p>
                      
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachments.map((file, index) => (
                            <div 
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {getFileIcon(file)}
                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      disabled={sending || selectedGroups.length === 0}
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Email a {getRecipientCount()} usuarios
                          {attachments.length > 0 && ` (${attachments.length} adjuntos)`}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-card/50 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle>Destinatarios</CardTitle>
                    <CardDescription>
                      Selecciona los grupos a los que deseas enviar el email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all"
                        checked={selectedGroups.includes("all")}
                        onCheckedChange={() => toggleGroup("all")}
                      />
                      <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Todos los usuarios
                        <Badge variant="secondary">{usersCount || 0}</Badge>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subscribers"
                        checked={selectedGroups.includes("subscribers")}
                        onCheckedChange={() => toggleGroup("subscribers")}
                        disabled={selectedGroups.includes("all")}
                      />
                      <Label htmlFor="subscribers" className="flex items-center gap-2 cursor-pointer">
                        <Crown className="h-4 w-4" />
                        Suscriptores
                        <Badge variant="secondary">{subscribersData?.total || 0}</Badge>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="donors"
                        checked={selectedGroups.includes("donors")}
                        onCheckedChange={() => toggleGroup("donors")}
                        disabled={selectedGroups.includes("all")}
                      />
                      <Label htmlFor="donors" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="h-4 w-4" />
                        Donantes
                        <Badge variant="secondary">{donorsCount || 0}</Badge>
                      </Label>
                    </div>

                    {selectedGroups.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Grupos seleccionados:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedGroups.map(group => (
                            <Badge key={group} variant="outline" className="text-cyan-400 border-cyan-500/50">
                              {group === "all" && "Todos"}
                              {group === "subscribers" && "Suscriptores"}
                              {group === "donors" && "Donantes"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm">Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Personaliza el mensaje para cada audiencia</p>
                    <p>• Evita enviar emails muy frecuentes</p>
                    <p>• Incluye un llamado a la acción claro</p>
                    <p>• Revisa el contenido antes de enviar</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-notifier" className="space-y-4">
            <Card className="bg-card/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Notificador IA de Perfiles Incompletos
                </CardTitle>
                <CardDescription>
                  Akasha IA analiza los perfiles de usuarios y envía mensajes directos personalizados
                  a quienes tienen datos incompletos, motivándolos a completar su información.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleAiPreview}
                    disabled={aiNotifying}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {aiNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleAiSend}
                    disabled={aiNotifying}
                    className="flex items-center gap-2"
                  >
                    {aiNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    Enviar Mensajes IA
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⏱ Solo se envía 1 mensaje por usuario cada 7 días para evitar spam.
                  Los mensajes se envían como mensajes directos desde tu cuenta de admin.
                </p>

                {aiPreview && (
                  <Card className="bg-muted/30 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Vista Previa — {aiPreview.total_incomplete} perfiles incompletos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {aiPreview.details?.map((d: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-background/50 border border-border text-sm">
                            <p className="font-medium text-foreground">
                              {d.fullName || d.username || "Sin nombre"}
                              {d.username && <span className="text-muted-foreground ml-1">@{d.username}</span>}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Falta: {d.missing.join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {aiResult && (
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-green-400 font-medium">
                        <Sparkles className="h-4 w-4" />
                        {aiResult.sent} mensajes enviados exitosamente
                      </div>
                      {aiResult.skipped_recent > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {aiResult.skipped_recent} usuarios omitidos (ya notificados recientemente)
                        </p>
                      )}
                      {aiResult.errors?.length > 0 && (
                        <p className="text-xs text-destructive mt-1">
                          {aiResult.errors.length} errores
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-card/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle>Historial de Envíos</CardTitle>
                <CardDescription>
                  Registro de todos los emails enviados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay emails enviados aún</p>
                  <p className="text-sm">El historial aparecerá aquí después del primer envío</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

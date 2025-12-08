import { useState } from "react";
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
import { Mail, Users, Crown, Heart, Send, Loader2 } from "lucide-react";

export default function Communications() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

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
      
      toast.success(`Email enviado a ${getRecipientCount()} usuarios`);
      setSubject("");
      setMessage("");
      setSelectedGroups([]);
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

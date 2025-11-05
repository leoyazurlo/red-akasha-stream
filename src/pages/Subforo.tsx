import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { ThreadForm } from "@/components/forum/ThreadForm";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MessageSquare,
  Eye,
  Clock,
  Plus,
  ArrowLeft,
  Pin,
  Lock,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Subforo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(false);
  const [showThreadForm, setShowThreadForm] = useState(false);

  // Fetch subforo details
  const { data: subforo, isLoading: subforoLoading } = useQuery({
    queryKey: ["subforo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_subforos")
        .select(
          `
          *,
          category:forum_categories(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch threads for this subforo
  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ["subforo-threads", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select(
          `
          *,
          author:profiles!forum_threads_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          posts:forum_posts(count)
        `
        )
        .eq("subforo_id", id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getThreadTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      debate_abierto: "Debate Abierto",
      debate_moderado: "Debate Moderado",
      pregunta_encuesta: "Pregunta/Encuesta",
      hilo_recursos: "Recursos",
      anuncio: "Anuncio",
    };
    return types[type || "debate_abierto"] || "Debate";
  };

  const getThreadTypeBadgeVariant = (type: string | null) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      anuncio: "default",
      pregunta_encuesta: "secondary",
      hilo_recursos: "outline",
    };
    return variants[type || ""] || "outline";
  };

  if (authLoading || subforoLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subforo) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Subforo no encontrado</h1>
            <Button onClick={() => navigate("/foro")}>Volver al foro</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button
              onClick={() => navigate("/foro")}
              className="hover:text-primary transition-colors"
            >
              Foro
            </button>
            <span>/</span>
            <button
              onClick={() => navigate("/foro")}
              className="hover:text-primary transition-colors"
            >
              {subforo.category?.nombre}
            </button>
            <span>/</span>
            <span className="text-foreground">{subforo.nombre}</span>
          </div>

          {/* Subforo Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-poppins font-medium tracking-wide text-foreground mb-2">
                  {subforo.nombre}
                </h1>
                {subforo.descripcion && (
                  <p className="text-muted-foreground text-lg">{subforo.descripcion}</p>
                )}
              </div>
              <Button
                onClick={() => navigate("/foro")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </div>

            {/* Create Thread Button */}
            {user ? (
              <Button
                onClick={() => setShowThreadForm(!showThreadForm)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showThreadForm ? "Cancelar" : "Nuevo Hilo"}
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline">
                Inicia sesión para crear un hilo
              </Button>
            )}
          </div>

          {/* Thread Creation Form */}
          {showThreadForm && user && (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border border-border">
              <CardHeader>
                <h2 className="text-xl font-semibold">Crear Nuevo Hilo</h2>
              </CardHeader>
              <CardContent>
                <ThreadForm
                  subforoId={id!}
                  onSuccess={() => setShowThreadForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <Separator className="mb-8" />

          {/* Threads List */}
          <div className="space-y-4">
            {threadsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : threads && threads.length > 0 ? (
              threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/foro/hilo/${thread.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Thread Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          {thread.is_pinned && (
                            <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          )}
                          {thread.is_closed && (
                            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                              {thread.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <Badge variant={getThreadTypeBadgeVariant(thread.thread_type)}>
                                {getThreadTypeLabel(thread.thread_type)}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>
                                  {thread.author?.username || thread.author?.full_name || "Usuario"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(thread.created_at!), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Thread Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{thread.posts?.[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{thread.views_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border border-border">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">
                    No hay hilos en este subforo aún
                  </p>
                  {user ? (
                    <Button
                      onClick={() => setShowThreadForm(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Crear el Primer Hilo
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/auth")} variant="outline">
                      Inicia sesión para crear el primer hilo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Subforo;

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { PostForm } from "@/components/forum/PostForm";
import { UserBadges } from "@/components/forum/UserBadges";
import { UserStatsCard } from "@/components/forum/UserStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Pin,
  Lock,
  User,
  Clock,
  MessageSquare,
  ThumbsUp,
  Reply,
  CheckCircle,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  thread_id: string;
  parent_post_id: string | null;
  is_best_answer: boolean;
  author: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  votes?: { vote_value: number }[];
}

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  subforo_id: string;
  thread_type: string | null;
  is_pinned: boolean;
  is_closed: boolean;
  views_count: number;
  author: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  subforo: {
    id: string;
    nombre: string;
    category_id: string;
  };
}

const ThreadPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [postsToShow, setPostsToShow] = useState(20);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  // Fetch thread details
  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ["thread", id],
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
          subforo:forum_subforos(
            id,
            nombre,
            category_id
          )
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Thread | null;
    },
    enabled: !!id,
  });

  // Fetch total count of posts
  const { data: postsCount } = useQuery({
    queryKey: ["thread-posts-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("thread_id", id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  // Fetch posts for this thread with pagination
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["thread-posts", id, postsToShow],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select(
          `
          *,
          author:profiles!forum_posts_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          votes:forum_votes(vote_value)
        `
        )
        .eq("thread_id", id)
        .order("created_at", { ascending: true })
        .limit(postsToShow);

      if (error) throw error;

      // Update total count
      if (postsCount) {
        setTotalPostsCount(postsCount);
      }

      return data as Post[];
    },
    enabled: !!id,
  });

  const hasMorePosts = posts && postsCount ? posts.length < postsCount : false;
  const loadMorePosts = () => {
    setPostsToShow((prev) => prev + 20);
  };

  // Increment view count
  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      if (!id || !thread) return;

      const { error } = await supabase
        .from("forum_threads")
        .update({ views_count: (thread.views_count || 0) + 1 })
        .eq("id", id);

      if (error) throw error;
    },
  });

  // Vote on post
  const voteMutation = useMutation({
    mutationFn: async ({
      postId,
      value,
    }: {
      postId: string;
      value: number;
    }) => {
      if (!user) throw new Error("Debes iniciar sesión para votar");

      const { error } = await supabase.from("forum_votes").upsert(
        {
          user_id: user.id,
          post_id: postId,
          vote_value: value,
        },
        { onConflict: "user_id,post_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread-posts", id] });
    },
    onError: (error) => {
      toast({
        title: "Error al votar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as best answer
  const markBestAnswerMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || user.id !== thread?.author_id) {
        throw new Error("Solo el autor puede marcar la mejor respuesta");
      }

      // Unmark all other best answers
      await supabase
        .from("forum_posts")
        .update({ is_best_answer: false })
        .eq("thread_id", id);

      // Mark this one as best answer
      const { error } = await supabase
        .from("forum_posts")
        .update({ is_best_answer: true })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mejor respuesta marcada" });
      queryClient.invalidateQueries({ queryKey: ["thread-posts", id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Increment views on mount
  useState(() => {
    if (id && thread) {
      incrementViewsMutation.mutate();
    }
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

  const getPostVoteCount = (post: Post) => {
    if (!post.votes) return 0;
    return post.votes.reduce((sum, vote) => sum + vote.vote_value, 0);
  };

  // Organize posts into tree structure
  const organizePostsTree = (posts: Post[] | undefined) => {
    if (!posts) return [];
    const topLevelPosts = posts.filter((p) => !p.parent_post_id);
    return topLevelPosts;
  };

  const getReplies = (postId: string, posts: Post[] | undefined) => {
    if (!posts) return [];
    return posts.filter((p) => p.parent_post_id === postId);
  };

  const renderPost = (post: Post, depth: number = 0) => {
    const replies = getReplies(post.id, posts);
    const voteCount = getPostVoteCount(post);
    const isAuthor = user?.id === thread?.author_id;

    return (
      <div key={post.id} className={depth > 0 ? "ml-8 mt-4" : "mt-4"}>
        <Card className="bg-card/50 backdrop-blur-sm border border-border">
          <CardContent className="p-6">
            {/* Best Answer Badge */}
            {post.is_best_answer && (
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Mejor Respuesta
              </Badge>
            )}

            {/* Post Header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar>
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author.username?.[0] || post.author.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/perfil/${post.author_id}`);
                        }}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {post.author.username || post.author.full_name || "Usuario"}
                      </button>
                      <UserBadges userId={post.author_id} limit={3} showCount />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>

                  {isAuthor && !post.is_best_answer && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => markBestAnswerMutation.mutate(post.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como mejor respuesta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="prose prose-invert max-w-none mb-4">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => voteMutation.mutate({ postId: post.id, value: 1 })}
                  disabled={!user}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {voteCount}
                </Button>
              </div>

              {user && !thread?.is_closed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setReplyingToPostId(
                      replyingToPostId === post.id ? null : post.id
                    )
                  }
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Responder
                </Button>
              )}

              {replies.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}
                </span>
              )}
            </div>

            {/* Reply Form */}
            {replyingToPostId === post.id && user && (
              <div className="mt-4 pl-4 border-l-2 border-primary">
                <PostForm
                  threadId={id!}
                  parentPostId={post.id}
                  onSuccess={() => setReplyingToPostId(null)}
                  placeholder="Escribe tu respuesta..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nested Replies */}
        {replies.map((reply) => renderPost(reply, depth + 1))}
      </div>
    );
  };

  if (authLoading || threadLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <CosmicBackground />
        <Header />
        <main className="relative z-10 pt-24">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Hilo no encontrado</h1>
            <Button onClick={() => navigate("/foro")}>Volver al foro</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const topLevelPosts = organizePostsTree(posts);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <CosmicBackground />
      <Header />

      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
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
              onClick={() => navigate(`/foro/subforo/${thread.subforo_id}`)}
              className="hover:text-primary transition-colors"
            >
              {thread.subforo.nombre}
            </button>
            <span>/</span>
            <span className="text-foreground truncate">{thread.title}</span>
          </div>

          {/* Thread Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border border-border">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  {thread.is_pinned && (
                    <Pin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  )}
                  {thread.is_closed && (
                    <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-poppins font-medium tracking-wide text-foreground mb-4">
                      {thread.title}
                    </h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
                    <Badge variant="outline">
                      {getThreadTypeLabel(thread.thread_type)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/perfil/${thread.author_id}`);
                        }}
                        className="hover:text-primary transition-colors"
                      >
                        {thread.author.username ||
                          thread.author.full_name ||
                          "Usuario"}
                      </button>
                      <UserBadges userId={thread.author_id} limit={3} showCount />
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(thread.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{posts?.length || 0} respuestas</span>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-foreground whitespace-pre-wrap text-lg">
                      {thread.content}
                    </p>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Author Stats Sidebar */}
            <div className="hidden lg:block">
              <UserStatsCard 
                userId={thread.author_id} 
                userName={thread.author.username || thread.author.full_name || undefined}
              />
            </div>
          </div>

          {/* New Reply Form (Top Level) */}
          {user && !thread.is_closed ? (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Responder al hilo</h3>
                <PostForm threadId={id!} />
              </CardContent>
            </Card>
          ) : !user ? (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border border-border">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Inicia sesión para participar en la discusión
                </p>
                <Button onClick={() => navigate("/auth")}>Iniciar Sesión</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 bg-card/50 backdrop-blur-sm border border-border">
              <CardContent className="p-6 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Este hilo está cerrado y no acepta nuevas respuestas
                </p>
              </CardContent>
            </Card>
          )}

          <Separator className="mb-8" />

          {/* Posts List */}
          <div className="space-y-6">
            {/* Posts Count Header */}
            {postsCount !== undefined && postsCount > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-card/30 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Mostrando {posts?.length || 0} de {postsCount} respuestas
                </p>
                {hasMorePosts && (
                  <p className="text-xs text-muted-foreground">
                    {postsCount - (posts?.length || 0)} más sin cargar
                  </p>
                )}
              </div>
            )}

            {postsLoading && postsToShow === 20 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : topLevelPosts.length > 0 ? (
              <>
                {topLevelPosts.map((post) => renderPost(post))}

                {/* Load More Button */}
                {hasMorePosts && (
                  <Card className="bg-card/50 backdrop-blur-sm border border-border">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Hay {postsCount! - posts!.length} respuestas más
                      </p>
                      <Button
                        onClick={loadMorePosts}
                        disabled={postsLoading}
                        variant="outline"
                        className="flex items-center gap-2 mx-auto"
                      >
                        {postsLoading && postsToShow > 20 ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            Cargar Más Respuestas
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border border-border">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">
                    Sé el primero en responder a este hilo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-12 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(`/foro/subforo/${thread.subforo_id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Subforo
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThreadPage;

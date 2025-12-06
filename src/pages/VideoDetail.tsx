import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Eye, 
  Calendar, 
  User, 
  Music2,
  ArrowLeft,
  Loader2,
  Send,
  ThumbsUp,
  ChevronDown,
  Share2,
  PictureInPicture,
  MapPin
} from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷',
  'Bolivia': '🇧🇴',
  'Brasil': '🇧🇷',
  'Brazil': '🇧🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Costa Rica': '🇨🇷',
  'Cuba': '🇨🇺',
  'Ecuador': '🇪🇨',
  'El Salvador': '🇸🇻',
  'España': '🇪🇸',
  'Spain': '🇪🇸',
  'Estados Unidos': '🇺🇸',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳',
  'México': '🇲🇽',
  'Mexico': '🇲🇽',
  'Nicaragua': '🇳🇮',
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Paraguay': '🇵🇾',
  'Perú': '🇵🇪',
  'Peru': '🇵🇪',
  'Puerto Rico': '🇵🇷',
  'República Dominicana': '🇩🇴',
  'Dominican Republic': '🇩🇴',
  'Uruguay': '🇺🇾',
  'Venezuela': '🇻🇪',
  'Alemania': '🇩🇪',
  'Germany': '🇩🇪',
  'Francia': '🇫🇷',
  'France': '🇫🇷',
  'Italia': '🇮🇹',
  'Italy': '🇮🇹',
  'Portugal': '🇵🇹',
  'Reino Unido': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Canadá': '🇨🇦',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'Japón': '🇯🇵',
  'Japan': '🇯🇵',
  'Corea del Sur': '🇰🇷',
  'South Korea': '🇰🇷',
  'Rusia': '🇷🇺',
  'Russia': '🇷🇺',
};

const getCountryFlag = (country: string | null | undefined): string => {
  if (!country) return '🌎';
  return COUNTRY_FLAGS[country] || '🌎';
};

interface VideoDetail {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  thumbnail_url: string | null;
  video_url: string | null;
  band_name: string | null;
  producer_name: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  uploader_id: string;
  is_free: boolean;
  price: number;
  country?: string | null;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface RelatedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views_count: number;
  duration: number | null;
  created_at: string;
}

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openMiniPlayer } = useMiniPlayer();
  
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const handleOpenMiniPlayer = () => {
    if (!video) return;
    
    openMiniPlayer({
      id: video.id,
      title: video.title,
      video_url: video.video_url,
      audio_url: null,
      thumbnail_url: video.thumbnail_url,
      content_type: video.content_type,
      band_name: video.band_name,
    });

    toast({
      title: "Minireproductor activado",
      description: "Puedes navegar libremente mientras ves el video",
    });
  };

  useEffect(() => {
    if (id) {
      fetchVideoDetails();
      fetchComments();
      checkIfLiked();
    }
  }, [id, user]);

  // Update meta tags for social sharing
  useEffect(() => {
    if (video) {
      const url = `${window.location.origin}/video/${video.id}`;
      
      // Update Open Graph tags
      updateMetaTag('og:title', video.title);
      updateMetaTag('og:description', video.description || 'Mira este video en Red Akasha');
      updateMetaTag('og:image', video.thumbnail_url || '');
      updateMetaTag('og:url', url);
      updateMetaTag('og:type', 'video.other');
      
      // Update Twitter tags
      updateMetaTag('twitter:title', video.title);
      updateMetaTag('twitter:description', video.description || 'Mira este video en Red Akasha');
      updateMetaTag('twitter:image', video.thumbnail_url || '');
      
      // Update page title
      document.title = `${video.title} - Red Akasha`;
    }
  }, [video]);

  const updateMetaTag = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
    }
    if (!element) {
      element = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        element.setAttribute('property', property);
      } else {
        element.setAttribute('name', property);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  useEffect(() => {
    if (video) {
      fetchRelatedVideos();
    }
  }, [video]);

  const fetchVideoDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch country from uploader's profile
        const { data: profileData } = await supabase
          .from('profile_details')
          .select('pais')
          .eq('user_id', data.uploader_id)
          .single();

        setVideo({
          ...data,
          country: profileData?.pais || null
        });
        
        // Incrementar vistas
        await supabase
          .from('content_uploads')
          .update({ views_count: data.views_count + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('content_comments')
        .select('*')
        .eq('content_id', id)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener perfiles de usuarios por separado
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.id === comment.user_id) || null
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchRelatedVideos = async () => {
    if (!video) return;

    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('id, title, thumbnail_url, views_count, duration, created_at')
        .eq('status', 'approved')
        .eq('band_name', video.band_name)
        .neq('id', video.id)
        .limit(6);

      if (error) throw error;
      setRelatedVideos(data || []);
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', id)
        .eq('user_id', user.id)
        .single();

      setHasLiked(!!data);
    } catch (error) {
      // No hay like
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      if (hasLiked) {
        // Quitar like
        await supabase
          .from('content_likes')
          .delete()
          .eq('content_id', id)
          .eq('user_id', user.id);
        
        setHasLiked(false);
        if (video) {
          setVideo({ ...video, likes_count: video.likes_count - 1 });
        }
      } else {
        // Dar like
        await supabase
          .from('content_likes')
          .insert({ content_id: id, user_id: user.id });
        
        setHasLiked(true);
        if (video) {
          setVideo({ ...video, likes_count: video.likes_count + 1 });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu reacción",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('content_comments')
        .insert({
          content_id: id,
          user_id: user.id,
          comment: commentText.trim(),
        });

      if (error) throw error;

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido agregado",
      });

      setCommentText("");
      fetchComments();
      
      // Actualizar contador de comentarios
      if (video) {
        setVideo({ ...video, comments_count: video.comments_count + 1 });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar tu comentario",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen relative">
        <CosmicBackground />
        <div className="relative z-10">
          <Header />
          <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Video no encontrado</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/on-demand")} className="w-full">
                  Volver a On Demand
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-2 border-cyan-400/40 shadow-[0_0_30px_hsl(180_100%_50%/0.35)]">
                <AspectRatio ratio={16 / 9} className="bg-black">
                  {isPlaying && video.video_url ? (
                    <video
                      src={video.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  ) : (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => setIsPlaying(true)}
                    >
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                          <Play className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                        <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-10 h-10 text-primary-foreground fill-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </AspectRatio>
              </Card>

              {/* Video Info */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{video.title}</CardTitle>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        {video.band_name && (
                          <div className="flex items-center gap-2">
                            <Music2 className="w-4 h-4" />
                            <span className="font-medium">{video.band_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1" title={video.country || 'País desconocido'}>
                          <span className="text-xl">{getCountryFlag(video.country)}</span>
                          {video.country && <span className="text-sm">{video.country}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {video.content_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">{video.views_count} vistas</span>
                    </div>
                    <Button
                      variant={hasLiked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      {video.likes_count}
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{video.comments_count} comentarios</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{video.shares_count || 0} compartidos</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenMiniPlayer}
                      className="flex items-center gap-2"
                    >
                      <PictureInPicture className="w-4 h-4" />
                      Minireproductor
                    </Button>
                    <ShareButtons
                      videoId={video.id}
                      title={video.title}
                      description={video.description}
                      thumbnailUrl={video.thumbnail_url}
                    />
                  </div>

                  {/* Collapsible Info */}
                  {(video.description || video.producer_name) && (
                    <Collapsible 
                      open={showMoreInfo} 
                      onOpenChange={setShowMoreInfo}
                      className="pt-4 border-t border-border"
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full flex items-center justify-between hover:bg-secondary/50 transition-all duration-200"
                        >
                          <span className="font-medium">
                            {showMoreInfo ? "Ver menos información" : "Ver más información"}
                          </span>
                          <span className={cn(
                            "transition-transform duration-300 ease-in-out",
                            showMoreInfo && "rotate-180"
                          )}>
                            <ChevronDown className="w-5 h-5" />
                          </span>
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-4 mt-4">
                        {/* Description */}
                        {video.description && (
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {video.description}
                            </p>
                          </div>
                        )}

                        {/* Producer Info */}
                        {video.producer_name && (
                          <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Producido por:</span>
                              <span className="font-medium">{video.producer_name}</span>
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comentarios ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Comment Form */}
                  {user ? (
                    <form onSubmit={handleSubmitComment} className="space-y-4">
                      <Textarea
                        placeholder="Escribe un comentario..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={submittingComment || !commentText.trim()}
                        >
                          {submittingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Comentar
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Card className="bg-secondary/20">
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">
                          Inicia sesión para dejar un comentario
                        </p>
                        <Button onClick={() => navigate("/auth")}>
                          Iniciar Sesión
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aún no hay comentarios. ¡Sé el primero en comentar!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={comment.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {comment.profiles?.username || 'Usuario'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {comment.comment}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Related Videos */}
              {relatedVideos.length > 0 && (
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Más de {video.band_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedVideos.map((related) => (
                      <Link
                        key={related.id}
                        to={`/video/${related.id}`}
                        className="flex gap-3 group cursor-pointer"
                      >
                        <div className="relative w-32 aspect-video shrink-0 rounded overflow-hidden bg-secondary/30">
                          {related.thumbnail_url ? (
                            <img
                              src={related.thumbnail_url}
                              alt={related.title}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          {related.duration && (
                            <Badge className="absolute bottom-1 right-1 bg-black/70 text-white text-xs">
                              {formatDuration(related.duration)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {related.views_count} vistas
                          </p>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default VideoDetail;

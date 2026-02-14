import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
 import { 
   Loader2, 
   Upload, 
   X, 
   Video, 
   Image as ImageIcon, 
   Music, 
   Plus,
   Trash2,
   Eye,
   Save,
   Pencil,
   MessageSquare,
   DollarSign,
   Building2,
    Bell,
    Users,
    TrendingUp,
    FileText
  } from "lucide-react";
import { MessagesTab } from "@/components/profile/MessagesTab";
import { NotificationsTab } from "@/components/profile/NotificationsTab";
import { UserBankingForm } from "@/components/profile/UserBankingForm";
import { UserEarningsDashboard } from "@/components/profile/UserEarningsDashboard";
import { ForumActivitySection } from "@/components/profile/ForumActivitySection";
import { MyContentTab } from "@/components/profile/MyContentTab";
import { FollowersList } from "@/components/profile/FollowersList";
import { useFollow } from "@/hooks/useFollow";
import { validateFile, formatFileSize, FILE_COUNT_LIMITS } from "@/lib/storage-validation";
import { buildProfileObjectPath, uploadWithRetry } from "@/lib/storage-keys";

interface ProfileData {
  id: string;
  display_name: string;
  profile_type: string;
  additional_profile_types?: string[];
  bio: string | null;
  avatar_url: string | null;
  ciudad: string;
  pais: string;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
}

interface GalleryItem {
  id: string;
  url: string;
  title: string | null;
  media_type: string;
  order_index: number;
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  duration: number | null;
  order_index: number;
}

const profileTypeLabels: Record<string, string> = {
  agrupacion_musical: "Agrupación Musical",
  sala_concierto: "Sala de Concierto",
  estudio_grabacion: "Estudio de Grabación",
  productor_artistico: "Productor Artístico",
  promotor_artistico: "Promotor Artístico",
  productor_audiovisual: "Productor Audiovisual",
  musico: "Músico",
  dj: "DJ",
  vj: "VJ",
  sello_discografico: "Sello Discográfico",
  management: "Management",
  representante: "Representante",
  marketing_digital: "Marketing Digital",
  contenido: "Creador de Contenido",
  arte_digital: "Arte Digital",
  percusion: "Percusión",
  danza: "Danza",
  melomano: "Melómano"
};

const MiPerfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [audioPlaylist, setAudioPlaylist] = useState<AudioTrack[]>([]);
  
  // Follow stats
  const { followersCount, followingCount } = useFollow(user?.id || null);
  
  // New uploads
  const [newVideoLinks, setNewVideoLinks] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newAudios, setNewAudios] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profile_details")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          navigate("/asociate");
          return;
        }
        throw profileError;
      }

      setProfile(profileData);

      // Fetch gallery
      const { data: galleryData } = await supabase
        .from("profile_galleries")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("order_index");

      setGallery(galleryData || []);

      // Fetch audio
      const { data: audioData } = await supabase
        .from("audio_playlist")
        .select("*")
        .eq("profile_id", profileData.id)
        .order("order_index");

      setAudioPlaylist(audioData || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar tu perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Contar fotos y videos actuales
  const currentPhotos = gallery.filter(item => item.media_type === 'photo' || item.media_type === 'image');
  const currentVideos = gallery.filter(item => item.media_type === 'video');

  const handleAddVideoLink = () => {
    if (!videoLinkInput.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un enlace de video",
        variant: "destructive"
      });
      return;
    }

    // Verificar límite de videos
    const totalVideos = currentVideos.length + newVideoLinks.length + 1;
    if (totalVideos > FILE_COUNT_LIMITS.VIDEOS) {
      toast({
        title: "Límite de videos alcanzado",
        description: `Solo puedes tener máximo ${FILE_COUNT_LIMITS.VIDEOS} videos.`,
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(videoLinkInput);
    } catch {
      toast({
        title: "Enlace no válido",
        description: "El enlace ingresado no es una URL válida",
        variant: "destructive"
      });
      return;
    }

    setNewVideoLinks(prev => [...prev, videoLinkInput]);
    setVideoLinkInput("");
    toast({
      title: "Enlace agregado",
      description: "El enlace de video se agregó a la lista"
    });
  };

  const removeNewVideoLink = (index: number) => {
    setNewVideoLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    // Verificar límite de fotos
    const totalPhotos = currentPhotos.length + newImages.length + files.length;
    if (totalPhotos > FILE_COUNT_LIMITS.PHOTOS) {
      toast({
        title: "Límite de fotos alcanzado",
        description: `Solo puedes tener máximo ${FILE_COUNT_LIMITS.PHOTOS} fotos. Actualmente tienes ${currentPhotos.length} y ${newImages.length} pendientes de subir.`,
        variant: "destructive"
      });
      return;
    }

    files.forEach(file => {
      const validation = validateFile(file, 'image');
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Archivo no válido",
          description: validation.error,
          variant: "destructive"
        });
      }
    });

    setNewImages(prev => [...prev, ...validFiles]);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    files.forEach(file => {
      const validation = validateFile(file, 'audio');
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Archivo no válido",
          description: validation.error,
          variant: "destructive"
        });
      }
    });

    setNewAudios(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewAudio = (index: number) => {
    setNewAudios(prev => prev.filter((_, i) => i !== index));
  };

  const deleteGalleryItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("profile_galleries")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setGallery(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Eliminado",
        description: "El contenido se eliminó correctamente"
      });
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contenido",
        variant: "destructive"
      });
    }
  };

  const deleteAudioTrack = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from("audio_playlist")
        .delete()
        .eq("id", trackId);

      if (error) throw error;

      setAudioPlaylist(prev => prev.filter(track => track.id !== trackId));
      toast({
        title: "Eliminado",
        description: "El audio se eliminó correctamente"
      });
    } catch (error) {
      console.error("Error deleting audio track:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el audio",
        variant: "destructive"
      });
    }
  };

  const uploadNewContent = async () => {
    if (!profile) return;

    if (newVideoLinks.length === 0 && newImages.length === 0 && newAudios.length === 0) {
      toast({
        title: "Sin contenido nuevo",
        description: "Agrega enlaces o archivos para subir"
      });
      return;
    }

    setUploading(true);

    try {
      const currentMaxIndex = Math.max(
        ...gallery.map((g) => g.order_index),
        ...audioPlaylist.map((a) => a.order_index),
        -1
      );
      let orderIndex = currentMaxIndex + 1;

      const bucket = supabase.storage.from("profile-avatars");

      // Save video links
      for (const videoUrl of newVideoLinks) {
        await supabase.from("profile_galleries").insert({
          profile_id: profile.id,
          url: videoUrl,
          media_type: "video",
          order_index: orderIndex++
        });
      }

      // Upload images
      for (const file of newImages) {
        const fileName = buildProfileObjectPath(profile.id, file.name);
        const { data: imageData, error: imageError } = await uploadWithRetry(() =>
          bucket.upload(fileName, file)
        );

        if (imageError) throw imageError;
        if (!imageData) throw new Error("No se pudo subir la imagen");

        const {
          data: { publicUrl }
        } = bucket.getPublicUrl(imageData.path);

        await supabase.from("profile_galleries").insert({
          profile_id: profile.id,
          url: publicUrl,
          media_type: "photo",
          order_index: orderIndex++
        });
      }

      // Upload audios
      for (const file of newAudios) {
        const fileName = buildProfileObjectPath(profile.id, file.name);
        const { data: audioData, error: audioError } = await uploadWithRetry(() =>
          bucket.upload(fileName, file)
        );

        if (audioError) throw audioError;
        if (!audioData) throw new Error("No se pudo subir el audio");

        const {
          data: { publicUrl }
        } = bucket.getPublicUrl(audioData.path);

        await supabase.from("audio_playlist").insert({
          profile_id: profile.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          audio_url: publicUrl,
          order_index: orderIndex++
        });
      }

      // Clear new content and refresh
      setNewVideoLinks([]);
      setNewImages([]);
      setNewAudios([]);
      await fetchProfile();

      toast({
        title: "¡Contenido subido!",
        description: "Tu nuevo contenido se agregó correctamente a tu perfil"
      });
    } catch (error) {
      console.error("Error uploading content:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el contenido",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const photos = gallery.filter(item => item.media_type === "photo" || item.media_type === "image");
  const videos = gallery.filter(item => item.media_type === "video");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main id="main-content" className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background relative">
        <CosmicBackground />
        <Header />
        <main id="main-content" className="relative z-10 pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">No tienes un perfil</h1>
            <p className="text-muted-foreground mb-6">Crea tu perfil para aparecer en el circuito.</p>
            <Button onClick={() => navigate("/asociate")}>Crear Perfil</Button>
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

      <main id="main-content" className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary-glow to-accent bg-clip-text text-transparent">
            Mi Perfil
          </h1>

          {/* Profile Summary */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/30">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {profile.display_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {profileTypeLabels[profile.profile_type] || profile.profile_type}
                    </Badge>
                    {profile.additional_profile_types?.map(type => (
                      <Badge key={type} variant="outline" className="border-primary/30 text-primary/80">
                        {profileTypeLabels[type] || type}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                  <p className="text-muted-foreground">{profile.ciudad}, {profile.pais}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/editar-perfil")}
                    className="border-primary/50 text-primary hover:bg-primary/20"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/circuito/perfil/${profile.id}`)}
                    className="border-accent/50 text-accent hover:bg-accent/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Público
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/artist/analytics")}
                    className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/20"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Management */}
           <Tabs defaultValue="notifications" className="space-y-6">
             <TabsList className="flex w-full h-auto p-1.5 bg-card/50 overflow-x-auto gap-0.5">
               <TabsTrigger value="notifications" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                 <Bell className="w-3.5 h-3.5" />
                 Avisos
               </TabsTrigger>
               <TabsTrigger value="followers" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                 <Users className="w-3.5 h-3.5" />
                 Seguidores
               </TabsTrigger>
               <TabsTrigger value="earnings" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                 <DollarSign className="w-3.5 h-3.5" />
                 Ganancias
               </TabsTrigger>
               <TabsTrigger value="banking" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                 <Building2 className="w-3.5 h-3.5" />
                 Cobros
               </TabsTrigger>
              <TabsTrigger value="gallery" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                <ImageIcon className="w-3.5 h-3.5" />
                Fotos
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                 <Video className="w-3.5 h-3.5" />
                 Videos Perfil
               </TabsTrigger>
              <TabsTrigger value="audio" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                <Music className="w-3.5 h-3.5" />
                Música
              </TabsTrigger>
              <TabsTrigger value="mi-contenido" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                <FileText className="w-3.5 h-3.5" />
                On Demand
              </TabsTrigger>
              <TabsTrigger value="mensajes" className="flex-shrink-0 gap-1.5 py-2 px-2 text-[10px] md:text-xs font-medium tracking-wide uppercase text-cyan-400/70 data-[state=active]:text-cyan-400 data-[state=active]:bg-cyan-400/10 data-[state=active]:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:text-cyan-400 transition-all">
                <MessageSquare className="w-3.5 h-3.5" />
                Chats
              </TabsTrigger>
            </TabsList>

             {/* Notifications Tab */}
             <TabsContent value="notifications">
               <NotificationsTab />
             </TabsContent>

             {/* Followers Tab */}
             <TabsContent value="followers">
               <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-primary" />
                     Mis Seguidores ({followersCount})
                   </CardTitle>
                   <CardDescription>
                     Personas que siguen tu perfil
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   {user?.id && (
                     <FollowersList 
                       userId={user.id} 
                       followersCount={followersCount} 
                       isLoggedIn={true}
                       showAsDialog={false}
                     />
                   )}
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Earnings Tab */}
             <TabsContent value="earnings">
               <UserEarningsDashboard />
             </TabsContent>
 
             {/* Banking Tab */}
             <TabsContent value="banking">
               <UserBankingForm />
             </TabsContent>
 
            {/* Photos Tab */}
            <TabsContent value="gallery">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle>Galería de Fotos</CardTitle>
                  <CardDescription>
                    Administra las fotos de tu perfil ({photos.length}/{FILE_COUNT_LIMITS.PHOTOS} fotos)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Photos */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url}
                            alt={photo.title || "Foto"}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => deleteGalleryItem(photo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Photos Preview */}
                  {newImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Nuevas fotos por subir:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {newImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-primary/50"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 h-6 w-6"
                              onClick={() => removeNewImage(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {(photos.length + newImages.length) < FILE_COUNT_LIMITS.PHOTOS ? (
                    <div>
                      <Label htmlFor="new-images" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors">
                          <Plus className="w-5 h-5 text-primary" />
                          <span className="text-primary">
                            Agregar Fotos ({FILE_COUNT_LIMITS.PHOTOS - photos.length - newImages.length} disponibles)
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="new-images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                      Has alcanzado el límite máximo de {FILE_COUNT_LIMITS.PHOTOS} fotos
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle>Videos</CardTitle>
                  <CardDescription>Administra los videos de tu perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Videos */}
                  {videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((video) => {
                        const isYouTube = video.url.includes('youtube.com') || video.url.includes('youtu.be');
                        const isVimeo = video.url.includes('vimeo.com');
                        const isDailymotion = video.url.includes('dailymotion.com');
                        const isEmbed = isYouTube || isVimeo || isDailymotion;

                        let embedUrl = video.url;
                        if (isYouTube) {
                          const match = video.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
                          if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                        } else if (isVimeo) {
                          const match = video.url.match(/vimeo\.com\/(\d+)/);
                          if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
                        }

                        return (
                          <div key={video.id} className="relative group">
                            {isEmbed ? (
                              <iframe
                                src={embedUrl}
                                className="w-full h-40 rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={video.title || "Video"}
                              />
                            ) : (
                              <video
                                src={video.url}
                                className="w-full h-40 object-cover rounded-lg"
                                controls
                              />
                            )}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={() => deleteGalleryItem(video.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* New Video Links Preview */}
                  {newVideoLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Nuevos enlaces por guardar:</h4>
                      <div className="space-y-2">
                        {newVideoLinks.map((url, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-3">
                              <Video className="w-5 h-5 text-primary" />
                              <span className="text-sm truncate max-w-[300px]">{url}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => removeNewVideoLink(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Link Input */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={videoLinkInput}
                        onChange={(e) => setVideoLinkInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddVideoLink}
                        className="border-primary/50 text-primary hover:bg-primary/20"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Soporta: YouTube, Vimeo, Dailymotion o enlaces directos (mp4, webm)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle>Playlist de Audio</CardTitle>
                  <CardDescription>Administra las pistas de audio de tu perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Audio */}
                  {audioPlaylist.length > 0 && (
                    <div className="space-y-2">
                      {audioPlaylist.map((track) => (
                        <div key={track.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-primary" />
                            <span className="text-sm">{track.title}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteAudioTrack(track.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Audios Preview */}
                  {newAudios.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Nuevos audios por subir:</h4>
                      <div className="space-y-2">
                        {newAudios.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-3">
                              <Music className="w-5 h-5 text-primary" />
                              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => removeNewAudio(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div>
                    <Label htmlFor="new-audios" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors">
                        <Plus className="w-5 h-5 text-primary" />
                        <span className="text-primary">Agregar Audio</span>
                      </div>
                    </Label>
                    <Input
                      id="new-audios"
                      type="file"
                      accept=".mp3,.wav,.ogg,.aac,.m4a,.flac,audio/*"
                      multiple
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mi Contenido On Demand Tab */}
            <TabsContent value="mi-contenido">
              {user?.id && <MyContentTab userId={user.id} />}
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="mensajes">
              <MessagesTab />
            </TabsContent>
          </Tabs>

         {/* Forum Activity Section - Datos de Movimientos */}
         {user?.id && <ForumActivitySection userId={user.id} />}

          {/* Save Button */}
          {(newVideoLinks.length > 0 || newImages.length > 0 || newAudios.length > 0) && (
            <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50">
              <Button 
                size="lg"
                onClick={uploadNewContent}
                disabled={uploading}
                className="bg-primary hover:bg-primary/80 shadow-glow"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Guardar {newVideoLinks.length + newImages.length + newAudios.length} elemento(s)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MiPerfil;

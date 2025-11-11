import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoveUp, MoveDown } from "lucide-react";

interface YouTubeVideo {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail: string;
  duration: string;
  category: "programas" | "shorts" | "destacados";
  order_index: number;
  is_active: boolean;
}

const YouTubeVideos = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  const [formData, setFormData] = useState<{
    title: string;
    youtube_id: string;
    duration: string;
    category: "programas" | "shorts" | "destacados";
    is_active: boolean;
  }>({
    title: "",
    youtube_id: "",
    duration: "",
    category: "programas",
    is_active: true,
  });

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["youtube-videos", filterCategory],
    queryFn: async () => {
      let query = supabase
        .from("youtube_videos")
        .select("*")
        .order("category")
        .order("order_index");
      
      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as YouTubeVideo[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<YouTubeVideo>) => {
      if (editingVideo) {
        const { error } = await supabase
          .from("youtube_videos")
          .update(data)
          .eq("id", editingVideo.id);
        if (error) throw error;
      } else {
        // Get max order_index for category
        const { data: maxOrder } = await supabase
          .from("youtube_videos")
          .select("order_index")
          .eq("category", data.category)
          .order("order_index", { ascending: false })
          .limit(1)
          .single();
        
        const thumbnail = `https://img.youtube.com/vi/${data.youtube_id}/maxresdefault.jpg`;
        
        const { error } = await supabase.from("youtube_videos").insert([{
          title: data.title!,
          youtube_id: data.youtube_id!,
          thumbnail,
          duration: data.duration!,
          category: data.category!,
          is_active: data.is_active ?? true,
          order_index: (maxOrder?.order_index ?? -1) + 1,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      toast.success(editingVideo ? "Video actualizado" : "Video agregado");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("youtube_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      toast.success("Video eliminado");
    },
    onError: (error) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({
      id,
      newIndex,
    }: {
      id: string;
      newIndex: number;
    }) => {
      const { error } = await supabase
        .from("youtube_videos")
        .update({ order_index: newIndex })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
    },
  });

  const handleOpenDialog = (video?: YouTubeVideo) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title,
        youtube_id: video.youtube_id,
        duration: video.duration,
        category: video.category,
        is_active: video.is_active,
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: "",
        youtube_id: "",
        duration: "",
        category: "programas",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVideo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleReorder = (video: YouTubeVideo, direction: "up" | "down") => {
    const sameCategory = videos.filter((v) => v.category === video.category);
    const currentIndex = sameCategory.findIndex((v) => v.id === video.id);
    
    if (direction === "up" && currentIndex > 0) {
      const swapWith = sameCategory[currentIndex - 1];
      reorderMutation.mutate({ id: video.id, newIndex: swapWith.order_index });
      reorderMutation.mutate({
        id: swapWith.id,
        newIndex: video.order_index,
      });
    } else if (direction === "down" && currentIndex < sameCategory.length - 1) {
      const swapWith = sameCategory[currentIndex + 1];
      reorderMutation.mutate({ id: video.id, newIndex: swapWith.order_index });
      reorderMutation.mutate({
        id: swapWith.id,
        newIndex: video.order_index,
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Videos de YouTube</h1>
            <p className="text-muted-foreground">
              Gestiona los videos que se muestran en el Home
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Video
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="programas">Programas</SelectItem>
              <SelectItem value="shorts">Shorts</SelectItem>
              <SelectItem value="destacados">Destacados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>ID YouTube</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No hay videos
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(video, "up")}
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(video, "down")}
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>{video.youtube_id}</TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>
                      <span className="capitalize">{video.category}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          video.is_active ? "text-green-600" : "text-red-600"
                        }
                      >
                        {video.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? "Editar Video" : "Agregar Video"}
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del video de YouTube
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube_id">ID de YouTube</Label>
                <Input
                  id="youtube_id"
                  value={formData.youtube_id}
                  onChange={(e) =>
                    setFormData({ ...formData, youtube_id: e.target.value })
                  }
                  placeholder="dQw4w9WgXcQ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="10:30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programas">Programas</SelectItem>
                    <SelectItem value="shorts">Shorts</SelectItem>
                    <SelectItem value="destacados">Destacados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Video activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default YouTubeVideos;
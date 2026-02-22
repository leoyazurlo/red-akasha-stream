import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Save, X, FileText, Trash2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  video_url: string | null;
  audio_url: string | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  status: string | null;
  is_free: boolean;
  price: number | null;
  currency: string | null;
  band_name: string | null;
  producer_name: string | null;
  recording_studio: string | null;
  venue_name: string | null;
  promoter_name: string | null;
  views_count: number | null;
  likes_count: number | null;
  created_at: string | null;
}

const contentTypeLabels: Record<string, string> = {
  video_musical_vivo: "Video Musical en Vivo",
  video_clip: "Video Clip",
  podcast: "Podcast",
  documental: "Documental",
  corto: "Cortometraje",
  pelicula: "Película",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

interface MyContentTabProps {
  userId: string;
}

export const MyContentTab = ({ userId }: MyContentTabProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [userId]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content_uploads")
        .select("*")
        .eq("uploader_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("content_uploads")
        .update({
          title: editingItem.title,
          description: editingItem.description,
          band_name: editingItem.band_name,
          producer_name: editingItem.producer_name,
          recording_studio: editingItem.recording_studio,
          venue_name: editingItem.venue_name,
          promoter_name: editingItem.promoter_name,
          is_free: editingItem.is_free,
          price: editingItem.is_free ? null : editingItem.price,
          currency: editingItem.is_free ? null : editingItem.currency,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      setContent(prev =>
        prev.map(item => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
      toast({ title: "Guardado", description: "Contenido actualizado correctamente" });
    } catch (error) {
      console.error("Error updating content:", error);
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_uploads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContent(prev => prev.filter(item => item.id !== id));
      toast({ title: "Eliminado", description: "Contenido eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Mi Contenido On Demand ({content.length})
        </CardTitle>
        <CardDescription>
          Contenido que subiste para la sección On Demand. Podés editar o eliminar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aún no subiste contenido. Usá "Subir Contenido" desde el menú.
          </p>
        ) : (
          content.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 bg-background/50 rounded-lg border border-border"
            >
              {/* Thumbnail */}
              {item.thumbnail_url && (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{item.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {contentTypeLabels[item.content_type] || item.content_type}
                  </Badge>
                  <Badge
                    variant={item.status === "approved" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {statusLabels[item.status || "pending"] || item.status}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                )}
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  {item.band_name && <span>Artista: {item.band_name}</span>}
                  {item.is_free ? (
                    <span>Gratis</span>
                  ) : (
                    <span>{item.currency} {item.price}</span>
                  )}
                  <span>{item.views_count || 0} vistas</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingItem({ ...item })}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg bg-background max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Contenido</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Artista / Banda</Label>
                <Input
                  value={editingItem.band_name || ""}
                  onChange={e => setEditingItem({ ...editingItem, band_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Productor</Label>
                <Input
                  value={editingItem.producer_name || ""}
                  onChange={e => setEditingItem({ ...editingItem, producer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estudio de Grabación</Label>
                <Input
                  value={editingItem.recording_studio || ""}
                  onChange={e => setEditingItem({ ...editingItem, recording_studio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sala / Venue</Label>
                <Input
                  value={editingItem.venue_name || ""}
                  onChange={e => setEditingItem({ ...editingItem, venue_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Promotor</Label>
                <Input
                  value={editingItem.promoter_name || ""}
                  onChange={e => setEditingItem({ ...editingItem, promoter_name: e.target.value })}
                />
              </div>

              {/* Monetización */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">Monetización</Label>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-free-toggle" className="text-sm">Contenido gratuito</Label>
                  <Switch
                    id="is-free-toggle"
                    checked={editingItem.is_free}
                    onCheckedChange={(checked) => setEditingItem({ 
                      ...editingItem, 
                      is_free: checked, 
                      price: checked ? null : (editingItem.price || 4.99),
                      currency: checked ? editingItem.currency : (editingItem.currency || "USD"),
                    })}
                  />
                </div>
                {!editingItem.is_free && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={editingItem.price || ""}
                        onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || null })}
                        placeholder="4.99"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Moneda</Label>
                      <Select
                        value={editingItem.currency || "USD"}
                        onValueChange={(v) => setEditingItem({ ...editingItem, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="ARS">ARS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

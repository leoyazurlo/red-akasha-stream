import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProgramSchedule {
  id: string;
  day: string;
  time: string;
  image_url: string | null;
  program_name: string | null;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

const ProgramSchedules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    day: "",
    time: "",
    image_url: "",
    program_name: "",
    description: "",
    order_index: 0,
    is_active: true,
  });

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["program-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_schedules")
        .select("*")
        .order("order_index");

      if (error) throw error;
      return data as ProgramSchedule[];
    },
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<ProgramSchedule, "id">) => {
      const { data: schedule, error } = await supabase
        .from("program_schedules")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      toast({ title: "Horario creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["program-schedules"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error al crear horario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ProgramSchedule>;
    }) => {
      const { data: schedule, error } = await supabase
        .from("program_schedules")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      toast({ title: "Horario actualizado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["program-schedules"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar horario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("program_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Horario eliminado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["program-schedules"] });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar horario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("program-schedules")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("program-schedules").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));

      toast({ title: "Imagen subida exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error al subir imagen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      day: "",
      time: "",
      image_url: "",
      program_name: "",
      description: "",
      order_index: 0,
      is_active: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (schedule: ProgramSchedule) => {
    setFormData({
      day: schedule.day,
      time: schedule.time,
      image_url: schedule.image_url || "",
      program_name: schedule.program_name || "",
      description: schedule.description || "",
      order_index: schedule.order_index,
      is_active: schedule.is_active,
    });
    setEditingId(schedule.id);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Horarios de Programas</h1>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancelar" : "Nuevo Horario"}
          </Button>
        </div>

        {/* Form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "Editar Horario" : "Crear Nuevo Horario"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="day">Día</Label>
                    <Input
                      id="day"
                      value={formData.day}
                      onChange={(e) =>
                        setFormData({ ...formData, day: e.target.value })
                      }
                      placeholder="Ej: Lunes"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Horario</Label>
                    <Input
                      id="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      placeholder="Ej: 20:00 hs"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="program_name">Nombre del Programa</Label>
                    <Input
                      id="program_name"
                      value={formData.program_name}
                      onChange={(e) =>
                        setFormData({ ...formData, program_name: e.target.value })
                      }
                      placeholder="Nombre del programa"
                    />
                  </div>

                  <div>
                    <Label htmlFor="order_index">Orden</Label>
                    <Input
                      id="order_index"
                      type="number"
                      value={formData.order_index}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order_index: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descripción del programa"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Imagen del Programa</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="mt-2 w-40 h-24 object-cover rounded border"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>

                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingId ? "Actualizar" : "Crear"} Horario
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Schedules List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  {schedule.image_url && (
                    <img
                      src={schedule.image_url}
                      alt={schedule.program_name || schedule.day}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{schedule.day}</h3>
                      <span className="text-sm text-muted-foreground">
                        {schedule.time}
                      </span>
                    </div>
                    {schedule.program_name && (
                      <p className="text-sm font-medium text-primary">
                        {schedule.program_name}
                      </p>
                    )}
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {schedule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(schedule.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay horarios creados aún
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Horario
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El horario será eliminado
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ProgramSchedules;

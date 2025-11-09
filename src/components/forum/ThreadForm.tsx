import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { threadSchema, ThreadFormData } from "@/lib/validations/forum";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MentionTextarea } from "./MentionTextarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ThreadFormProps {
  subforoId: string;
  onSuccess?: () => void;
}

export const ThreadForm = ({ subforoId, onSuccess }: ThreadFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ThreadFormData>({
    resolver: zodResolver(threadSchema),
    defaultValues: {
      title: "",
      content: "",
      subforo_id: subforoId,
      thread_type: "debate_abierto",
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: ThreadFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const { data: thread, error } = await supabase
        .from("forum_threads")
        .insert([
          {
            author_id: user.id,
            content: data.content,
            subforo_id: data.subforo_id,
            title: data.title,
            thread_type: data.thread_type,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return thread;
    },
    onSuccess: () => {
      toast({
        title: "Hilo creado",
        description: "Tu hilo ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ThreadFormData) => {
    createThreadMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Escribe el título del hilo (5-200 caracteres)"
                  {...field}
                  maxLength={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thread_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de hilo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="debate_abierto">Debate Abierto</SelectItem>
                  <SelectItem value="debate_moderado">Debate Moderado</SelectItem>
                  <SelectItem value="pregunta_encuesta">Pregunta/Encuesta</SelectItem>
                  <SelectItem value="hilo_recursos">Hilo de Recursos</SelectItem>
                  <SelectItem value="anuncio">Anuncio</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido</FormLabel>
              <FormControl>
                <MentionTextarea
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Escribe el contenido del hilo (10-10,000 caracteres). Usa @usuario para mencionar."
                  minRows={8}
                />
              </FormControl>
              <div className="text-xs text-muted-foreground text-right">
                {field.value.length} / 10,000 caracteres
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createThreadMutation.isPending}
          className="w-full"
        >
          {createThreadMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Crear Hilo
        </Button>
      </form>
    </Form>
  );
};

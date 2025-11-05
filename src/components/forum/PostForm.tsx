import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { postSchema, PostFormData } from "@/lib/validations/forum";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface PostFormProps {
  threadId: string;
  parentPostId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export const PostForm = ({
  threadId,
  parentPostId,
  onSuccess,
  placeholder = "Escribe tu respuesta (1-5,000 caracteres)",
}: PostFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      thread_id: threadId,
      parent_post_id: parentPostId,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const { data: post, error } = await supabase
        .from("forum_posts")
        .insert([
          {
            content: data.content,
            thread_id: data.thread_id,
            parent_post_id: data.parent_post_id,
            author_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return post;
    },
    onSuccess: () => {
      toast({
        title: "Respuesta publicada",
        description: "Tu respuesta ha sido publicada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["forum-posts", threadId] });
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

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {parentPostId ? "Responder al comentario" : "Tu respuesta"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={placeholder}
                  className="min-h-[120px]"
                  {...field}
                  maxLength={5000}
                />
              </FormControl>
              <div className="text-xs text-muted-foreground text-right">
                {field.value.length} / 5,000 caracteres
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createPostMutation.isPending}
          className="w-full"
        >
          {createPostMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Publicar Respuesta
        </Button>
      </form>
    </Form>
  );
};

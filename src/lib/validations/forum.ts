import { z } from "zod";

// Thread validation schema
export const threadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: "El título debe tener al menos 5 caracteres" })
    .max(200, { message: "El título no puede exceder 200 caracteres" }),
  content: z
    .string()
    .trim()
    .min(10, { message: "El contenido debe tener al menos 10 caracteres" })
    .max(10000, { message: "El contenido no puede exceder 10,000 caracteres" }),
  subforo_id: z.string().uuid({ message: "Subforo inválido" }),
  thread_type: z.enum(["debate_abierto", "debate_moderado", "pregunta_encuesta", "hilo_recursos", "anuncio"]).optional(),
});

export type ThreadFormData = z.infer<typeof threadSchema>;

// Post validation schema
export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "El contenido no puede estar vacío" })
    .max(5000, { message: "El contenido no puede exceder 5,000 caracteres" }),
  thread_id: z.string().uuid({ message: "Thread inválido" }),
  parent_post_id: z.string().uuid().optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: "El mensaje no puede estar vacío" })
    .max(500, { message: "El mensaje no puede exceder 500 caracteres" }),
  stream_id: z.string().uuid({ message: "Stream inválido" }),
});

export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

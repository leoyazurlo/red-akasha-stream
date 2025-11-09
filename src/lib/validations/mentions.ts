import { z } from 'zod';

// Validación para menciones en el contenido
export const validateMentions = (content: string): boolean => {
  // Extraer menciones del contenido
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = content.match(mentionRegex);
  
  if (!mentions) return true;
  
  // Validar que cada mención tenga un formato válido
  for (const mention of mentions) {
    const username = mention.slice(1); // Remover @
    
    // Validar longitud y caracteres
    if (username.length < 3 || username.length > 30) {
      return false;
    }
    
    // Solo permitir letras, números y guión bajo
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return false;
    }
  }
  
  return true;
};

// Schema para contenido con menciones
export const contentWithMentionsSchema = z
  .string()
  .min(1, 'El contenido no puede estar vacío')
  .max(10000, 'El contenido es demasiado largo')
  .refine(
    (content) => validateMentions(content),
    'Las menciones contienen caracteres inválidos'
  );

// Extraer menciones válidas de un texto
export const extractValidMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_]{3,30})/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  // Retornar menciones únicas
  return [...new Set(mentions)];
};

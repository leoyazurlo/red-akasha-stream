import { z } from "zod";

// Lista de contraseñas comunes a bloquear
const COMMON_PASSWORDS = [
  "password", "password123", "123456", "12345678", "qwerty", "abc123",
  "monkey", "master", "dragon", "111111", "baseball", "iloveyou",
  "trustno1", "sunshine", "princess", "welcome", "shadow", "superman",
  "michael", "football", "password1", "123456789", "adobe123", "admin",
  "letmein", "photoshop", "1234567", "monkey1", "password2", "login"
];

export const passwordSchema = z.string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .max(72, { message: "La contraseña no puede exceder 72 caracteres" })
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Debe incluir al menos una mayúscula" }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: "Debe incluir al menos una minúscula" }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: "Debe incluir al menos un número" }
  )
  .refine(
    (password) => !COMMON_PASSWORDS.includes(password.toLowerCase()),
    { message: "Esta contraseña es muy común, elige una más segura" }
  );

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Penalizar contraseñas comunes
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = 0;
  }
  
  // Normalizar a 0-4
  const normalizedScore = Math.min(Math.floor(score * 4 / 6), 4);
  
  const strengthLevels: PasswordStrength[] = [
    { score: 0, label: "Muy débil", color: "bg-destructive" },
    { score: 1, label: "Débil", color: "bg-orange-500" },
    { score: 2, label: "Regular", color: "bg-yellow-500" },
    { score: 3, label: "Buena", color: "bg-lime-500" },
    { score: 4, label: "Excelente", color: "bg-green-500" },
  ];
  
  return strengthLevels[normalizedScore];
}

/**
 * @fileoverview Tipos del App Builder de Akasha IA.
 * Define las interfaces para el IDE, archivos de proyecto y mensajes.
 */

/** Código generado por la IA separado por capas */
export interface GeneratedCode {
  /** Código del frontend (React/TypeScript) */
  frontend: string;
  /** Código del backend (Edge Functions) */
  backend: string;
  /** Migraciones SQL de base de datos */
  database: string;
}

/** Tipos de lenguaje soportados en el editor */
export type EditorLanguage = "typescript" | "javascript" | "sql" | "json" | "css";

/** Archivo o carpeta del proyecto virtual */
export interface ProjectFile {
  /** ID único del archivo */
  id: string;
  /** Nombre del archivo o carpeta */
  name: string;
  /** Ruta completa del archivo */
  path: string;
  /** Tipo: archivo o carpeta */
  type: "file" | "folder";
  /** Lenguaje del archivo (solo para archivos) */
  language?: EditorLanguage;
  /** Contenido del archivo (solo para archivos) */
  content?: string;
  /** Hijos (solo para carpetas) */
  children?: ProjectFile[];
}

/** Archivo subido al chat */
export interface UploadedFile {
  /** ID único del archivo */
  id: string;
  /** Nombre del archivo */
  name: string;
  /** Tipo de contenido */
  type: "image" | "code" | "document" | "audio" | "video";
  /** URL del archivo */
  url?: string;
  /** Contenido extraído del archivo */
  content?: string;
  /** Estado de procesamiento */
  status: "uploading" | "processing" | "completed" | "error";
  /** Mensaje de error si falló */
  error?: string;
}

/** Mensaje en el chat del IDE */
export interface ChatMessage {
  /** Rol del autor del mensaje */
  role: "user" | "assistant";
  /** Contenido del mensaje */
  content: string;
  /** Archivos adjuntos al mensaje */
  files?: UploadedFile[];
  /** Timestamp del mensaje */
  timestamp?: Date;
}

/** Estado del IDE del App Builder */
export interface AppBuilderState {
  /** Mensajes del chat */
  messages: ChatMessage[];
  /** Código generado actual */
  generatedCode: GeneratedCode;
  /** Tab activo del editor */
  activeTab: "frontend" | "backend" | "database";
  /** Etapa actual del ciclo de vida */
  lifecycleStage: string;
  /** Score de validación (0-100) */
  validationScore: number | null;
  /** ID de la propuesta actual */
  proposalId: string | null;
  /** Archivos del proyecto virtual */
  projectFiles: ProjectFile[];
  /** Archivos subidos pendientes */
  uploadedFiles: UploadedFile[];
  /** Carpetas expandidas en el explorador */
  expandedFolders: Set<string>;
  /** Archivo seleccionado en el explorador */
  selectedFile: ProjectFile | null;
}

/** Acciones disponibles en el App Builder */
export type AppBuilderAction =
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_CODE"; payload: Partial<GeneratedCode> }
  | { type: "SET_TAB"; payload: "frontend" | "backend" | "database" }
  | { type: "SET_STAGE"; payload: string }
  | { type: "SET_VALIDATION_SCORE"; payload: number | null }
  | { type: "SET_PROPOSAL_ID"; payload: string | null }
  | { type: "SET_UPLOADED_FILES"; payload: UploadedFile[] }
  | { type: "TOGGLE_FOLDER"; payload: string }
  | { type: "SELECT_FILE"; payload: ProjectFile | null };

/**
 * @fileoverview Explorador de archivos del proyecto virtual.
 * Muestra la estructura de archivos del proyecto generado.
 */

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderTree,
  Plus,
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
} from "lucide-react";
import type { ProjectFile } from "@/lib/types";

interface FileExplorerProps {
  /** Archivos del proyecto */
  files: ProjectFile[];
  /** Archivo seleccionado actualmente */
  selectedFile: ProjectFile | null;
  /** IDs de carpetas expandidas */
  expandedFolders: Set<string>;
  /** Callback cuando se selecciona un archivo */
  onFileSelect: (file: ProjectFile) => void;
  /** Callback para expandir/colapsar carpeta */
  onToggleFolder: (id: string) => void;
}

/**
 * Componente de explorador de archivos tipo VS Code
 */
export function FileExplorer({
  files,
  selectedFile,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
}: FileExplorerProps) {
  /**
   * Renderiza el árbol de archivos recursivamente
   */
  const renderFileTree = (items: ProjectFile[], depth = 0) => {
    return items.map((file) => (
      <div key={file.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 hover:bg-muted/50 cursor-pointer rounded text-sm ${
            selectedFile?.id === file.id ? "bg-cyan-500/20 text-cyan-400" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (file.type === "folder") {
              onToggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
        >
          {file.type === "folder" ? (
            <>
              {expandedFolders.has(file.id) ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-cyan-400" />
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span className="truncate">{file.name}</span>
        </div>
        {file.type === "folder" && expandedFolders.has(file.id) && file.children && (
          <div>{renderFileTree(file.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="border-b border-cyan-500/10">
      <div className="flex items-center justify-between p-2 border-b border-cyan-500/10">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <FolderTree className="h-3.5 w-3.5" />
          EXPLORER
        </span>
        <Button size="icon" variant="ghost" className="h-5 w-5">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="h-40">
        <div className="py-1">{renderFileTree(files)}</div>
      </ScrollArea>
    </div>
  );
}

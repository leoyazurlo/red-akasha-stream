import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Code, 
  Smartphone, 
  Monitor, 
  Tablet,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Layout,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodePreviewPanelProps {
  code: {
    frontend: string;
    backend: string;
    database: string;
  };
  title?: string;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

const VIEWPORT_SIZES: Record<ViewportSize, { width: number; height: number; label: string }> = {
  mobile: { width: 375, height: 667, label: "Mobile" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
};

// Extract component structure from TSX code
function parseComponentStructure(code: string) {
  const components: { name: string; type: string; props: string[] }[] = [];
  
  // Match JSX elements
  const jsxRegex = /<(\w+)([^>]*?)(?:\/?>)/g;
  let match;
  
  while ((match = jsxRegex.exec(code)) !== null) {
    const [, tagName, propsStr] = match;
    if (tagName && tagName[0] === tagName[0].toUpperCase()) {
      // It's a component (starts with uppercase)
      const props = (propsStr.match(/\w+=/g) || []).map(p => p.replace("=", ""));
      components.push({ name: tagName, type: "component", props });
    }
  }
  
  return components;
}

// Generate a simplified visual preview based on the code structure
function generatePreviewHTML(code: string): string {
  // Detect common UI patterns
  const hasButton = /Button|button/i.test(code);
  const hasInput = /Input|input|TextField/i.test(code);
  const hasCard = /Card/i.test(code);
  const hasTable = /Table|DataTable/i.test(code);
  const hasForm = /Form|form/i.test(code);
  const hasModal = /Dialog|Modal|Sheet/i.test(code);
  const hasTabs = /Tabs|TabsList/i.test(code);
  const hasNavigation = /Navigation|Nav|Header/i.test(code);
  const hasGrid = /grid|Grid/i.test(code);
  const hasList = /map\(|\.map|List/i.test(code);
  
  // Extract text content from JSX
  const textMatches = code.match(/>([^<>{]+)</g) || [];
  const texts = textMatches
    .map(t => t.replace(/^>|<$/g, "").trim())
    .filter(t => t && t.length > 2 && !/^[{}\[\]()]+$/.test(t))
    .slice(0, 5);

  // Build preview HTML with Tailwind-like styles
  let html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); min-height: 100%; color: #e2e8f0;">
  `;

  if (hasNavigation) {
    html += `
      <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 8px; padding: 12px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 8px;"></div>
          <span style="font-weight: 600; color: #06b6d4;">Logo</span>
        </div>
        <div style="display: flex; gap: 16px;">
          <span style="color: #94a3b8; cursor: pointer;">Inicio</span>
          <span style="color: #94a3b8; cursor: pointer;">Servicios</span>
          <span style="color: #94a3b8; cursor: pointer;">Contacto</span>
        </div>
      </div>
    `;
  }

  if (hasTabs) {
    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border-radius: 8px; padding: 4px; margin-bottom: 20px; display: inline-flex; gap: 4px;">
        <div style="background: #06b6d4; color: #0f172a; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Tab 1</div>
        <div style="color: #94a3b8; padding: 8px 16px; border-radius: 6px; font-size: 14px;">Tab 2</div>
        <div style="color: #94a3b8; padding: 8px 16px; border-radius: 6px; font-size: 14px;">Tab 3</div>
      </div>
    `;
  }

  if (hasCard || hasForm) {
    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">${texts[0] || "Componente Generado"}</h3>
        <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px;">${texts[1] || "Descripción del componente generado por IA"}</p>
    `;

    if (hasInput || hasForm) {
      html += `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; color: #94a3b8; margin-bottom: 6px;">Campo de entrada</label>
          <div style="background: #0f172a; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 6px; padding: 10px 12px; color: #64748b; font-size: 14px;">Escribe aquí...</div>
        </div>
      `;
    }

    if (hasButton) {
      html += `
        <div style="display: flex; gap: 12px;">
          <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Acción Principal</div>
          <div style="background: transparent; border: 1px solid rgba(6, 182, 212, 0.3); color: #06b6d4; padding: 10px 20px; border-radius: 6px; font-size: 14px; cursor: pointer;">Cancelar</div>
        </div>
      `;
    }

    html += `</div>`;
  }

  if (hasTable) {
    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); background: rgba(6, 182, 212, 0.1); padding: 12px 16px; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase;">
          <div>Columna 1</div>
          <div>Columna 2</div>
          <div>Columna 3</div>
          <div>Estado</div>
        </div>
        ${[1, 2, 3].map(i => `
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); padding: 12px 16px; border-top: 1px solid rgba(6, 182, 212, 0.1); font-size: 14px;">
            <div style="color: #e2e8f0;">Dato ${i}A</div>
            <div style="color: #94a3b8;">Dato ${i}B</div>
            <div style="color: #94a3b8;">Dato ${i}C</div>
            <div><span style="background: ${i === 1 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(6, 182, 212, 0.2)'}; color: ${i === 1 ? '#22c55e' : '#06b6d4'}; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">${i === 1 ? 'Activo' : 'Pendiente'}</span></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (hasList && hasGrid) {
    html += `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
        ${[1, 2, 3, 4].map(i => `
          <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 16px;">
            <div style="width: 100%; height: 100px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05)); border-radius: 8px; margin-bottom: 12px;"></div>
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #f1f5f9;">Elemento ${i}</h4>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Descripción breve</p>
          </div>
        `).join('')}
      </div>
    `;
  } else if (hasList) {
    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        ${[1, 2, 3].map(i => `
          <div style="display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid rgba(6, 182, 212, 0.1);">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(6, 182, 212, 0.1)); border-radius: 8px;"></div>
            <div style="flex: 1;">
              <div style="font-size: 14px; color: #f1f5f9; margin-bottom: 4px;">Elemento de lista ${i}</div>
              <div style="font-size: 12px; color: #64748b;">Información adicional</div>
            </div>
            <div style="color: #06b6d4;">→</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (hasModal) {
    html += `
      <div style="position: relative; background: rgba(0,0,0,0.5); border-radius: 12px; padding: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="background: #1e293b; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; padding: 24px; max-width: 320px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #f1f5f9;">Modal / Diálogo</h3>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8;">Este es un ejemplo de modal generado.</p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <div style="background: transparent; border: 1px solid rgba(6, 182, 212, 0.3); color: #94a3b8; padding: 8px 16px; border-radius: 6px; font-size: 14px;">Cancelar</div>
            <div style="background: #06b6d4; color: #0f172a; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Confirmar</div>
          </div>
        </div>
      </div>
    `;
  }

  // If nothing was detected, show a generic component structure
  if (!hasButton && !hasCard && !hasTable && !hasForm && !hasList) {
    const components = parseComponentStructure(code);
    html += `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 12px; padding: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #f1f5f9; display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; background: #06b6d4; border-radius: 50%;"></span>
          Estructura del Componente
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${components.length > 0 
            ? components.slice(0, 10).map(c => `
                <span style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); color: #06b6d4; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-family: monospace;">&lt;${c.name} /&gt;</span>
              `).join('')
            : '<span style="color: #64748b; font-size: 14px;">Componente básico</span>'
          }
        </div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

export function CodePreviewPanel({ code, title }: CodePreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewHTML = code.frontend && code.frontend !== "// No se generó código frontend" 
    ? generatePreviewHTML(code.frontend)
    : null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPreviewKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const components = code.frontend ? parseComponentStructure(code.frontend) : [];

  if (!previewHTML) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="py-12 text-center">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Genera código frontend para ver la vista previa visual
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-card/50 border-primary/20 transition-all",
      isFullscreen && "fixed inset-4 z-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            Vista Previa Visual
            <Badge variant="outline" className="ml-2 text-xs">
              {components.length} componentes detectados
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Viewport Controls */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
              <Button
                variant={viewport === "mobile" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewport("mobile")}
                title="Vista móvil"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === "tablet" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewport("tablet")}
                title="Vista tablet"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === "desktop" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewport("desktop")}
                title="Vista desktop"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refrescar preview"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Frame */}
        <div className="relative bg-muted/30 rounded-lg p-4 overflow-hidden">
          <div 
            className="mx-auto transition-all duration-300 bg-background rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: Math.min(VIEWPORT_SIZES[viewport].width, isFullscreen ? window.innerWidth - 100 : 800),
              maxWidth: "100%",
            }}
          >
            {/* Browser Chrome */}
            <div className="bg-muted/80 px-3 py-2 flex items-center gap-2 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 bg-muted rounded px-3 py-1 text-xs text-muted-foreground truncate">
                preview.redakasha.app/{title?.toLowerCase().replace(/\s+/g, "-") || "componente"}
              </div>
            </div>
            
            {/* Preview Content */}
            <div 
              className="overflow-auto"
              style={{ height: isFullscreen ? "calc(100vh - 200px)" : "400px" }}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0;}html,body{height:100%;}</style></head><body>${previewHTML}</body></html>`}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
          
          {/* Viewport Label */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {VIEWPORT_SIZES[viewport].width} × {VIEWPORT_SIZES[viewport].height}
            </Badge>
          </div>
        </div>

        {/* Component Structure Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary" />
              Componentes Detectados
            </h4>
            <div className="flex flex-wrap gap-2">
              {components.length > 0 ? (
                components.slice(0, 15).map((comp, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-mono">
                    {comp.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Analizando estructura...</span>
              )}
              {components.length > 15 && (
                <Badge variant="secondary" className="text-xs">
                  +{components.length - 15} más
                </Badge>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Patrones UI Detectados
            </h4>
            <div className="flex flex-wrap gap-2">
              {/Button/i.test(code.frontend) && <Badge className="bg-green-500/20 text-green-400 text-xs">Botones</Badge>}
              {/Input|TextField/i.test(code.frontend) && <Badge className="bg-blue-500/20 text-blue-400 text-xs">Inputs</Badge>}
              {/Card/i.test(code.frontend) && <Badge className="bg-purple-500/20 text-purple-400 text-xs">Cards</Badge>}
              {/Table/i.test(code.frontend) && <Badge className="bg-orange-500/20 text-orange-400 text-xs">Tablas</Badge>}
              {/Form/i.test(code.frontend) && <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Formularios</Badge>}
              {/Dialog|Modal/i.test(code.frontend) && <Badge className="bg-pink-500/20 text-pink-400 text-xs">Modales</Badge>}
              {/Tabs/i.test(code.frontend) && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Tabs</Badge>}
              {/grid|Grid/i.test(code.frontend) && <Badge className="bg-indigo-500/20 text-indigo-400 text-xs">Grid</Badge>}
              {/\.map\(/i.test(code.frontend) && <Badge className="bg-teal-500/20 text-teal-400 text-xs">Listas</Badge>}
            </div>
          </div>
        </div>

        {/* Info Badge */}
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Esta es una vista previa aproximada basada en el análisis del código. 
            La implementación real puede variar según los datos y estilos aplicados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

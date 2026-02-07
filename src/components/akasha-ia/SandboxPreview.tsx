import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Terminal,
  Loader2,
} from "lucide-react";

interface SandboxPreviewProps {
  code: {
    frontend: string;
    backend?: string;
    database?: string;
  };
  routes?: { path: string; component: string }[];
}

type Viewport = "mobile" | "tablet" | "desktop";

interface ConsoleLog {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: Date;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 667, label: "Mobile" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
};

export function SandboxPreview({ code, routes = [] }: SandboxPreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [currentRoute, setCurrentRoute] = useState("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate sandbox HTML with the React code
  const generateSandboxHTML = () => {
    const { frontend } = code;
    
    // Extract component name from code
    const componentMatch = frontend.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
    const componentName = componentMatch?.[1] || "App";

    // Transform TSX to JS (simplified - in production use Babel)
    let jsCode = frontend
      // Remove TypeScript types
      .replace(/:\s*\w+(\[\])?\s*(?=[,\)\=\{])/g, "")
      .replace(/<\w+>/g, "")
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
      // Transform imports
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, "")
      // Add export if not present
      .replace(/^(function|const)\s+/, "export $1");

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Akasha Sandbox</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: #0A0A0F;
      color: #fff;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
    .error-display {
      padding: 20px;
      background: #7f1d1d;
      color: #fca5a5;
      border-radius: 8px;
      margin: 20px;
    }
  </style>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: '#0A0A0F',
            foreground: '#FAFAFA',
            primary: { DEFAULT: '#22D3EE', foreground: '#0A0A0F' },
            secondary: { DEFAULT: '#1A1A2E', foreground: '#FAFAFA' },
            muted: { DEFAULT: '#27272A', foreground: '#A1A1AA' },
            accent: { DEFAULT: '#22D3EE', foreground: '#0A0A0F' },
            card: { DEFAULT: '#111118', foreground: '#FAFAFA' },
            border: '#27272A',
          }
        }
      }
    }
  </script>
</head>
<body class="dark">
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useCallback, useMemo, useRef, memo } = React;
    
    // Mock UI components
    const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled, ...props }) => {
      const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50";
      const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      };
      const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      };
      return React.createElement('button', { 
        className: baseStyles + " " + (variants[variant] || variants.default) + " " + (sizes[size] || sizes.default) + " " + className,
        onClick,
        disabled,
        ...props
      }, children);
    };
    
    const Card = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "rounded-lg border bg-card text-card-foreground shadow-sm " + className, ...props }, children);
    
    const CardHeader = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "flex flex-col space-y-1.5 p-6 " + className, ...props }, children);
    
    const CardTitle = ({ children, className = "", ...props }) => 
      React.createElement('h3', { className: "text-2xl font-semibold leading-none tracking-tight " + className, ...props }, children);
    
    const CardContent = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "p-6 pt-0 " + className, ...props }, children);
    
    const Input = ({ className = "", type = "text", ...props }) => 
      React.createElement('input', { 
        type,
        className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 " + className,
        ...props
      });
    
    const Badge = ({ children, className = "", variant = "default", ...props }) => {
      const variants = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input"
      };
      return React.createElement('div', { 
        className: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors " + (variants[variant] || variants.default) + " " + className,
        ...props
      }, children);
    };
    
    const Label = ({ children, className = "", ...props }) =>
      React.createElement('label', { className: "text-sm font-medium leading-none " + className, ...props }, children);
    
    const Textarea = ({ className = "", ...props }) =>
      React.createElement('textarea', {
        className: "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 " + className,
        ...props
      });

    // User's code
    ${jsCode}

    // Render
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(${componentName}));
      window.parent.postMessage({ type: 'sandbox-ready' }, '*');
    } catch (err) {
      document.getElementById('root').innerHTML = '<div class="error-display"><strong>Error:</strong> ' + err.message + '</div>';
      window.parent.postMessage({ type: 'sandbox-error', error: err.message }, '*');
    }

    // Override console for parent communication
    const originalConsole = { ...console };
    ['log', 'error', 'warn', 'info'].forEach(method => {
      console[method] = (...args) => {
        originalConsole[method](...args);
        window.parent.postMessage({ 
          type: 'console', 
          method, 
          message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      };
    });

    window.onerror = (msg, url, line, col, error) => {
      window.parent.postMessage({ type: 'sandbox-error', error: msg }, '*');
    };
  </script>
</body>
</html>`;

    return html;
  };

  // Handle messages from sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      if (data.type === "sandbox-ready") {
        setIsLoading(false);
        setError(null);
      } else if (data.type === "sandbox-error") {
        setError(data.error);
        setIsLoading(false);
      } else if (data.type === "console") {
        setConsoleLogs((prev) => [
          ...prev.slice(-99),
          { type: data.method, message: data.message, timestamp: new Date() },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Refresh sandbox
  const refreshSandbox = () => {
    setIsLoading(true);
    setError(null);
    setConsoleLogs([]);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateSandboxHTML();
    }
  };

  // Initial load
  useEffect(() => {
    refreshSandbox();
  }, [code.frontend]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const currentViewport = VIEWPORTS[viewport];

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={refreshSandbox} title="Refrescar">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <Button
              size="sm"
              variant={viewport === "mobile" ? "secondary" : "ghost"}
              onClick={() => setViewport("mobile")}
              className="h-7 px-2"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewport === "tablet" ? "secondary" : "ghost"}
              onClick={() => setViewport("tablet")}
              className="h-7 px-2"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewport === "desktop" ? "secondary" : "ghost"}
              onClick={() => setViewport("desktop")}
              className="h-7 px-2"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentViewport.width} × {currentViewport.height}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Error
            </Badge>
          ) : isLoading ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </Badge>
          ) : (
            <Badge className="gap-1 bg-green-500/20 text-green-400">
              <CheckCircle className="h-3 w-3" />
              Listo
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConsole(!showConsole)}
            className={showConsole ? "bg-muted" : ""}
          >
            <Terminal className="h-4 w-4" />
            {consoleLogs.filter((l) => l.type === "error").length > 0 && (
              <span className="ml-1 text-xs text-red-400">
                {consoleLogs.filter((l) => l.type === "error").length}
              </span>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Routes navigation */}
      {routes.length > 1 && (
        <div className="flex items-center gap-2 p-2 bg-muted/20 border-b border-cyan-500/10 overflow-x-auto">
          {routes.map((route) => (
            <Button
              key={route.path}
              size="sm"
              variant={currentRoute === route.path ? "secondary" : "ghost"}
              onClick={() => setCurrentRoute(route.path)}
              className="text-xs whitespace-nowrap"
            >
              {route.path}
            </Button>
          ))}
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 bg-muted/10 flex items-center justify-center p-4 overflow-auto">
        <div
          className="bg-background rounded-lg shadow-2xl border border-cyan-500/20 overflow-hidden transition-all duration-300"
          style={{
            width: isFullscreen ? "100%" : Math.min(currentViewport.width, window.innerWidth - 48),
            height: isFullscreen ? "100%" : Math.min(currentViewport.height, 600),
            maxHeight: isFullscreen ? "100%" : "600px",
          }}
        >
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error de Renderizado</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={refreshSandbox}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              title="Sandbox Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={generateSandboxHTML()}
            />
          )}
        </div>
      </div>

      {/* Console panel */}
      {showConsole && (
        <div className="border-t border-cyan-500/20 bg-muted/30">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-500/10">
            <span className="text-xs font-medium text-muted-foreground">Consola</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConsoleLogs([])}
              className="h-6 text-xs"
            >
              Limpiar
            </Button>
          </div>
          <ScrollArea className="h-32">
            <div className="p-2 font-mono text-xs space-y-1">
              {consoleLogs.length === 0 ? (
                <span className="text-muted-foreground">Sin logs...</span>
              ) : (
                consoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded ${
                      log.type === "error"
                        ? "bg-red-500/10 text-red-400"
                        : log.type === "warn"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="opacity-50 mr-2">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

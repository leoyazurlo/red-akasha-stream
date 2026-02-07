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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #4B5563; }
  </style>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            background: '#0A0A0F',
            foreground: '#FAFAFA',
            primary: { DEFAULT: '#22D3EE', foreground: '#0A0A0F' },
            secondary: { DEFAULT: '#1A1A2E', foreground: '#FAFAFA' },
            muted: { DEFAULT: '#27272A', foreground: '#A1A1AA' },
            accent: { DEFAULT: '#22D3EE', foreground: '#0A0A0F' },
            card: { DEFAULT: '#111118', foreground: '#FAFAFA' },
            border: '#27272A',
            destructive: { DEFAULT: '#EF4444', foreground: '#FAFAFA' },
          },
          animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.3s ease-out',
            'pulse-slow': 'pulse 3s infinite',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
            slideUp: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
          }
        }
      }
    }
  </script>
</head>
<body class="dark">
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useCallback, useMemo, useRef, memo, createContext, useContext } = React;
    
    // ===== Extended Mock UI Components =====
    
    const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled, type = "button", ...props }) => {
      const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
      const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link: "text-primary underline-offset-4 hover:underline",
      };
      const sizes = {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10"
      };
      return React.createElement('button', { 
        type,
        className: baseStyles + " " + (variants[variant] || variants.default) + " " + (sizes[size] || sizes.default) + " " + className,
        onClick,
        disabled,
        ...props
      }, children);
    };
    
    const Card = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "rounded-xl border border-border bg-card text-card-foreground shadow-lg backdrop-blur-sm " + className, ...props }, children);
    
    const CardHeader = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "flex flex-col space-y-1.5 p-6 " + className, ...props }, children);
    
    const CardTitle = ({ children, className = "", ...props }) => 
      React.createElement('h3', { className: "text-2xl font-semibold leading-none tracking-tight " + className, ...props }, children);
    
    const CardDescription = ({ children, className = "", ...props }) => 
      React.createElement('p', { className: "text-sm text-muted-foreground " + className, ...props }, children);
    
    const CardContent = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "p-6 pt-0 " + className, ...props }, children);
    
    const CardFooter = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "flex items-center p-6 pt-0 " + className, ...props }, children);
    
    const Input = ({ className = "", type = "text", ...props }) => 
      React.createElement('input', { 
        type,
        className: "flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all " + className,
        ...props
      });
    
    const Badge = ({ children, className = "", variant = "default", ...props }) => {
      const variants = {
        default: "bg-primary/20 text-primary border-primary/30",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input bg-transparent",
        destructive: "bg-destructive/20 text-destructive border-destructive/30",
        success: "bg-green-500/20 text-green-400 border-green-500/30",
      };
      return React.createElement('div', { 
        className: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " + (variants[variant] || variants.default) + " " + className,
        ...props
      }, children);
    };
    
    const Label = ({ children, className = "", htmlFor, ...props }) =>
      React.createElement('label', { htmlFor, className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 " + className, ...props }, children);
    
    const Textarea = ({ className = "", ...props }) =>
      React.createElement('textarea', {
        className: "flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none " + className,
        ...props
      });
    
    const Switch = ({ checked = false, onCheckedChange, className = "", disabled = false }) => {
      return React.createElement('button', {
        role: 'switch',
        'aria-checked': checked,
        disabled,
        onClick: () => onCheckedChange && onCheckedChange(!checked),
        className: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 " + (checked ? 'bg-primary' : 'bg-muted') + " " + className,
      }, React.createElement('span', {
        className: "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform " + (checked ? 'translate-x-6' : 'translate-x-1')
      }));
    };
    
    const Checkbox = ({ checked = false, onCheckedChange, className = "", id }) => {
      return React.createElement('button', {
        id,
        role: 'checkbox',
        'aria-checked': checked,
        onClick: () => onCheckedChange && onCheckedChange(!checked),
        className: "h-4 w-4 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 " + (checked ? 'bg-primary text-primary-foreground' : 'bg-transparent') + " " + className,
      }, checked && React.createElement('svg', { className: 'h-3 w-3', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
      ));
    };
    
    const Select = ({ children, value, onValueChange, placeholder = "Seleccionar..." }) => {
      const [isOpen, setIsOpen] = useState(false);
      return React.createElement('div', { className: 'relative' },
        React.createElement('button', {
          onClick: () => setIsOpen(!isOpen),
          className: 'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/50'
        }, value || placeholder,
          React.createElement('svg', { className: 'h-4 w-4 opacity-50', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M19 9l-7 7-7-7' })
          )
        ),
        isOpen && React.createElement('div', {
          className: 'absolute z-50 mt-1 w-full rounded-md border border-input bg-card shadow-lg animate-fade-in'
        }, children)
      );
    };
    
    const SelectItem = ({ value, children, onSelect }) => 
      React.createElement('div', {
        onClick: () => onSelect && onSelect(value),
        className: 'px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors'
      }, children);
    
    const Avatar = ({ src, alt, fallback, className = "" }) => 
      React.createElement('div', { className: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full " + className },
        src ? React.createElement('img', { src, alt, className: 'aspect-square h-full w-full object-cover' })
          : React.createElement('div', { className: 'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium' }, fallback)
      );
    
    const Progress = ({ value = 0, className = "" }) =>
      React.createElement('div', { className: 'relative h-2 w-full overflow-hidden rounded-full bg-muted ' + className },
        React.createElement('div', { 
          className: 'h-full bg-primary transition-all duration-300',
          style: { width: value + '%' }
        })
      );
    
    const Separator = ({ className = "", orientation = "horizontal" }) =>
      React.createElement('div', { 
        className: (orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px') + ' bg-border ' + className 
      });
    
    const Skeleton = ({ className = "" }) =>
      React.createElement('div', { className: 'animate-pulse rounded-md bg-muted ' + className });
    
    const Alert = ({ children, variant = "default", className = "" }) => {
      const variants = {
        default: 'bg-card border-border',
        destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
      };
      return React.createElement('div', { 
        className: 'relative w-full rounded-lg border p-4 ' + (variants[variant] || variants.default) + ' ' + className 
      }, children);
    };
    
    const Tabs = ({ children, defaultValue, className = "" }) => {
      const [active, setActive] = useState(defaultValue);
      return React.createElement('div', { className }, 
        React.Children.map(children, child => 
          child && React.cloneElement(child, { active, setActive })
        )
      );
    };
    
    const TabsList = ({ children, active, setActive, className = "" }) =>
      React.createElement('div', { className: 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 ' + className },
        React.Children.map(children, child => 
          child && React.cloneElement(child, { active, setActive })
        )
      );
    
    const TabsTrigger = ({ value, children, active, setActive, className = "" }) =>
      React.createElement('button', {
        onClick: () => setActive(value),
        className: 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none ' + (active === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground') + ' ' + className
      }, children);
    
    const TabsContent = ({ value, children, active, className = "" }) =>
      active === value ? React.createElement('div', { className: 'mt-2 animate-fade-in ' + className }, children) : null;
    
    const Dialog = ({ open, onOpenChange, children }) => {
      if (!open) return null;
      return React.createElement('div', { className: 'fixed inset-0 z-50' },
        React.createElement('div', { 
          className: 'fixed inset-0 bg-black/80 animate-fade-in',
          onClick: () => onOpenChange(false)
        }),
        React.createElement('div', { className: 'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] animate-slide-up' },
          children
        )
      );
    };
    
    const DialogContent = ({ children, className = "" }) =>
      React.createElement('div', { className: 'w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg ' + className }, children);
    
    const DialogHeader = ({ children, className = "" }) =>
      React.createElement('div', { className: 'flex flex-col space-y-1.5 text-center sm:text-left ' + className }, children);
    
    const DialogTitle = ({ children, className = "" }) =>
      React.createElement('h2', { className: 'text-lg font-semibold leading-none tracking-tight ' + className }, children);
    
    const ScrollArea = ({ children, className = "" }) =>
      React.createElement('div', { className: 'overflow-auto ' + className }, children);
    
    const Tooltip = ({ children, content }) => {
      const [show, setShow] = useState(false);
      return React.createElement('div', { 
        className: 'relative inline-block',
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => setShow(false)
      }, children,
        show && React.createElement('div', { 
          className: 'absolute z-50 -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-foreground text-background rounded animate-fade-in whitespace-nowrap'
        }, content)
      );
    };
    
    // Icons (simple SVG components)
    const Icons = {
      Loader: ({ className = "" }) => React.createElement('svg', { className: 'animate-spin ' + className, fill: 'none', viewBox: '0 0 24 24' },
        React.createElement('circle', { className: 'opacity-25', cx: 12, cy: 12, r: 10, stroke: 'currentColor', strokeWidth: 4 }),
        React.createElement('path', { className: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' })
      ),
      Check: ({ className = "" }) => React.createElement('svg', { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
      ),
      X: ({ className = "" }) => React.createElement('svg', { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
      ),
      Plus: ({ className = "" }) => React.createElement('svg', { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 4v16m8-8H4' })
      ),
      Search: ({ className = "" }) => React.createElement('svg', { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
      ),
    };

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

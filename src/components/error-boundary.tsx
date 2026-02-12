import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const contextMessages: Record<string, { title: string; description: string }> = {
  stream: {
    title: "Error en el reproductor",
    description: "Hubo un problema al cargar el stream. Puede deberse a una conexión inestable o a que el stream no está disponible.",
  },
  studio: {
    title: "Error en el editor",
    description: "El editor encontró un problema inesperado. Tu trabajo reciente debería estar guardado automáticamente.",
  },
  artist: {
    title: "Error al cargar artista",
    description: "No pudimos cargar la información del artista. Intentá de nuevo en unos momentos.",
  },
  map: {
    title: "Error en el mapa",
    description: "No se pudo cargar el mapa interactivo. Verificá tu conexión a internet.",
  },
  default: {
    title: "Algo salió mal",
    description: "Ocurrió un error inesperado. Podés intentar recargar la sección o volver al inicio.",
  },
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("🔴 ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const ctx = this.props.context && contextMessages[this.props.context]
        ? contextMessages[this.props.context]
        : contextMessages.default;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6 animate-fade-in">
          <div className="max-w-md w-full text-center space-y-6 bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-8 shadow-card">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">{ctx.title}</h3>
              <p className="text-sm text-muted-foreground">{ctx.description}</p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-32 text-muted-foreground border border-border/30">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                <Home className="h-4 w-4" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

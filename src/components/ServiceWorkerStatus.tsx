import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Download, CheckCircle2, XCircle } from "lucide-react";

export const ServiceWorkerStatus = () => {
  const { 
    isSupported, 
    isRegistered, 
    isUpdateAvailable,
    cacheSize,
    clearCache,
    updateServiceWorker,
    refreshCacheSize
  } = useServiceWorker();

  if (!isSupported) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Caché Offline No Disponible
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta Service Workers para caché offline
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Caché de Thumbnails
          {isRegistered && (
            <Badge variant="secondary" className="ml-auto">
              Activo
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Los thumbnails se guardan en tu navegador para acceso offline y carga instantánea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Thumbnails en caché</p>
            <p className="text-xs text-muted-foreground">
              {cacheSize} imágenes almacenadas localmente
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCacheSize}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </div>

        {isUpdateAvailable && (
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  Actualización disponible
                </p>
                <p className="text-xs text-muted-foreground">
                  Hay una nueva versión del caché disponible
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={updateServiceWorker}
              >
                <Download className="w-4 h-4 mr-1" />
                Actualizar
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>✓ Carga instantánea de thumbnails visitados</p>
          <p>✓ Acceso offline a contenido multimedia</p>
          <p>✓ Reducción del consumo de datos móviles</p>
          <p>✓ Caché automático limitado a 100 thumbnails</p>
        </div>
      </CardContent>
    </Card>
  );
};
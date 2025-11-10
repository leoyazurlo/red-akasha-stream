import { useThumbnailPreload } from "@/hooks/useThumbnailPreload";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Wifi, WifiOff, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ThumbnailPreloadStatus = () => {
  const networkStatus = useNetworkStatus();
  const { isPreloading, preloadedCount, totalToPreload, canPreload, manualPreload } = useThumbnailPreload(true);

  const getConnectionIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="w-5 h-5 text-destructive" />;
    if (networkStatus.isWiFi) return <Wifi className="w-5 h-5 text-primary" />;
    return <Smartphone className="w-5 h-5 text-warning" />;
  };

  const getConnectionLabel = () => {
    if (!networkStatus.isOnline) return 'Sin conexión';
    if (networkStatus.isWiFi) return 'WiFi';
    return 'Datos móviles';
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Precarga Inteligente
          <Badge variant={networkStatus.isWiFi ? "default" : "secondary"} className="ml-auto">
            {getConnectionIcon()}
            <span className="ml-1">{getConnectionLabel()}</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Precarga automática de thumbnails populares cuando estás en WiFi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!networkStatus.isOnline && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Sin conexión a internet. La precarga está pausada.
            </AlertDescription>
          </Alert>
        )}

        {networkStatus.isOnline && !networkStatus.isWiFi && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Estás en datos móviles. La precarga automática está pausada para ahorrar datos.
            </AlertDescription>
          </Alert>
        )}

        {networkStatus.saveData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Modo ahorro de datos activado. La precarga está deshabilitada.
            </AlertDescription>
          </Alert>
        )}

        {isPreloading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precargando thumbnails...</span>
              <span className="font-medium">{preloadedCount}/{totalToPreload}</span>
            </div>
            <Progress value={(preloadedCount / totalToPreload) * 100} className="h-2" />
          </div>
        )}

        {!isPreloading && preloadedCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>{preloadedCount} thumbnails precargados</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <p className="text-sm font-medium">Estado de precarga</p>
            <p className="text-xs text-muted-foreground">
              {canPreload ? 'Listo para precargar' : 'En espera de WiFi'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={manualPreload}
            disabled={!canPreload || isPreloading}
          >
            <Download className="w-4 h-4 mr-1" />
            {isPreloading ? 'Precargando...' : 'Precargar Ahora'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>✓ Solo precarga en WiFi para ahorrar datos móviles</p>
          <p>✓ Top 20 contenidos más populares y recientes</p>
          <p>✓ Precarga automática en segundo plano</p>
          <p>✓ Respeta el modo ahorro de datos del sistema</p>
        </div>
      </CardContent>
    </Card>
  );
};
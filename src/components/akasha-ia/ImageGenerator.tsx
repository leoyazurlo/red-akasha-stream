import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Loader2, Download, Image as ImageIcon } from "lucide-react";

interface ImageGeneratorProps {
  conversationId?: string | null;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
}

const IMAGE_STYLES = [
  { value: "modern", label: "Moderno/Minimalista" },
  { value: "neon", label: "Neón/Cyberpunk" },
  { value: "vintage", label: "Vintage/Retro" },
  { value: "abstract", label: "Abstracto" },
  { value: "graffiti", label: "Graffiti/Street Art" },
  { value: "photorealistic", label: "Fotorrealista" },
  { value: "illustration", label: "Ilustración Digital" },
  { value: "psychedelic", label: "Psicodélico" },
];

const IMAGE_TYPES = [
  { value: "flyer", label: "Flyer de Evento" },
  { value: "banner", label: "Banner/Portada" },
  { value: "artwork", label: "Arte de Álbum" },
  { value: "promotional", label: "Material Promocional" },
  { value: "social", label: "Post para Redes" },
  { value: "general", label: "General" },
];

export function ImageGenerator({ conversationId, onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [imageType, setImageType] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Describe la imagen que quieres generar");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-multimodal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "generate_image",
            data: {
              prompt,
              style,
              imageType,
              conversationId
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al generar imagen");
      }

      if (result.result?.imageUrl) {
        setGeneratedImage(result.result.imageUrl);
        onImageGenerated?.(result.result.imageUrl, prompt);
        toast.success("¡Imagen generada!");
      } else {
        throw new Error("No se recibió la imagen");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar imagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `akasha-ia-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-primary" />
          Generador de Imágenes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Describe la imagen</Label>
          <Textarea
            placeholder="Ej: Flyer para fiesta de techno con colores neón, fecha 15 de marzo, nombre del evento 'PULSE', en un club underground..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de imagen</Label>
            <Select value={imageType} onValueChange={setImageType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estilo artístico</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estilo" />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generar Imagen
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={generatedImage}
                alt="Imagen generada"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGeneratedImage(null);
                  setPrompt("");
                }}
                className="flex-1"
              >
                Nueva imagen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

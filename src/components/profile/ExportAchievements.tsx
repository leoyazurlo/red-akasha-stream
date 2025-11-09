import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportAchievementsProps {
  userName: string;
  stats: {
    threads: number;
    posts: number;
    positiveVotes: number;
    bestAnswers: number;
  };
  badges: {
    bronze: number;
    silver: number;
    gold: number;
    special: number;
    merit: number;
  };
  reputationPoints: number;
}

export const ExportAchievements = ({ 
  userName, 
  stats, 
  badges, 
  reputationPoints 
}: ExportAchievementsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generando imagen...",
        description: "Esto puede tardar unos segundos",
      });

      const { data, error } = await supabase.functions.invoke(
        "generate-achievement-card",
        {
          body: {
            userName,
            stats,
            badges,
            reputationPoints,
          },
        }
      );

      if (error) throw error;

      if (!data.imageUrl) {
        throw new Error("No se generó ninguna imagen");
      }

      // Convert base64 to blob and download
      const base64Response = await fetch(data.imageUrl);
      const blob = await base64Response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `red-akasha-${userName}-logros.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "¡Imagen descargada!",
        description: "Tu tarjeta de logros se ha descargado correctamente",
      });
    } catch (error) {
      console.error("Error generating achievement card:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la imagen de logros",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exportar Logros
        </>
      )}
    </Button>
  );
};

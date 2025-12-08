import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Play, Music, Image, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfilePaidContentProps {
  profileId: string;
  userId: string;
}

export const ProfilePaidContent = ({ profileId, userId }: ProfilePaidContentProps) => {
  const navigate = useNavigate();

  const { data: paidContent, isLoading } = useQuery({
    queryKey: ["profile-paid-content", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_uploads")
        .select("*")
        .eq("uploader_id", userId)
        .eq("is_free", false)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading || !paidContent || paidContent.length === 0) {
    return null;
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "photo":
        return <Image className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "Precio no disponible";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Contenido a la Venta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paidContent.map((content) => (
            <Card 
              key={content.id} 
              className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 group"
              onClick={() => navigate(`/video/${content.id}`)}
            >
              <div className="relative aspect-video bg-muted">
                {content.thumbnail_url ? (
                  <img 
                    src={content.thumbnail_url} 
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getContentIcon(content.content_type)}
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-primary/80">
                  {getContentIcon(content.content_type)}
                  <span className="ml-1 capitalize">{content.content_type}</span>
                </Badge>
                {content.access_type === "rental" && content.rental_price && (
                  <Badge className="absolute top-2 right-2 bg-accent/80">
                    Alquiler disponible
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                  {content.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-primary font-bold">
                      {formatPrice(content.price, content.currency)}
                    </span>
                    {content.rental_price && (
                      <span className="text-xs text-muted-foreground">
                        Alquiler: {formatPrice(content.rental_price, content.currency)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/20">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Comprar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

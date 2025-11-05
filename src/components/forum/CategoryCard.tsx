import { Folder, MessageSquare, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Subforo {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface Category {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  subforos?: Subforo[];
}

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard = ({ category }: CategoryCardProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border shadow-card hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Folder className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">{category.nombre}</h3>
            {category.descripcion && (
              <p className="text-sm text-muted-foreground mt-1">{category.descripcion}</p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {category.subforos && category.subforos.length > 0 ? (
          <div className="space-y-3">
            {category.subforos.map((subforo) => (
              <Link
                key={subforo.id}
                to={`/foro/subforo/${subforo.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {subforo.nombre}
                  </h4>
                  {subforo.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">{subforo.descripcion}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No hay subforos en esta categoría</p>
        )}
      </CardContent>
    </Card>
  );
};

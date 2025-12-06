import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CategoryCard } from "./CategoryCard";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ForumCategories = () => {
  const { t } = useTranslation();
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select(`
          *,
          subforos:forum_subforos(*)
        `)
        .order("orden");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8 shadow-card text-center">
        <p className="text-muted-foreground text-lg">
          {t('forum.noCategories')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};

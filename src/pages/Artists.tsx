import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Mic, Film, FileVideo, Camera, Radio, Search } from "lucide-react";

const genres = [
  { 
    id: "all", 
    label: "Todos", 
    icon: Search, 
    color: "bg-primary/10 hover:bg-primary/20" 
  },
  { 
    id: "bands", 
    label: "Bandas Musicales", 
    icon: Music, 
    color: "bg-purple-500/10 hover:bg-purple-500/20" 
  },
  { 
    id: "podcasts", 
    label: "Podcasts", 
    icon: Mic, 
    color: "bg-blue-500/10 hover:bg-blue-500/20" 
  },
  { 
    id: "documentaries", 
    label: "Documentales", 
    icon: Film, 
    color: "bg-green-500/10 hover:bg-green-500/20" 
  },
  { 
    id: "shorts", 
    label: "Cortos", 
    icon: FileVideo, 
    color: "bg-orange-500/10 hover:bg-orange-500/20" 
  },
  { 
    id: "photography", 
    label: "Fotografía", 
    icon: Camera, 
    color: "bg-pink-500/10 hover:bg-pink-500/20" 
  },
  { 
    id: "radio", 
    label: "Radio Shows", 
    icon: Radio, 
    color: "bg-cyan-500/10 hover:bg-cyan-500/20" 
  },
];

const artistsData = [
  { 
    id: 1, 
    name: "Luna y Los Sueños", 
    genre: "bands", 
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop", 
    followers: "15.2K" 
  },
  { 
    id: 2, 
    name: "Conversaciones Profundas", 
    genre: "podcasts", 
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop", 
    followers: "8.5K" 
  },
  { 
    id: 3, 
    name: "Historias Visuales", 
    genre: "documentaries", 
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=400&fit=crop", 
    followers: "22.1K" 
  },
  { 
    id: 4, 
    name: "Micro Relatos", 
    genre: "shorts", 
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop", 
    followers: "12.8K" 
  },
  { 
    id: 5, 
    name: "Miradas Urbanas", 
    genre: "photography", 
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop", 
    followers: "18.3K" 
  },
  { 
    id: 6, 
    name: "El Sonido Alternativo", 
    genre: "bands", 
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop", 
    followers: "25.6K" 
  },
  { 
    id: 7, 
    name: "Voces del Aire", 
    genre: "radio", 
    image: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop", 
    followers: "9.2K" 
  },
  { 
    id: 8, 
    name: "Cultura Independiente", 
    genre: "podcasts", 
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop", 
    followers: "14.7K" 
  },
];

const Artists = () => {
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArtists = artistsData.filter((artist) => {
    const matchesGenre = selectedGenre === "all" || artist.genre === selectedGenre;
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pt-20 md:pt-24 pb-12 md:pb-16">
        {/* Hero Section */}
        <section className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Explora Artistas
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Descubre creadores de contenido en diferentes géneros artísticos
          </p>
        </section>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12 animate-scale-in px-2">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:pl-12 h-12 md:h-14 text-base md:text-lg border-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Genre Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-10 md:mb-16 px-2">
          {genres.map((genre, index) => {
            const Icon = genre.icon;
            const isSelected = selectedGenre === genre.id;
            
            return (
              <Button
                key={genre.id}
                variant={isSelected ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedGenre(genre.id)}
                className={`
                  group relative overflow-hidden transition-all duration-300
                  hover:scale-105 hover:shadow-elegant
                  text-xs sm:text-sm md:text-base
                  h-9 sm:h-10 md:h-11
                  px-3 sm:px-4 md:px-6
                  ${!isSelected && genre.color}
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:rotate-12" />
                <span className="whitespace-nowrap">{genre.label}</span>
                {isSelected && (
                  <span className="ml-1.5 md:ml-2 bg-background/30 px-1.5 md:px-2 py-0.5 rounded-full text-xs">
                    {filteredArtists.length}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2">
          {filteredArtists.length === 0 ? (
            <div className="col-span-full text-center py-12 md:py-16">
              <p className="text-muted-foreground text-base md:text-lg px-4">
                No se encontraron artistas con los filtros seleccionados
              </p>
            </div>
          ) : (
            filteredArtists.map((artist, index) => (
              <Card
                key={artist.id}
                className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant animate-scale-in hover-scale cursor-pointer"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <CardContent className="p-0">
                  {/* Artist Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={artist.image}
                      alt={`Foto de perfil de ${artist.name}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Genre Badge */}
                    <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-background/90 text-foreground hover:bg-background text-xs">
                      {genres.find(g => g.id === artist.genre)?.label}
                    </Badge>
                  </div>

                  {/* Artist Info */}
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-base md:text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {artist.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground gap-2">
                      <span className="whitespace-nowrap">{artist.followers} seguidores</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs md:text-sm h-7 md:h-8 px-2 md:px-3"
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Call to Action */}
        <section className="mt-12 md:mt-20 text-center animate-fade-in px-2">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                ¿Eres un artista?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 px-2">
                Únete a nuestra comunidad y comparte tu contenido con miles de personas
              </p>
              <Button 
                size="lg" 
                className="hover:scale-105 transition-transform w-full sm:w-auto"
              >
                Asociate Ahora
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Artists;

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Upload, X, Video, Image as ImageIcon, Music, Check, User, LogIn, Plus, Link as LinkIcon } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { RegistrationCompletionBar } from "@/components/RegistrationCompletionBar";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Autocomplete } from "@/components/ui/autocomplete";
import { ContenidoForm } from "@/components/profile-forms/ContenidoForm";
import { ArteDigitalForm } from "@/components/profile-forms/ArteDigitalForm";
import { ManagementForm } from "@/components/profile-forms/ManagementForm";
import { DJForm } from "@/components/profile-forms/DJForm";
import { VJForm } from "@/components/profile-forms/VJForm";
import { MusicLoverForm } from "@/components/profile-forms/MusicLoverForm";
import { RecordingStudioForm } from "@/components/profile-forms/RecordingStudioForm";
import { VenueForm } from "@/components/profile-forms/VenueForm";
import { ProducerForm } from "@/components/profile-forms/ProducerForm";
import { PromoterForm } from "@/components/profile-forms/PromoterForm";
import { BandForm } from "@/components/profile-forms/BandForm";
import { MarketingDigitalForm } from "@/components/profile-forms/MarketingDigitalForm";
import { MusicianForm } from "@/components/profile-forms/MusicianForm";
import { RecordLabelForm } from "@/components/profile-forms/RecordLabelForm";
import { PercusionForm } from "@/components/profile-forms/PercusionForm";
import { DanzaForm } from "@/components/profile-forms/DanzaForm";
import { z } from "zod";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { validateFile, formatFileSize, FILE_COUNT_LIMITS } from "@/lib/storage-validation";
import { passwordSchema } from "@/lib/validations/password";

const argentinaProvincias = [
  { name: "Buenos Aires", cities: ["Adolfo Alsina", "Adolfo Gonzales Chaves", "Alberti", "Almirante Brown", "Arrecifes", "Avellaneda", "Ayacucho", "Azul", "Bahía Blanca", "Balcarce", "Baradero", "Benito Juárez", "Berazategui", "Berisso", "Bolívar", "Bragado", "Brandsen", "Campana", "Cañuelas", "Capitán Sarmiento", "Carlos Casares", "Carlos Tejedor", "Carmen de Areco", "Castelli", "Chacabuco", "Chascomús", "Chivilcoy", "Colón", "Coronel de Marina Leonardo Rosales", "Coronel Dorrego", "Coronel Pringles", "Coronel Suárez", "Daireaux", "Dolores", "Ensenada", "Escobar", "Esteban Echeverría", "Exaltación de la Cruz", "Ezeiza", "Florencio Varela", "Florentino Ameghino", "General Alvarado", "General Alvear", "General Arenales", "General Belgrano", "General Guido", "General Juan Madariaga", "General La Madrid", "General Las Heras", "General Lavalle", "General Paz", "General Pinto", "General Pueyrredón", "General Rodríguez", "General San Martín", "General Viamonte", "General Villegas", "Guaminí", "Hipólito Yrigoyen", "Hurlingham", "Ituzaingó", "José C. Paz", "Junín", "La Costa", "La Matanza", "Lanús", "La Plata", "Laprida", "Las Flores", "Leandro N. Alem", "Lezama", "Lincoln", "Lobería", "Lobos", "Lomas de Zamora", "Luján", "Magdalena", "Maipú", "Malvinas Argentinas", "Mar Chiquita", "Marcos Paz", "Mercedes", "Merlo", "Monte", "Monte Hermoso", "Moreno", "Morón", "Navarro", "Necochea", "9 de Julio", "Olavarría", "Patagones", "Pehuajó", "Pellegrini", "Pergamino", "Pila", "Pilar", "Pinamar", "Presidente Perón", "Puan", "Punta Indio", "Quilmes", "Ramallo", "Rauch", "Rivadavia", "Rojas", "Roque Pérez", "Saavedra", "Saladillo", "Salliqueló", "Salto", "San Andrés de Giles", "San Antonio de Areco", "San Cayetano", "San Fernando", "San Isidro", "San Miguel", "San Nicolás", "San Pedro", "San Vicente", "Suipacha", "Tandil", "Tapalqué", "Tigre", "Tordillo", "Tornquist", "Trenque Lauquen", "Tres Arroyos", "Tres de Febrero", "Tres Lomas", "25 de Mayo", "Vicente López", "Villa Gesell", "Villarino", "Zárate"] },
  { name: "Ciudad Autónoma de Buenos Aires", cities: ["CABA"] },
  { name: "Catamarca", cities: ["San Fernando del Valle de Catamarca", "Andalgalá", "Belén", "Tinogasta"] },
  { name: "Chaco", cities: ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Barranqueras"] },
  { name: "Chubut", cities: ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Rawson"] },
  { name: "Córdoba", cities: ["Córdoba", "Río Cuarto", "Villa María", "San Francisco", "Villa Carlos Paz", "Alta Gracia", "Bell Ville"] },
  { name: "Corrientes", cities: ["Corrientes", "Goya", "Paso de los Libres", "Curuzú Cuatiá", "Mercedes"] },
  { name: "Entre Ríos", cities: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Victoria"] },
  { name: "Formosa", cities: ["Formosa", "Clorinda", "Pirané", "El Colorado"] },
  { name: "Jujuy", cities: ["San Salvador de Jujuy", "San Pedro de Jujuy", "Libertador General San Martín", "Perico", "Humahuaca"] },
  { name: "La Pampa", cities: ["Santa Rosa", "General Pico", "General Acha", "Realicó"] },
  { name: "La Rioja", cities: ["La Rioja", "Chilecito", "Chamical", "Aimogasta"] },
  { name: "Mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Maipú", "Luján de Cuyo", "San Martín", "Tunuyán"] },
  { name: "Misiones", cities: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles", "Leandro N. Alem"] },
  { name: "Neuquén", cities: ["Neuquén", "San Martín de los Andes", "Zapala", "Cutral-Có", "Villa La Angostura", "Centenario"] },
  { name: "Río Negro", cities: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Villa Regina"] },
  { name: "Salta", cities: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Metán", "Cafayate"] },
  { name: "San Juan", cities: ["San Juan", "Rawson", "Chimbas", "Pocito", "Caucete", "Rivadavia"] },
  { name: "San Luis", cities: ["San Luis", "Villa Mercedes", "La Punta", "Merlo", "Justo Daract"] },
  { name: "Santa Cruz", cities: ["Río Gallegos", "Caleta Olivia", "Pico Truncado", "Puerto Deseado", "El Calafate"] },
  { name: "Santa Fe", cities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Reconquista", "San Lorenzo"] },
  { name: "Santiago del Estero", cities: ["Santiago del Estero", "La Banda", "Termas de Río Hondo", "Frías", "Añatuya"] },
  { name: "Tierra del Fuego", cities: ["Ushuaia", "Río Grande", "Tolhuin"] },
  { name: "Tucumán", cities: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción", "Aguilares", "Monteros"] }
];

const latinAmericanCountries = [
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Bolivia", flag: "🇧🇴", code: "BO", cities: ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro", "Potosí"] },
  { name: "Brasil", flag: "🇧🇷", code: "BR", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Curitiba", "Recife"] },
  { name: "Chile", flag: "🇨🇱", code: "CL", cities: ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta", "Temuco"] },
  { name: "Colombia", flag: "🇨🇴", code: "CO", cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira"] },
  { name: "Costa Rica", flag: "🇨🇷", code: "CR", cities: ["San José", "Alajuela", "Cartago", "Heredia", "Limón", "Puntarenas"] },
  { name: "Cuba", flag: "🇨🇺", code: "CU", cities: ["La Habana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara"] },
  { name: "Ecuador", flag: "🇪🇨", code: "EC", cities: ["Quito", "Guayaquil", "Cuenca", "Ambato", "Manta", "Machala"] },
  { name: "El Salvador", flag: "🇸🇻", code: "SV", cities: ["San Salvador", "Santa Ana", "San Miguel", "Soyapango"] },
  { name: "Guatemala", flag: "🇬🇹", code: "GT", cities: ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango"] },
  { name: "Honduras", flag: "🇭🇳", code: "HN", cities: ["Tegucigalpa", "San Pedro Sula", "La Ceiba", "Choloma"] },
  { name: "México", flag: "🇲🇽", code: "MX", cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Cancún"] },
  { name: "Nicaragua", flag: "🇳🇮", code: "NI", cities: ["Managua", "León", "Granada", "Masaya", "Matagalpa"] },
  { name: "Panamá", flag: "🇵🇦", code: "PA", cities: ["Ciudad de Panamá", "Colón", "David", "Santiago"] },
  { name: "Paraguay", flag: "🇵🇾", code: "PY", cities: ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Encarnación"] },
  { name: "Perú", flag: "🇵🇪", code: "PE", cities: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Cusco", "Piura"] },
  { name: "República Dominicana", flag: "🇩🇴", code: "DO", cities: ["Santo Domingo", "Santiago", "La Romana", "San Pedro de Macorís"] },
  { name: "Uruguay", flag: "🇺🇾", code: "UY", cities: ["Montevideo", "Salto", "Paysandú", "Maldonado", "Rivera"] },
  { name: "Venezuela", flag: "🇻🇪", code: "VE", cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"] },
];

const Asociate = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<File[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>(["", ""]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setCurrentUser(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    nombre: "",
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    pais: "",
    provincia: "",
    ciudad: "",
    password: "",
    confirmPassword: "",
    // Campos del perfil específico
    avatar_url: "",
    display_name: "",
    bio: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    whatsapp: "",
    technical_specs: "",
    map_location: "",
    venue_type: "",
    capacity: "",
    genre: "",
    formation_date: "",
    producer_instagram: "",
    recorded_at: "",
    // Campos para Marketing Digital
    marketing_services: [] as string[],
    specialties: "",
    portfolio_url: "",
    // Campos para Músico
    instrument: "",
    experience_level: "",
    education: "",
    available_for: "",
    // Campos para Sello Discográfico
    label_genres: [] as string[],
    website: "",
    services: "",
  });

  // Profile options usando traducciones - ordenados alfabéticamente por value
  const perfilOptions = useMemo(() => [
    { value: "amante_de_la_musica", label: t('asociate.profiles.amante_de_la_musica') },
    { value: "agrupacion_musical", label: t('asociate.profiles.agrupacion_musical') },
    { value: "arte_digital", label: t('asociate.profiles.arte_digital') },
    { value: "danza", label: t('asociate.profiles.danza') },
    { value: "dj", label: t('asociate.profiles.dj') },
    { value: "estudio_grabacion", label: t('asociate.profiles.estudio_grabacion') },
    { value: "management", label: t('asociate.profiles.management') },
    { value: "marketing_digital", label: t('asociate.profiles.marketing_digital') },
    { value: "musico", label: t('asociate.profiles.musico') },
    { value: "percusion", label: t('asociate.profiles.percusion') },
    { value: "productor_artistico", label: t('asociate.profiles.productor_artistico') },
    { value: "productor_audiovisual", label: t('asociate.profiles.productor_audiovisual') },
    { value: "promotor_artistico", label: t('asociate.profiles.promotor_artistico') },
    { value: "representante", label: t('asociate.profiles.representante') },
    { value: "sala_concierto", label: t('asociate.profiles.sala_concierto') },
    { value: "sello_discografico", label: t('asociate.profiles.sello_discografico') },
    { value: "tecnico_sonido", label: t('asociate.profiles.tecnico_sonido') },
    { value: "vj", label: t('asociate.profiles.vj') }
  ], [t]);

  const profileTypeMap: Record<string, string> = {
    "amante_de_la_musica": "amante_de_la_musica",
    "perfil_contenido": "perfil_contenido",
    "productor_artistico": "productor_artistico",
    "productor_audiovisual": "productor_audiovisual",
    "estudio_grabacion": "estudio_grabacion",
    "promotor_artistico": "promotor_artistico",
    "sala_concierto": "sala_concierto",
    "agrupacion_musical": "agrupacion_musical",
    "marketing_digital": "marketing_digital",
    "sello_discografico": "sello_discografico",
    "musico": "musico",
    "arte_digital": "arte_digital",
    "management": "management",
    "representante": "representante",
    "dj": "dj",
    "vj": "vj",
    "percusion": "percusion",
    "danza": "danza",
    "tecnico_sonido": "tecnico_sonido"
  };

  // Preparar opciones de ciudades para autocompletado
  const cityOptions = useMemo(() => {
    if (!formData.pais) return [];
    
    if (formData.pais === "Argentina") {
      const provincia = argentinaProvincias.find(p => p.name === formData.provincia);
      return provincia?.cities.map(city => ({ value: city, label: city })) || [];
    } else {
      const country = latinAmericanCountries.find(c => c.name === formData.pais);
      return country?.cities?.map(city => ({ value: city, label: city })) || [];
    }
  }, [formData.pais, formData.provincia]);

  const getValidationSchema = (profileType: string) => {
    // Schema base común para todos
    const baseSchema = z.object({
      nombre: z.string().trim().min(1, "El nombre completo es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
      email: z.string().trim().email("Ingresa un email válido (ejemplo: usuario@dominio.com)").max(255, "El email es demasiado largo"),
      telefono: z.string().trim().max(20, "El teléfono no puede exceder 20 caracteres").optional().or(z.literal("")),
      pais: z.string().min(1, "Debes seleccionar un país").max(100),
      provincia: z.string().max(100).optional().or(z.literal("")),
      ciudad: z.string().min(1, "Debes seleccionar o ingresar una ciudad").max(100),
      password: passwordSchema,
      confirmPassword: z.string(),
      avatar_url: z.string().min(1, "La foto de perfil es obligatoria. Por favor sube una imagen."),
      bio: z.string().trim().min(200, "La biografía debe tener al menos 200 caracteres (aprox. 4 párrafos cortos)").max(1000, "La biografía no puede exceder 1000 caracteres"),
      instagram: z.string().max(100, "El usuario de Instagram es muy largo").optional().or(z.literal("")),
      facebook: z.string().max(100, "El enlace de Facebook es muy largo").optional().or(z.literal("")),
      linkedin: z.string().max(100, "El enlace de LinkedIn es muy largo").optional().or(z.literal("")),
      whatsapp: z.string().max(20, "El número de WhatsApp es muy largo").optional().or(z.literal("")),
    });

    // Validaciones específicas por tipo de perfil
    let profileSpecificSchema = {};

    switch (profileType) {
      case "agrupacion_musical":
        profileSpecificSchema = {
          genre: z.string().min(1, "Debes seleccionar el género musical de la banda"),
          formation_date: z.string().optional().or(z.literal("")),
          producer_instagram: z.string().max(100).optional().or(z.literal("")),
          recorded_at: z.string().max(200, "El nombre del estudio/productor es muy largo").optional().or(z.literal("")),
        };
        break;

      case "estudio_grabacion":
        profileSpecificSchema = {
          technical_specs: z.string().min(20, "Describe las especificaciones técnicas de tu estudio (mínimo 20 caracteres)").max(2000, "Las especificaciones técnicas son muy largas"),
          map_location: z.string().max(500, "La ubicación del mapa es muy larga").optional().or(z.literal("")),
        };
        break;

      case "sala_concierto":
        profileSpecificSchema = {
          venue_type: z.string().min(1, "Debes seleccionar el tipo de sala o venue"),
          capacity: z.union([z.string(), z.number()]).transform(val => String(val)).refine((val) => val.length > 0 && !isNaN(Number(val)) && Number(val) > 0, {
            message: "La capacidad debe ser un número mayor a 0"
          }),
        };
        break;

      case "marketing_digital":
        profileSpecificSchema = {
          marketing_services: z.array(z.string()).min(1, "Debes seleccionar al menos un servicio que ofreces"),
          specialties: z.string().max(200, "Las especialidades no pueden exceder 200 caracteres").optional().or(z.literal("")),
          portfolio_url: z.string().max(255).refine((val) => {
            if (!val) return true;
            try {
              new URL(val);
              return true;
            } catch {
              return false;
            }
          }, { message: "Ingresa una URL válida para tu portafolio (ejemplo: https://tuportafolio.com)" }).optional().or(z.literal("")),
        };
        break;

      case "musico":
        profileSpecificSchema = {
          instrument: z.string().min(1, "Debes seleccionar tu instrumento principal"),
          genre: z.string().min(1, "Debes seleccionar tu género musical principal"),
          experience_level: z.string().min(1, "Debes seleccionar tu nivel de experiencia"),
          education: z.string().max(200, "La formación académica no puede exceder 200 caracteres").optional().or(z.literal("")),
          available_for: z.string().max(300, "La descripción de disponibilidad es muy larga").optional().or(z.literal("")),
        };
        break;

      case "sello_discografico":
        profileSpecificSchema = {
          display_name: z.string().trim().min(2, "El nombre del sello debe tener al menos 2 caracteres").max(100, "El nombre del sello es muy largo"),
          label_genres: z.array(z.string()).min(1, "Debes seleccionar al menos un género musical que representa el sello"),
          formation_date: z.string().optional().or(z.literal("")),
          website: z.string().max(255).refine((val) => {
            if (!val) return true;
            try {
              new URL(val);
              return true;
            } catch {
              return false;
            }
          }, { message: "Ingresa una URL válida para el sitio web (ejemplo: https://tusello.com)" }).optional().or(z.literal("")),
          services: z.string().max(500, "La descripción de servicios no puede exceder 500 caracteres").optional().or(z.literal("")),
        };
        break;

      case "productor_artistico":
      case "productor_audiovisual":
      case "promotor_artistico":
        // Para estos perfiles, la bio es suficiente
        profileSpecificSchema = {};
        break;

      default:
        profileSpecificSchema = {};
    }

    return baseSchema.extend(profileSpecificSchema).refine((data) => data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden. Por favor verifica que ambas sean iguales.",
      path: ["confirmPassword"],
    });
  };

  const getFunctionInvokeErrorMessage = async (err: unknown): Promise<string> => {
    if (err instanceof FunctionsHttpError) {
      try {
        const body = await err.context.json();
        return String(body?.error || body?.message || `Error (${err.context.status})`);
      } catch {
        return `Error (${err.context.status})`;
      }
    }

    if (err instanceof FunctionsRelayError || err instanceof FunctionsFetchError) {
      return err.message;
    }

    if (err instanceof Error) return err.message;
    return "Error al crear la cuenta";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Require login to add profiles
    if (!currentUser) {
      toast({
        title: "Iniciar sesión requerido",
        description: "Para agregar un perfil, primero debes iniciar sesión con tu cuenta.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedProfiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un tipo de perfil",
        variant: "destructive",
      });
      return;
    }

    // Simplified client-side validation for logged-in users (no password required)
    if (!formData.avatar_url) {
      toast({
        title: "Error de validación",
        description: "La foto de perfil es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bio || formData.bio.trim().length < 200) {
      toast({
        title: "Error de validación",
        description: "La biografía debe tener al menos 200 caracteres para una buena descripción.",
        variant: "destructive",
      });
      return;
    }

    // Check profile completeness (60% minimum)
    const completeness = calculateProfileCompleteness(
      selectedProfiles[0] || "",
      {
        ...formData,
        profile_type: selectedProfiles[0],
        video_links: videoLinks,
        gallery_images: galleryImages,
      }
    );

    if (!completeness.meetsMinimum) {
      toast({
        title: "Perfil incompleto",
        description: `Tu perfil tiene ${completeness.percentage}% de completitud. Necesitás al menos 60% para enviar la solicitud. Revisá los items pendientes.`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.pais || !formData.ciudad) {
      toast({
        title: "Error de validación",
        description: "País y ciudad son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload avatar if needed
      let avatarUrl = formData.avatar_url;
      if (formData.avatar_url && formData.avatar_url.startsWith('data:image/')) {
        try {
          const base64Response = await fetch(formData.avatar_url);
          const blob = await base64Response.blob();
          
          const fileExt = blob.type.split('/')[1];
          const fileName = `${Date.now()}-avatar.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-avatars')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('profile-avatars')
            .getPublicUrl(uploadData.path);

          avatarUrl = publicUrl;
        } catch (uploadError) {
          console.error('Error al subir avatar:', uploadError);
          avatarUrl = null;
        }
      }

      // Step 2: Call add-profile edge function (user must be logged in)
      const profileData = {
        profile_type: profileTypeMap[selectedProfiles[0]],
        profile_types: selectedProfiles.map(p => profileTypeMap[p]),
        nombre: formData.nombre || `${formData.first_name} ${formData.last_name}`.trim() || currentUser.email.split('@')[0],
        display_name: formData.display_name || `${formData.first_name} ${formData.last_name}`.trim(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        pais: formData.pais,
        provincia: formData.provincia,
        ciudad: formData.ciudad,
        telefono: formData.telefono,
        instagram: formData.instagram,
        facebook: formData.facebook,
        linkedin: formData.linkedin,
        whatsapp: formData.whatsapp,
        avatar_url: avatarUrl,
        // Profile-specific fields
        technical_specs: formData.technical_specs,
        map_location: formData.map_location,
        venue_type: formData.venue_type,
        capacity: formData.capacity,
        genre: formData.genre,
        formation_date: formData.formation_date,
        producer_instagram: formData.producer_instagram,
        recorded_at: formData.recorded_at,
        marketing_services: formData.marketing_services,
        specialties: formData.specialties,
        portfolio_url: formData.portfolio_url,
        instrument: formData.instrument,
        experience_level: formData.experience_level,
        education: formData.education,
        available_for: formData.available_for,
        label_genres: formData.label_genres,
        website: formData.website,
        services: formData.services,
        video_links: videoLinks.filter(l => l.trim()),
      };

      const response = await supabase.functions.invoke('add-profile', {
        body: profileData
      });

      if (response.error) {
        const msg = await getFunctionInvokeErrorMessage(response.error);
        throw new Error(msg);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al crear el perfil');
      }

      // Continue with file uploads if any
      const userId = currentUser.id;
      const profileId = response.data.profile_id;

      // Step 3: Upload multimedia files if any
      if (profileId) {
        try {
          // Save video links to profile_galleries as 'video_link' type
          const validVideoLinks = videoLinks.filter(l => l.trim());
          for (let i = 0; i < validVideoLinks.length; i++) {
            await supabase.from('profile_galleries').insert({
              profile_id: profileId,
              url: validVideoLinks[i].trim(),
              media_type: 'video_link',
              order_index: i
            });
          }

          // Upload gallery images
          for (let i = 0; i < galleryImages.length; i++) {
            const file = galleryImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/gallery/${Date.now()}-${i}.${fileExt}`;

            const { data: imageData, error: imageUploadError } = await supabase.storage
              .from('profile-avatars')
              .upload(fileName, file);

            if (!imageUploadError && imageData) {
              const { data: { publicUrl } } = supabase.storage
                .from('profile-avatars')
                .getPublicUrl(imageData.path);

              await supabase.from('profile_galleries').insert({
                profile_id: profileId,
                url: publicUrl,
                media_type: 'photo',
                order_index: i
              });
            }
          }

          // Upload audio
          for (let i = 0; i < uploadedAudios.length; i++) {
            const file = uploadedAudios[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/audio/${Date.now()}-${i}.${fileExt}`;

            const { data: audioData, error: audioUploadError } = await supabase.storage
              .from('profile-avatars')
              .upload(fileName, file);

            if (!audioUploadError && audioData) {
              const { data: { publicUrl } } = supabase.storage
                .from('profile-avatars')
                .getPublicUrl(audioData.path);

              await supabase.from('audio_playlist').insert({
                profile_id: profileId,
                title: file.name.replace(/\.[^/.]+$/, ''),
                audio_url: publicUrl,
                order_index: i
              });
            }
          }
        } catch (uploadError) {
          console.error('Error al subir multimedia:', uploadError);
          // Don't throw error, continue with registration
        }
      }
      
      setSubmitted(true);
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Tu perfil y contenido multimedia se han guardado correctamente.",
      });
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear tu cuenta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfileFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderProfileForm = (profileType: string) => {
    switch (profileType) {
      case "perfil_contenido":
        return <ContenidoForm formData={formData} onChange={handleProfileFieldChange} />;
      case "estudio_grabacion":
        return <RecordingStudioForm formData={formData} onChange={handleProfileFieldChange} />;
      case "sala_concierto":
        return <VenueForm formData={formData} onChange={handleProfileFieldChange} />;
      case "productor_artistico":
        return <ProducerForm formData={formData} onChange={handleProfileFieldChange} />;
      case "promotor_artistico":
        return <PromoterForm formData={formData} onChange={handleProfileFieldChange} />;
      case "agrupacion_musical":
        return <BandForm formData={formData} onChange={handleProfileFieldChange} />;
      case "marketing_digital":
        return <MarketingDigitalForm formData={formData} onChange={handleProfileFieldChange} />;
      case "musico":
        return <MusicianForm formData={formData} onChange={handleProfileFieldChange} />;
      case "sello_discografico":
        return <RecordLabelForm formData={formData} onChange={handleProfileFieldChange} />;
      case "arte_digital":
        return <ArteDigitalForm formData={formData} onChange={handleProfileFieldChange} />;
      case "management":
      case "representante":
        return <ManagementForm formData={formData} onChange={handleProfileFieldChange} />;
      case "dj":
        return <DJForm formData={formData} onChange={handleProfileFieldChange} />;
      case "vj":
        return <VJForm formData={formData} onChange={handleProfileFieldChange} />;
      case "percusion":
        return <PercusionForm formData={formData} onChange={handleProfileFieldChange} />;
      case "danza":
        return <DanzaForm formData={formData} onChange={handleProfileFieldChange} />;
      default:
        return null;
    }
  };

  const handleProfileToggle = (profileValue: string, checked: boolean) => {
    if (checked) {
      setSelectedProfiles(prev => [...prev, profileValue]);
    } else {
      setSelectedProfiles(prev => prev.filter(p => p !== profileValue));
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <CosmicBackground />
      <Header />
      
      <main id="main-content" className="relative pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              {t('asociate.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('asociate.subtitle')}
            </p>
          </div>

          {/* Registration Form */}
          <Card className="border border-cyan-400 bg-gradient-card backdrop-blur-xl shadow-[0_0_25px_hsl(180_100%_50%/0.4),0_0_50px_hsl(180_100%_50%/0.2)] hover:shadow-[0_0_35px_hsl(180_100%_50%/0.6),0_0_70px_hsl(180_100%_50%/0.3)] transition-all duration-500 animate-scale-in">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-16 h-1 bg-gradient-primary rounded-full mx-auto"></div>
              <CardTitle className="text-2xl md:text-3xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('asociate.step1')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkingAuth ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !currentUser ? (
                <div className="text-center py-12 animate-fade-in">
                  <User className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ¡Únete a Red Akasha!
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Para ser parte de nuestra comunidad de artistas y profesionales, completa el formulario de registro.
                  </p>
                  <div className="flex justify-center">
                    <Link to="/auth?tab=signup">
                      <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                        <User className="w-4 h-4" />
                        Asociarse ahora
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    ¿Ya tienes cuenta? <Link to="/auth" className="text-primary hover:underline">Iniciar sesión</Link>
                  </p>
                </div>
              ) : submitted ? (
                <div className="text-center py-12 animate-scale-in">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow"></div>
                    <CheckCircle2 className="w-20 h-20 text-primary mx-auto relative" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {t('asociate.successTitle')}
                  </h3>
                  <p className="text-muted-foreground text-lg">{t('asociate.successMessage')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Logged in user info */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">
                      Sesión iniciada como: <span className="font-medium text-foreground">{currentUser.email}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se creará tu perfil único en la plataforma. Solo se permite un perfil por cuenta. ¡Añadí tus sub-perfiles si los tenés!
                    </p>
                  </div>
                  
                  {/* Profile Type Selection - Multiple Selection */}
                  <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-300">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      {t('asociate.profileType')} *
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({t('asociate.selectMultiple')})
                      </span>
                    </Label>

                    {/* Main profile notice */}
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm">
                      <p className="text-cyan-300 font-medium mb-1">⭐ Perfil principal</p>
                      <p className="text-cyan-200/70">
                        El <strong>primer tipo que selecciones</strong> será tu perfil principal en el Circuito. 
                        Los demás se agregarán como sub-perfiles (badges adicionales). 
                        Solo puedes tener un perfil por cuenta.
                      </p>
                    </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perfilOptions.map((option) => {
                          const isSelected = selectedProfiles.includes(option.value);
                          const isMainProfile = selectedProfiles[0] === option.value;
                          return (
                            <label
                              key={option.value}
                              htmlFor={`profile-${option.value}`}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isMainProfile
                                  ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400/50'
                                  : isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={`profile-${option.value}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleProfileToggle(option.value, !!checked)}
                              />
                              <span className="text-sm font-medium flex-1">
                                {option.label}
                              </span>
                              {isMainProfile && (
                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                                  PRINCIPAL
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      {selectedProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
                          <span className="text-sm text-muted-foreground">{t('asociate.selectedProfiles')}:</span>
                          {selectedProfiles.map((profile, index) => {
                            const option = perfilOptions.find(o => o.value === profile);
                            return (
                              <span
                                key={profile}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                  index === 0 
                                    ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-400/30' 
                                    : 'bg-primary/20 text-primary'
                                }`}
                              >
                                {index === 0 && '⭐ '}
                                {option?.label}
                                <X
                                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProfileToggle(profile, false);
                                  }}
                                />
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="profileSpecification" className="text-sm font-medium">
                          {t('asociate.profileSpecification')}
                        </Label>
                        <Input
                          id="profileSpecification"
                          placeholder={t('asociate.profileSpecificationPlaceholder')}
                          className="bg-background/50 border-border/50"
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('asociate.profileSpecificationHint')}
                        </p>
                      </div>
                    </div>

                    {/* Completion Bar */}
                    {selectedProfiles.length > 0 && (
                      <RegistrationCompletionBar
                        profileType={selectedProfiles[0]}
                        formData={{
                          ...formData,
                          profile_type: selectedProfiles[0],
                          video_links: videoLinks,
                          gallery_images: galleryImages,
                        }}
                      />
                    )}

                    {selectedProfiles.length > 0 && (
                      <div className="border-t border-border/50 pt-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                          <h3 className="text-xl font-semibold">{t('asociate.profilePhoto')}</h3>
                        </div>
                        {/* Show form for primary profile (first selected) */}
                        {renderProfileForm(selectedProfiles[0])}
                      </div>
                    )}

                    <div className="border-t border-border/50 pt-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                        <h3 className="text-xl font-semibold">{t('asociate.step1')}</h3>
                      </div>
                      
                       <div className="grid gap-6 md:grid-cols-2">
                        {/* Profile Photo Upload */}
                        <div className="space-y-3 md:col-span-2 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-5 h-5 text-primary" />
                            <Label className="text-base font-semibold">{t('asociate.profilePhoto')} *</Label>
                          </div>
                          <ImageUpload
                            label=""
                            value={formData.avatar_url}
                            onChange={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                            required
                            allowLocalPreview={true}
                            description={t('asociate.profilePhotoDescription')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-medium">Nombre *</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            required
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-medium">Apellido *</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            required
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Tu apellido"
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tu nombre completo mejora la búsqueda entre perfiles
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefono" className="text-sm font-medium">{t('asociate.phone')}</Label>
                          <Input
                            id="telefono"
                            name="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder={t('asociate.phonePlaceholder')}
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="display_name" className="text-sm font-medium">Nombre Artístico / Display</Label>
                          <Input
                            id="display_name"
                            name="display_name"
                            value={formData.display_name}
                            onChange={handleChange}
                            placeholder="Nombre artístico o de fantasía (opcional)"
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <p className="text-xs text-muted-foreground">Si no lo completás, se usará tu nombre completo</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="pais" className="text-sm font-medium">{t('asociate.country')} *</Label>
                          <Select
                            value={formData.pais}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value, provincia: "", ciudad: "" }))}
                            required
                          >
                            <SelectTrigger className="h-11 hover:border-primary/50 transition-colors">
                              <SelectValue placeholder={t('asociate.selectCountry')} />
                            </SelectTrigger>
                            <SelectContent>
                              {latinAmericanCountries.map((country) => (
                                <SelectItem key={country.code} value={country.name}>
                                  <span className="flex items-center gap-2">
                                    <span className="text-xl">{country.flag}</span>
                                    {country.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.pais === "Argentina" && (
                          <div className="space-y-2 md:col-span-2 animate-fade-in">
                            <Label htmlFor="provincia" className="text-sm font-medium">{t('asociate.province')} *</Label>
                            <Select
                              value={formData.provincia}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, provincia: value, ciudad: "" }))}
                              required
                            >
                              <SelectTrigger className="h-11 hover:border-primary/50 transition-colors">
                                <SelectValue placeholder={t('asociate.selectProvince')} />
                              </SelectTrigger>
                              <SelectContent>
                                {argentinaProvincias.map((provincia) => (
                                  <SelectItem key={provincia.name} value={provincia.name}>
                                    {provincia.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {formData.pais && (formData.pais !== "Argentina" || formData.provincia) && (
                          <div className="space-y-2 md:col-span-2 animate-fade-in">
                            <Label htmlFor="ciudad" className="text-sm font-medium">{t('asociate.city')} *</Label>
                            <Autocomplete
                              options={cityOptions}
                              value={formData.ciudad}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, ciudad: value }))}
                              placeholder={t('asociate.selectCity')}
                              searchPlaceholder={t('common.search')}
                              emptyMessage={t('common.noResults')}
                              className="hover:border-primary/50 transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedProfiles.length > 0 && !selectedProfiles.every(p => p === "amante_de_la_musica") && (
                      <div className="border-t border-border/50 pt-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                          <h3 className="text-xl font-semibold">{t('asociate.uploadMedia')}</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                          {t('asociate.uploadMediaDesc')}
                        </p>
                        
                        {/* YouTube Video Links */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <LinkIcon className="w-5 h-5 text-primary" />
                            Links de video (YouTube, Vimeo) — mínimo 2
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Pegá los links de tus videos en YouTube, Vimeo o Dailymotion.
                          </p>
                          {videoLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                type="url"
                                value={link}
                                onChange={(e) => {
                                  const updated = [...videoLinks];
                                  updated[idx] = e.target.value;
                                  setVideoLinks(updated);
                                }}
                                placeholder={`https://youtube.com/watch?v=... (video ${idx + 1})`}
                                className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                              />
                              {videoLinks.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setVideoLinks(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-destructive hover:scale-110 transition-transform shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {videoLinks.length < 6 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setVideoLinks(prev => [...prev, ""])}
                              className="gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar otro link
                            </Button>
                          )}
                        </div>

                        {/* Gallery Images */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Galería de fotos — mínimo 4
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Subí fotos que muestren tu trabajo, shows, estudio, etc. Mínimo 4, máximo 10.
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles: File[] = [];
                              
                              const totalPhotos = galleryImages.length + files.length;
                              if (totalPhotos > 10) {
                                toast({
                                  title: "Límite de fotos alcanzado",
                                  description: `Máximo 10 fotos. Actualmente tenés ${galleryImages.length}.`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              for (const file of files) {
                                const validation = validateFile(file, 'image');
                                if (!validation.valid) {
                                  toast({
                                    title: t('common.error'),
                                    description: `${file.name}: ${validation.error}`,
                                    variant: "destructive",
                                  });
                                } else {
                                  validFiles.push(file);
                                }
                              }
                              
                              if (validFiles.length > 0) {
                                setGalleryImages(prev => [...prev, ...validFiles]);
                              }
                            }}
                            className="hover:border-primary/50 transition-colors"
                          />
                          {galleryImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {galleryImages.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 px-3 py-2 rounded-lg hover:border-primary/30 transition-colors">
                                  <span className="text-sm">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-destructive hover:scale-110 transition-transform"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {galleryImages.length}/10 fotos — {galleryImages.length < 4 ? `faltan ${4 - galleryImages.length} más` : "✅ mínimo alcanzado"}
                          </p>
                        </div>

                        {/* Upload Audio */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <Music className="w-5 h-5 text-primary" />
                            {t('asociate.audios')}
                          </Label>
                          <Input
                            type="file"
                            accept="audio/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles: File[] = [];
                              
                              for (const file of files) {
                                const validation = validateFile(file, 'audio');
                                if (!validation.valid) {
                                  toast({
                                    title: t('common.error'),
                                    description: `${file.name}: ${validation.error}`,
                                    variant: "destructive",
                                  });
                                } else {
                                  validFiles.push(file);
                                }
                              }
                              
                              if (validFiles.length > 0) {
                                setUploadedAudios(prev => [...prev, ...validFiles]);
                              }
                            }}
                            className="hover:border-primary/50 transition-colors"
                          />
                          {uploadedAudios.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {uploadedAudios.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 px-3 py-2 rounded-lg hover:border-primary/30 transition-colors">
                                  <span className="text-sm">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedAudios(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-destructive hover:scale-110 transition-transform"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-center text-sm text-white mb-2">
                      Tus datos personales serán tratados con responsabilidad y buena fe, conforme a nuestra Política de Privacidad.
                    </p>
                    <p className="text-center text-sm text-cyan-400 mb-4">
                      En Red Akasha.org creemos en la transparencia. Al registrarte, comprometete a que tus datos personales sean reales y completos. Tu sinceridad fortalece la confianza y el espíritu colaborativo que nos une.
                    </p>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-[1.02]" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('asociate.submitting')}
                        </>
                      ) : (
                        t('asociate.submit')
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Asociate;

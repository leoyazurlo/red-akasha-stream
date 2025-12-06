import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Upload, X, Video, Image as ImageIcon, Music, Check } from "lucide-react";
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
import { validateFile, formatFileSize } from "@/lib/storage-validation";

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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
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
    { value: "promotor_artistico", label: t('asociate.profiles.promotor_artistico') },
    { value: "representante", label: t('asociate.profiles.representante') },
    { value: "sala_concierto", label: t('asociate.profiles.sala_concierto') },
    { value: "sello_discografico", label: t('asociate.profiles.sello_discografico') },
    { value: "perfil_contenido", label: t('asociate.profiles.perfil_contenido') },
    { value: "vj", label: t('asociate.profiles.vj') }
  ], [t]);

  const profileTypeMap: Record<string, string> = {
    "perfil_contenido": "perfil_contenido",
    "productor_artistico": "productor_artistico",
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
    "danza": "danza"
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
      password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres para mayor seguridad").max(100, "La contraseña es demasiado larga"),
      confirmPassword: z.string(),
      avatar_url: z.string().min(1, "La foto de perfil es obligatoria. Por favor sube una imagen."),
      bio: z.string().trim().min(10, "La biografía debe tener al menos 10 caracteres para dar una buena descripción").max(1000, "La biografía no puede exceder 1000 caracteres"),
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
          capacity: z.string().min(1, "Debes ingresar la capacidad de la sala").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProfiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un tipo de perfil",
        variant: "destructive",
      });
      return;
    }

    // Client-side validation - validate for primary profile (first selected)
    try {
      const primaryProfile = selectedProfiles[0];
      const validationSchema = getValidationSchema(primaryProfile);
      validationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
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

      // Step 2: Call secure Edge Function for server-side validation and registration
      const registrationData = {
        profile_type: profileTypeMap[selectedProfiles[0]],
        profile_types: selectedProfiles.map(p => profileTypeMap[p]),
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        display_name: formData.display_name,
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
      };

      const response = await supabase.functions.invoke('validate-registration', {
        body: registrationData
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al crear la cuenta');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Error al crear la cuenta');
      }

      // Continue with file uploads if any
      const userId = response.data.user_id;
      const { data: profileQuery } = await supabase
        .from('profile_details')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      const profileId = profileQuery?.id;

      // Step 3: Upload multimedia files if any
      if (profileId) {
        try {
          // Upload videos
          for (let i = 0; i < uploadedVideos.length; i++) {
            const file = uploadedVideos[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/videos/${Date.now()}-${i}.${fileExt}`;

            const { data: videoData, error: videoUploadError } = await supabase.storage
              .from('profile-avatars')
              .upload(fileName, file);

            if (!videoUploadError && videoData) {
              const { data: { publicUrl } } = supabase.storage
                .from('profile-avatars')
                .getPublicUrl(videoData.path);

              await supabase.from('profile_galleries').insert({
                profile_id: profileId,
                url: publicUrl,
                media_type: 'video',
                order_index: i
              });
            }
          }

          // Upload images
          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/images/${Date.now()}-${i}.${fileExt}`;

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
      
      <main className="relative pt-24 pb-16">
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
          <Card className="border border-border/50 bg-gradient-card backdrop-blur-xl shadow-elegant hover:shadow-glow transition-all duration-500 animate-scale-in">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-16 h-1 bg-gradient-primary rounded-full mx-auto"></div>
              <CardTitle className="text-2xl md:text-3xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('asociate.step1')}
              </CardTitle>
            </CardHeader>
            <CardContent>
                {submitted ? (
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
                    {/* Profile Type Selection - Multiple Selection */}
                    <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-300">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        {t('asociate.profileType')} *
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({t('asociate.selectMultiple')})
                        </span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perfilOptions.map((option) => {
                          const isSelected = selectedProfiles.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              htmlFor={`profile-${option.value}`}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected
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
                            </label>
                          );
                        })}
                      </div>
                      {selectedProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
                          <span className="text-sm text-muted-foreground">{t('asociate.selectedProfiles')}:</span>
                          {selectedProfiles.map(profile => {
                            const option = perfilOptions.find(o => o.value === profile);
                            return (
                              <span
                                key={profile}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full"
                              >
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
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="nombre" className="text-sm font-medium">{t('asociate.fullName')} *</Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            required
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder={t('asociate.fullNamePlaceholder')}
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">{t('asociate.email')} *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('asociate.emailPlaceholder')}
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
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
                          <Label htmlFor="password" className="text-sm font-medium">{t('asociate.password')} *</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t('asociate.passwordPlaceholder')}
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('asociate.confirmPassword')} *</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder={t('asociate.confirmPasswordPlaceholder')}
                            className="h-11 hover:border-primary/50 focus:border-primary transition-colors"
                          />
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

                    {selectedProfiles.length > 0 && (
                      <div className="border-t border-border/50 pt-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-gradient-primary rounded-full"></div>
                          <h3 className="text-xl font-semibold">{t('asociate.uploadMedia')}</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                          {t('asociate.uploadMediaDesc')}
                        </p>
                        
                        {/* Upload Videos */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <Video className="w-5 h-5 text-primary" />
                            {t('asociate.videos')}
                          </Label>
                          <Input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles: File[] = [];
                              
                              for (const file of files) {
                                const validation = validateFile(file, 'video');
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
                                setUploadedVideos(prev => [...prev, ...validFiles]);
                              }
                            }}
                            className="hover:border-primary/50 transition-colors"
                          />
                          {uploadedVideos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {uploadedVideos.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 px-3 py-2 rounded-lg hover:border-primary/30 transition-colors">
                                  <span className="text-sm">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedVideos(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-destructive hover:scale-110 transition-transform"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Upload Images */}
                        <div className="space-y-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            {t('asociate.images')}
                          </Label>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const validFiles: File[] = [];
                              
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
                                setUploadedImages(prev => [...prev, ...validFiles]);
                              }
                            }}
                            className="hover:border-primary/50 transition-colors"
                          />
                          {uploadedImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {uploadedImages.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 px-3 py-2 rounded-lg hover:border-primary/30 transition-colors">
                                  <span className="text-sm">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-destructive hover:scale-110 transition-transform"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
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

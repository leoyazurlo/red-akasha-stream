/**
 * @fileoverview Tipos relacionados con perfiles de usuario y artistas.
 * Centraliza todas las interfaces de formularios de perfil.
 */

/** Datos base de un formulario de perfil */
export interface BaseProfileFormData {
  /** URL del avatar del perfil */
  avatar_url?: string;
  /** Biografía o descripción */
  bio?: string;
  /** Usuario de Instagram */
  instagram?: string;
  /** URL de Facebook */
  facebook?: string;
  /** URL de LinkedIn */
  linkedin?: string;
  /** Email de contacto */
  email?: string;
  /** Número de WhatsApp */
  whatsapp?: string;
}

/** Propiedades estándar para componentes de formulario de perfil */
export interface ProfileFormProps<T = Record<string, unknown>> {
  /** Datos actuales del formulario */
  formData: T & BaseProfileFormData;
  /** Callback para actualizar campos del formulario */
  onChange: (field: string, value: unknown) => void;
}

/** Datos de formulario de músico */
export interface MusicianFormData extends BaseProfileFormData {
  instrument?: string;
  genre?: string;
  experience_level?: string;
  education?: string;
  available_for?: string;
}

/** Datos de formulario de DJ */
export interface DJFormData extends BaseProfileFormData {
  genre?: string;
  venues_produced?: string;
}

/** Datos de formulario de productor */
export interface ProducerFormData extends BaseProfileFormData {
  produced_artists?: string;
  studio_name?: string;
  equipment?: string;
}

/** Datos de formulario de promotor */
export interface PromoterFormData extends BaseProfileFormData {
  venues_produced?: string;
}

/** Datos de formulario de representante */
export interface RepresentanteFormData extends BaseProfileFormData {
  produced_artists?: string;
}

/** Datos de formulario de banda */
export interface BandFormData extends BaseProfileFormData {
  band_members?: string;
  genre?: string;
  formation_year?: string;
}

/** Datos de formulario de sello discográfico */
export interface RecordLabelFormData extends BaseProfileFormData {
  roster?: string;
  catalog?: string;
  distribution?: string;
}

/** Datos de formulario de venue/sala */
export interface VenueFormData extends BaseProfileFormData {
  capacity?: number;
  address?: string;
  equipment?: string;
  availability?: string;
}

/** Datos de formulario de estudio de grabación */
export interface RecordingStudioFormData extends BaseProfileFormData {
  equipment?: string;
  services?: string;
  rates?: string;
}

/** Unión de todos los tipos de formulario */
export type AnyProfileFormData = 
  | MusicianFormData 
  | DJFormData 
  | ProducerFormData 
  | PromoterFormData 
  | RepresentanteFormData
  | BandFormData
  | RecordLabelFormData
  | VenueFormData
  | RecordingStudioFormData
  | BaseProfileFormData;

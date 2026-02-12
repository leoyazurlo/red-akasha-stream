import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ExportSheet {
  name: string;
  data: Record<string, unknown>[];
}

export const exportToExcel = async (
  sheets: ExportSheet[],
  filename: string,
  includeTimestamp = true
) => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    if (data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      // Auto-ajustar ancho de columnas
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map(row => String(row[key] ?? '').length)
        ) + 2
      }));
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
    }
  });

  const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HHmmss')}` : '';
  XLSX.writeFile(wb, `${filename}${timestamp}.xlsx`);
};

export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
  includeTimestamp = true
) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const strValue = String(value ?? '');
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const timestamp = includeTimestamp ? `_${format(new Date(), 'yyyy-MM-dd_HHmmss')}` : '';
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return 'N/A';
  }
};

export const formatDateOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  } catch {
    return 'N/A';
  }
};

// Mapeo de tipos de perfil
export const PROFILE_TYPE_LABELS: Record<string, string> = {
  agrupacion_musical: 'Agrupación Musical',
  arte_digital: 'Arte Digital',
  danza: 'Danza',
  dj: 'DJ',
  estudio_grabacion: 'Estudio de Grabación',
  management: 'Management',
  marketing_digital: 'Marketing Digital',
  me_gusta_arte: 'Me Gusta el Arte',
  musico: 'Músico',
  percusion: 'Percusión',
  perfil_contenido: 'Perfil de Contenido',
  productor_artistico: 'Productor Artístico',
  promotor_artistico: 'Promotor Artístico',
  representante: 'Representante',
  sala_concierto: 'Sala de Concierto',
  sello_discografico: 'Sello Discográfico',
  vj: 'VJ',
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  video_musical_vivo: 'Video Musical en Vivo',
  video_clip: 'Video Clip',
  podcast: 'Podcast',
  corto: 'Cortometraje',
  documental: 'Documental',
  pelicula: 'Película',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuario',
  streamer: 'Streamer',
  producer: 'Productor',
};

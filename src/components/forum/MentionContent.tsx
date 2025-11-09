import { Link } from 'react-router-dom';

interface MentionContentProps {
  content: string;
  className?: string;
}

export const MentionContent = ({ content, className = '' }: MentionContentProps) => {
  // Función para renderizar el contenido con menciones resaltadas
  const renderWithMentions = (text: string) => {
    // Expresión regular para detectar menciones @username
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Agregar texto antes de la mención
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Agregar la mención como enlace
      const username = match[1];
      parts.push(
        <Link
          key={`mention-${match.index}`}
          to={`/perfil/${match[0]}`} // Usaremos el username en la URL
          className="text-primary hover:text-primary/80 font-semibold transition-colors bg-primary/10 px-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            // Aquí podrías hacer una búsqueda para obtener el ID real del usuario
          }}
        >
          {match[0]}
        </Link>
      );

      lastIndex = match.index + match[0].length;
    }

    // Agregar el texto restante
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {renderWithMentions(content)}
    </div>
  );
};

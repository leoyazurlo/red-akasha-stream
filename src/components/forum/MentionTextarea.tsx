import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useUserSearch } from '@/hooks/useUserSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export const MentionTextarea = ({
  value,
  onChange,
  placeholder,
  minRows = 4,
}: MentionTextareaProps) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { users, isLoading } = useUserSearch(mentionQuery);

  // Detectar @ y extraer query
  useEffect(() => {
    const text = value.slice(0, cursorPosition);
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const afterAt = text.slice(lastAtIndex + 1);
      // Verificar si no hay espacios después del @
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [value, cursorPosition]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || users.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % users.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectUser(users[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const selectUser = (user: { username: string }) => {
    const text = value;
    const lastAtIndex = text.slice(0, cursorPosition).lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = text.slice(0, lastAtIndex);
      const afterMention = text.slice(cursorPosition);
      const newValue = `${beforeMention}@${user.username} ${afterMention}`;
      
      onChange(newValue);
      setShowMentions(false);
      
      // Mover cursor después de la mención
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = lastAtIndex + user.username.length + 2;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[100px] resize-y"
        style={{ minHeight: `${minRows * 1.5}rem` }}
      />
      
      {showMentions && (mentionQuery.length > 0 || isLoading) && (
        <Card className="absolute z-50 mt-1 w-64 max-h-64 overflow-y-auto bg-card border-border shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="py-1">
              {users.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">@{user.username}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
      
      <p className="text-xs text-muted-foreground mt-2">
        Escribe <span className="font-mono bg-accent px-1 rounded">@</span> para mencionar a un usuario
      </p>
    </div>
  );
};

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

export const UnreadMessagesAlert = () => {
  const { user } = useAuth();
  const { unreadCount, loading } = useUnreadMessages();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasShownAlert = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Reset when user changes (new login)
    if (user?.id !== lastUserId.current) {
      hasShownAlert.current = false;
      lastUserId.current = user?.id || null;
    }

    // Show alert only once per session when user has unread messages
    if (
      user && 
      !loading && 
      unreadCount > 0 && 
      !hasShownAlert.current
    ) {
      hasShownAlert.current = true;
      
      toast({
        title: `💬 Tienes ${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`,
        description: "Haz clic aquí para ver tus mensajes",
        duration: 8000,
        action: (
          <button
            onClick={() => navigate('/mi-perfil?tab=mensajes')}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ver Chats
          </button>
        ),
      });
    }
  }, [user, unreadCount, loading, toast, navigate]);

  return null; // This component doesn't render anything
};

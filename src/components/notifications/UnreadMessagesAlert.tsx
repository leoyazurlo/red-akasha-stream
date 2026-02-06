import { useEffect, useRef } from 'react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGlobalChat } from '@/contexts/GlobalChatContext';
import { MessageSquare } from 'lucide-react';

export const UnreadMessagesAlert = () => {
  const { user } = useAuth();
  const { unreadCount, unreadConversations, loading } = useUnreadMessages();
  const { toast } = useToast();
  const { openChat } = useGlobalChat();
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
      unreadConversations.length > 0 &&
      !hasShownAlert.current
    ) {
      hasShownAlert.current = true;
      
      // Get the most recent unread conversation
      const mostRecent = unreadConversations[0];
      
      toast({
        title: `💬 Tienes ${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer`,
        description: mostRecent 
          ? `Último mensaje de ${mostRecent.partnerName}` 
          : "Haz clic para ver tus mensajes",
        duration: 8000,
        action: (
          <button
            onClick={() => {
              if (mostRecent) {
                openChat({
                  id: mostRecent.partnerId,
                  name: mostRecent.partnerName,
                  avatar: mostRecent.partnerAvatar,
                });
              }
            }}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Abrir Chat
          </button>
        ),
      });
    }
  }, [user, unreadCount, unreadConversations, loading, toast, openChat]);

  return null;
};

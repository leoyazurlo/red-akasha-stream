import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { notifyInfo } from '@/lib/notifications';
import { useGlobalChat } from '@/contexts/GlobalChatContext';
import { MessageSquare } from 'lucide-react';

export const UnreadMessagesAlert = () => {
  const { user } = useAuth();
  const { unreadMessagesCount, unreadMessages, isLoading } = useNotifications();
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
      !isLoading && 
      unreadMessagesCount > 0 && 
      unreadMessages.length > 0 &&
      !hasShownAlert.current
    ) {
      hasShownAlert.current = true;
      
      // Get the most recent unread conversation
      const mostRecent = unreadMessages[0];
      
      notifyInfo(
        `💬 Tienes ${unreadMessagesCount} mensaje${unreadMessagesCount > 1 ? 's' : ''} sin leer`,
        mostRecent 
          ? `Último mensaje de ${mostRecent.senderName}` 
          : "Haz clic para ver tus mensajes"
      );
      
      if (mostRecent) {
        openChat({
          id: mostRecent.senderId,
          name: mostRecent.senderName,
          avatar: mostRecent.senderAvatar,
        });
      }
    }
  }, [user, unreadMessagesCount, unreadMessages, isLoading, openChat]);

  return null;
};

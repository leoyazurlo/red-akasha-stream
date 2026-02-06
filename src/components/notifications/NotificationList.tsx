import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2, Bell, Megaphone, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGlobalChat } from '@/contexts/GlobalChatContext';

interface NotificationListProps {
  onClose: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
  const { 
    notifications, 
    announcements, 
    unreadMessages,
    unreadCount, 
    isLoading, 
    markAllAsRead, 
    markAnnouncementAsRead,
    isAnnouncementRead 
  } = useNotifications();
  const navigate = useNavigate();
  const { openChat } = useGlobalChat();

  const handleAnnouncementClick = (announcement: { id: string; link: string | null }) => {
    markAnnouncementAsRead(announcement.id);
    if (announcement.link) {
      navigate(announcement.link);
      onClose();
    }
  };

  const handleMessageClick = (msg: { senderId: string; senderName: string; senderAvatar: string | null }) => {
    openChat({
      id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderAvatar,
    });
    onClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasContent = notifications.length > 0 || announcements.length > 0 || unreadMessages.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Notificaciones</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="gap-1 text-xs"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[400px]">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Unread Messages Section */}
            {unreadMessages.length > 0 && (
              <>
                <div className="px-4 py-2 bg-cyan-400/10 border-b border-cyan-400/30">
                  <p className="text-xs font-medium text-cyan-400 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Mensajes sin leer ({unreadMessages.reduce((acc, m) => acc + m.unreadCount, 0)})
                  </p>
                </div>
                {unreadMessages.map((msg) => (
                  <div
                    key={`msg-${msg.senderId}`}
                    onClick={() => handleMessageClick(msg)}
                    className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-cyan-400/10 bg-cyan-400/5"
                  >
                    <Avatar className="h-10 w-10 border-2 border-cyan-400/40">
                      <AvatarImage src={msg.senderAvatar || ''} />
                      <AvatarFallback className="bg-cyan-400/20 text-cyan-400 text-sm">
                        {msg.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {msg.senderName}
                        </p>
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {msg.unreadCount} mensaje{msg.unreadCount > 1 ? 's' : ''} sin leer
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(msg.lastMessageDate), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                ))}
              </>
            )}

            {/* Platform Announcements */}
            {announcements.map((announcement) => {
              const isRead = isAnnouncementRead(announcement.id);
              return (
                <div
                  key={`announcement-${announcement.id}`}
                  onClick={() => handleAnnouncementClick(announcement)}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex-shrink-0 p-2 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
                    <Megaphone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {announcement.title}
                      </p>
                      {!isRead && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(announcement.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* User Notifications */}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

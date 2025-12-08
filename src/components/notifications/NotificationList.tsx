import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2, Bell, Megaphone, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationListProps {
  onClose: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
  const { 
    notifications, 
    announcements, 
    unreadCount, 
    isLoading, 
    markAllAsRead, 
    markAnnouncementAsRead,
    isAnnouncementRead 
  } = useNotifications();
  const navigate = useNavigate();

  const handleAnnouncementClick = (announcement: { id: string; link: string | null }) => {
    markAnnouncementAsRead(announcement.id);
    if (announcement.link) {
      navigate(announcement.link);
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasContent = notifications.length > 0 || announcements.length > 0;

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

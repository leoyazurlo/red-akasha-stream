import { useNavigate } from 'react-router-dom';
import { Notification } from '@/hooks/useNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { UserPlus, MessageSquare, Award, ThumbsUp, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const notificationIcons = {
  new_follower: UserPlus,
  new_post: MessageSquare,
  new_badge: Award,
  new_vote: ThumbsUp,
  mention_thread: AtSign,
  mention_post: AtSign,
};

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || MessageSquare;

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 hover:bg-accent/50 cursor-pointer transition-colors',
        !notification.read && 'bg-accent/30'
      )}
    >
      <div className="flex gap-3">
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          !notification.read ? 'bg-primary/20' : 'bg-muted'
        )}>
          <Icon className={cn(
            'h-5 w-5',
            !notification.read ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm mb-1',
            !notification.read ? 'font-semibold text-foreground' : 'text-foreground'
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
        
        {!notification.read && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
        )}
      </div>
    </div>
  );
};

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MessageBell = () => {
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();

  const handleClick = () => {
    navigate('/mi-perfil?tab=mensajes');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={handleClick}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-cyan-400 text-black border-cyan-400 animate-pulse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {unreadCount > 0 
              ? `${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer` 
              : 'Mensajes'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

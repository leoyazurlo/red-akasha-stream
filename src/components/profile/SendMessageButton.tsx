import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { ChatDialog } from './ChatDialog';

interface SendMessageButtonProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string | null;
  currentUserId: string | undefined;
}

export const SendMessageButton = ({ 
  receiverId, 
  receiverName, 
  receiverAvatar,
  currentUserId 
}: SendMessageButtonProps) => {
  const [chatOpen, setChatOpen] = useState(false);

  if (!currentUserId || currentUserId === receiverId) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="gap-2 border-primary/50 hover:bg-primary/20"
        onClick={() => setChatOpen(true)}
      >
        <MessageCircle className="h-4 w-4" />
        Iniciar Chat
      </Button>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        partnerId={receiverId}
        partnerName={receiverName}
        partnerAvatar={receiverAvatar}
      />
    </>
  );
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendMessageButtonProps {
  receiverId: string;
  receiverName: string;
  currentUserId: string | undefined;
}

export const SendMessageButton = ({ receiverId, receiverName, currentUserId }: SendMessageButtonProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  if (!currentUserId || currentUserId === receiverId) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      // Obtener el nombre del remitente
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', currentUserId)
        .single();

      const senderName = senderProfile?.username || senderProfile?.full_name || 'Un usuario';

      // Enviar el mensaje
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          message: message.trim(),
        });

      if (error) throw error;

      // Crear notificación para el receptor
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          type: 'new_message',
          title: 'Nuevo mensaje',
          message: `${senderName} te ha enviado un mensaje`,
          link: '/mi-perfil?tab=mensajes',
          related_user_id: currentUserId,
        });

      toast({
        title: "Mensaje enviado",
        description: `Tu mensaje ha sido enviado a ${receiverName}`,
      });
      setMessage('');
      setOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/20">
          <MessageCircle className="h-4 w-4" />
          Mensaje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>Enviar mensaje a {receiverName}</DialogTitle>
          <DialogDescription>
            Escribe tu mensaje. El usuario recibirá una notificación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="min-h-[120px] resize-none bg-background/50"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={sending || !message.trim()}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};